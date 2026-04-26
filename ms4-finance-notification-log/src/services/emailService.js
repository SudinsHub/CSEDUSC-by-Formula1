import nodemailer from 'nodemailer';
import { config } from '../config.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  async send(to, subject, body) {
    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html: body,
      });
      
      console.log(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  renderTemplate(type, data) {
    const templates = {
      'user.approved': (d) => `
        <h2>Welcome to CSEDU Students' Club!</h2>
        <p>Dear ${d.name},</p>
        <p>Your registration has been approved. You can now log in and access all club features.</p>
        <p>Best regards,<br>CSEDU Students' Club</p>
      `,
      
      'user.rejected': (d) => `
        <h2>Registration Update</h2>
        <p>Dear ${d.name},</p>
        <p>We regret to inform you that your registration has been rejected.</p>
        ${d.reason ? `<p><strong>Reason:</strong> ${d.reason}</p>` : ''}
        <p>If you have any questions, please contact the club administration.</p>
        <p>Best regards,<br>CSEDU Students' Club</p>
      `,
      
      'election.announced': (d) => `
        <h2>New Election Announced: ${d.title}</h2>
        <p>Dear Student,</p>
        <p>A new election has been announced and is now open for voting.</p>
        <p><strong>Election:</strong> ${d.title}</p>
        <p><strong>Voting Period:</strong> ${new Date(d.startTime).toLocaleString()} - ${new Date(d.endTime).toLocaleString()}</p>
        <p>Please log in to the club portal to cast your vote.</p>
        <p>Best regards,<br>CSEDU Students' Club</p>
      `,
      
      'event.registered': (d) => `
        <h2>Event Registration Confirmed</h2>
        <p>Dear Student,</p>
        <p>Your registration for the event <strong>${d.eventTitle}</strong> has been confirmed.</p>
        <p><strong>Event Date:</strong> ${new Date(d.eventDate).toLocaleString()}</p>
        <p><strong>Location:</strong> ${d.location}</p>
        <p>We look forward to seeing you there!</p>
        <p>Best regards,<br>CSEDU Students' Club</p>
      `,
      
      'volunteer.decided': (d) => `
        <h2>Volunteer Application ${d.status === 'approved' ? 'Approved' : 'Update'}</h2>
        <p>Dear Student,</p>
        <p>Your volunteer application for <strong>${d.eventTitle}</strong> has been ${d.status}.</p>
        ${d.status === 'approved' ? 
          '<p>Thank you for volunteering! We will contact you with further details soon.</p>' :
          '<p>Thank you for your interest. We encourage you to apply for future events.</p>'
        }
        <p>Best regards,<br>CSEDU Students' Club</p>
      `,
      
      'budget.decided': (d) => `
        <h2>Budget Proposal ${d.status === 'approved' ? 'Approved' : 'Rejected'}</h2>
        <p>Dear EC Member,</p>
        <p>Your budget proposal (ID: ${d.budgetId}) has been ${d.status}.</p>
        ${d.comment ? `<p><strong>Admin Comment:</strong> ${d.comment}</p>` : ''}
        ${d.status === 'approved' ? 
          '<p>You can now proceed with the planned activities and record expenditures.</p>' :
          '<p>Please review the feedback and consider resubmitting with modifications if appropriate.</p>'
        }
        <p>Best regards,<br>CSEDU Students' Club</p>
      `,
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown email template: ${type}`);
    }

    return template(data);
  }
}

export const emailService = new EmailService();
