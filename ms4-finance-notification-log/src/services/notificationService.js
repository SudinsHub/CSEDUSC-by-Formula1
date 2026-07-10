import { notificationRepository } from '../repositories/notificationRepository.js';
import { emailService } from './emailService.js';
import { auditQueue } from '../queues/index.js';
import { config } from '../config.js';

export const notificationService = {
  async getNotifications(userId) {
    const list = await notificationRepository.findByUserId(userId);
    const unreadCount = await notificationRepository.getUnreadCountByUserId(userId);
    return { notifications: list, unreadCount };
  },

  async markRead(id, userId) {
    const notif = await notificationRepository.findById(id);
    if (!notif) {
      throw new Error('Notification not found');
    }
    if (notif.userId !== userId) {
      throw new Error('Access denied');
    }
    return await notificationRepository.markAsRead(id);
  },

  async markAllRead(userId) {
    return await notificationRepository.markAllAsRead(userId);
  },

  async deleteNotification(id, userId) {
    const notif = await notificationRepository.findById(id);
    if (!notif) {
      throw new Error('Notification not found');
    }
    if (notif.userId !== userId) {
      throw new Error('Access denied');
    }
    return await notificationRepository.delete(id);
  },

  async submitContact(data) {
    const { name, email, message } = data;

    // Spam check
    const isSpam = await notificationRepository.checkSpam(email);
    if (isSpam) {
      const err = new Error('Too many requests. Please wait before submitting again.');
      err.status = 429;
      throw err;
    }

    // Send email to admin (both sender and receiver are SMTP_USER as requested)
    const adminEmail = config.smtp.user;
    const subject = `CSEDU Club - Guest Contact Message from ${name}`;
    const emailBody = emailService.renderTemplate('contact_submission', { name, email, message });
    await emailService.send(adminEmail, subject, emailBody);

    // Create in-app notifications for all admins
    const admins = await notificationRepository.findAdmins();
    for (const admin of admins) {
      await notificationRepository.insert({
        userId: admin.userId,
        title: 'New Guest Contact Form Message',
        message: `Guest ${name} (${email}) sent a message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
        type: 'contact_submission',
        details: { name, email, message },
      });
    }

    return { message: 'Message sent successfully' };
  },

  async submitPendingContact(data, senderUserId = null) {
    const { name, email, message } = data;

    // Spam check
    const isSpam = await notificationRepository.checkSpam(email);
    if (isSpam) {
      const err = new Error('Too many requests. Please wait before submitting again.');
      err.status = 429;
      throw err;
    }

    // Send email to admin
    const adminEmail = config.smtp.user;
    const subject = `Urgent: Registration Validation Request from ${name}`;
    const emailBody = emailService.renderTemplate('pending_approval_contact', { name, email, message });
    await emailService.send(adminEmail, subject, emailBody);

    // Create in-app notifications for all admins
    const admins = await notificationRepository.findAdmins();
    for (const admin of admins) {
      await notificationRepository.insert({
        userId: admin.userId,
        title: 'Urgent: Registration Validation Request',
        message: `Pending user ${name} (${email}) requested approval: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
        type: 'pending_approval',
        details: { name, email, message, senderUserId },
      });
    }

    return { message: 'Inquiry submitted successfully' };
  },

  async sendCustomNotification(data, adminId) {
    const { recipientType, recipientValue, deliveryMethod, title, message } = data;

    // 1. Resolve recipients
    let recipients = [];
    if (recipientType === 'all') {
      recipients = await notificationRepository.findAllUsers();
    } else if (recipientType === 'role') {
      // Map frontend roles if necessary (e.g. 'GeneralStudent', 'ECMember', 'Administrator')
      recipients = await notificationRepository.findUsersByRole(recipientValue);
    } else if (recipientType === 'user') {
      const singleUser = await notificationRepository.findUserByIdOrEmail(recipientValue);
      if (!singleUser) {
        const err = new Error(`Recipient user not found: ${recipientValue}`);
        err.status = 404;
        throw err;
      }
      recipients = [singleUser];
    }

    if (recipients.length === 0) {
      return { message: 'No active recipients found for the specified target' };
    }

    const sendEmail = deliveryMethod === 'email' || deliveryMethod === 'both';
    const createInApp = deliveryMethod === 'in_app' || deliveryMethod === 'both';

    // 2. Distribute messages
    const emailSubject = `CSEDU Students' Club Announcement: ${title}`;
    const emailBody = emailService.renderTemplate('custom_message', { message });

    for (const recipient of recipients) {
      if (sendEmail && recipient.email) {
        try {
          await emailService.send(recipient.email, emailSubject, emailBody);
        } catch (err) {
          console.error(`Failed to send custom email to ${recipient.email}:`, err);
          // Continue to next recipient even if one fails
        }
      }

      if (createInApp) {
        await notificationRepository.insert({
          userId: recipient.userId,
          title,
          message,
          type: 'custom',
          details: { senderAdminId: adminId },
        });
      }
    }

    // 3. Log the action in audit logs
    await auditQueue.add('audit.action', {
      actor: adminId,
      action: 'notification.custom_broadcast',
      target: 'user',
      targetId: adminId,
      details: { recipientType, recipientValue, deliveryMethod, recipientsCount: recipients.length },
    });

    return { message: `Notification successfully delivered to ${recipients.length} user(s)` };
  },

  async retryFailedEmail(id, userId, newEmail) {
    const notif = await notificationRepository.findById(id);
    if (!notif) {
      throw new Error('Notification not found');
    }
    if (notif.userId !== userId) {
      throw new Error('Access denied');
    }
    if (notif.type !== 'failed_email') {
      throw new Error('Notification is not a failed email');
    }

    const details = notif.details || {};
    let toAddress = newEmail || details.to;
    if (!toAddress) {
      throw new Error('No recipient email address specified');
    }

    try {
      await emailService.send(toAddress, details.subject || 'Notification Retry', details.body || '');
      
      // If successful, delete the failed notification from DB
      await notificationRepository.delete(id);
      return { message: 'Email sent successfully and removed from failed list' };
    } catch (error) {
      console.error(`Retry send to ${toAddress} failed:`, error);
      
      // Update details with new recipient and new error
      const updatedDetails = {
        ...details,
        to: toAddress,
        error: error.message
      };
      await notificationRepository.updateDetails(id, updatedDetails);
      
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
};
