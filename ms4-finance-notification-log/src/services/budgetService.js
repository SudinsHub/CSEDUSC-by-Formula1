import { budgetRepository } from '../repositories/budgetRepository.js';
import { expenditureRepository } from '../repositories/expenditureRepository.js';
import { notificationQueue } from '../queues/index.js';
import { auditQueue } from '../queues/index.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { emailService } from './emailService.js';
import { config } from '../config.js';

export const budgetService = {
  async submit(data, proposedBy) {
    const { notifyAdmins = true, adminMessage } = data;
    const budget = await budgetRepository.insert({
      ...data,
      proposedBy,
    });

    // Emit audit log
    await auditQueue.add('audit.action', {
      actor: proposedBy,
      action: 'budget.submitted',
      target: 'budget',
      targetId: budget.budget_id,
      details: { totalAmount: budget.total_amount },
    });

    let emailFailed = false;

    if (notifyAdmins) {
      try {
        const admins = await notificationRepository.findAdmins();
        const adminEmails = admins.map(a => a.email).filter(Boolean);
        const subject = `New Budget Proposal Submitted - ID: #${budget.budget_id}`;
        
        const messageBody = adminMessage || `I have submitted a new budget proposal for our upcoming event. Please review and approve it.`;
        const emailHtml = emailService.renderTemplate('budget.submitted', { message: messageBody });

        // Save in-app notification to each admin
        for (const admin of admins) {
          await notificationRepository.insert({
            userId: admin.userId,
            title: 'New Budget Proposal Submitted',
            message: `Budget ID: #${budget.budget_id} has been submitted by user ID: ${proposedBy} for BDT ${budget.total_amount}.`,
            type: 'budget_update',
            details: { budgetId: budget.budget_id, totalAmount: budget.total_amount }
          });
        }

        // Send email to all admins
        const failedAdmins = [];
        for (const email of adminEmails) {
          try {
            await emailService.send(email, subject, emailHtml);
          } catch (err) {
            console.error(`Failed to send budget submit notification to admin ${email}:`, err);
            failedAdmins.push(email);
          }
        }

        if (failedAdmins.length > 0) {
          emailFailed = true;
          // Store failed email in the submitter's inbox
          await notificationRepository.insert({
            userId: proposedBy,
            title: 'Failed to notify admins via email',
            message: `We were unable to send notification email to the following administrators: ${failedAdmins.join(', ')}. The budget was submitted, but you can retry sending the emails from your inbox.`,
            type: 'failed_email',
            details: {
              to: failedAdmins.join(','),
              subject,
              body: emailHtml,
              error: 'SMTP send failed'
            }
          });
        }
      } catch (err) {
        console.error('Failed to notify admins on budget submit:', err);
        emailFailed = true;
        // Store failed email in the submitter's inbox
        await notificationRepository.insert({
          userId: proposedBy,
          title: 'Failed to notify admins via email',
          message: `An error occurred while preparing notifications: ${err.message}. You can retry sending from your inbox.`,
          type: 'failed_email',
          details: {
            to: config.smtp.user,
            subject: `New Budget Proposal Submitted - ID: #${budget.budget_id}`,
            body: adminMessage || 'New budget proposal submitted',
            error: err.message
          }
        });
      }
    }

    return {
      ...budget,
      emailFailed,
    };
  },

  async list() {
    return await budgetRepository.findAll();
  },

  async getById(id, requesterId, requesterRole) {
    const budget = await budgetRepository.findById(id);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    // FR23: EC members can only view their own budget proposals
                // 'GeneralStudent', 'ECMember', 'Administrator'

    if (requesterRole === 'ECMember' && budget.proposed_by !== requesterId) {
      throw new Error('Access denied: You can only view your own budget proposals');
    }

    return budget;
  },

  async approve(id, adminId, notifyRequester = true, customMessage = '') {
    const budget = await budgetRepository.findById(id);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    if (budget.status !== 'pending_review') {
      throw new Error('Budget has already been reviewed');
    }

    const updatedBudget = await budgetRepository.updateStatus(
      id,
      'approved',
      adminId,
      null
    );

    // Emit audit log
    await auditQueue.add('audit.action', {
      actor: adminId,
      action: 'budget.approved',
      target: 'budget',
      targetId: id,
    });

    let emailFailed = false;

    if (notifyRequester) {
      try {
        const requesterId = budget.proposed_by;
        const requester = await notificationRepository.findUserByIdOrEmail(requesterId);
        
        if (!requester || !requester.email) {
          throw new Error(`Requester user not found or does not have an email: ID ${requesterId}`);
        }

        const messageBody = customMessage || `Your budget proposal has been approved. You can now proceed with the planned activities and record expenditures.`;
        const subject = `Budget Proposal Approved - ID: #${id}`;
        const emailHtml = emailService.renderTemplate('budget.decided_custom', { status: 'approved', message: messageBody });

        // Save in-app notification to requester
        await notificationRepository.insert({
          userId: requesterId,
          title: 'Budget Proposal Approved',
          message: `Your budget proposal (ID: #${id}) has been approved by the administrator.`,
          type: 'budget_update',
          details: { budgetId: id, status: 'approved' }
        });

        // Send email to requester
        await emailService.send(requester.email, subject, emailHtml);
      } catch (err) {
        console.error(`Failed to send budget approval notification to requester:`, err);
        emailFailed = true;
        let reqEmail = '';
        try {
          const u = await notificationRepository.findUserByIdOrEmail(budget.proposed_by);
          reqEmail = u?.email || '';
        } catch (_) {}

        // Store failed email in the admin's inbox (the one who approved it)
        await notificationRepository.insert({
          userId: adminId,
          title: 'Failed to notify requester via email',
          message: `We were unable to send the approval email to the requester ${reqEmail || `(User ID: ${budget.proposed_by})`}. The budget status was updated to approved, but you can retry sending the email from your inbox.`,
          type: 'failed_email',
          details: {
            to: reqEmail || String(budget.proposed_by),
            subject: `Budget Proposal Approved - ID: #${id}`,
            body: customMessage || 'Your budget proposal has been approved.',
            error: err.message
          }
        });
      }
    }

    return {
      ...updatedBudget,
      emailFailed,
    };
  },

  async reject(id, adminId, comment, notifyRequester = true, customMessage = '') {
    const budget = await budgetRepository.findById(id);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    if (budget.status !== 'pending_review') {
      throw new Error('Budget has already been reviewed');
    }

    const updatedBudget = await budgetRepository.updateStatus(
      id,
      'rejected',
      adminId,
      comment
    );

    // Emit audit log
    await auditQueue.add('audit.action', {
      actor: adminId,
      action: 'budget.rejected',
      target: 'budget',
      targetId: id,
      details: { comment },
    });

    let emailFailed = false;

    if (notifyRequester) {
      try {
        const requesterId = budget.proposed_by;
        const requester = await notificationRepository.findUserByIdOrEmail(requesterId);
        
        if (!requester || !requester.email) {
          throw new Error(`Requester user not found or does not have an email: ID ${requesterId}`);
        }

        const messageBody = customMessage || `Your budget proposal has been rejected. Please review the feedback and make the necessary modifications before resubmitting. Comment: ${comment || 'No comment provided.'}`;
        const subject = `Budget Proposal Rejected - ID: #${id}`;
        const emailHtml = emailService.renderTemplate('budget.decided_custom', { status: 'rejected', message: messageBody });

        // Save in-app notification to requester
        await notificationRepository.insert({
          userId: requesterId,
          title: 'Budget Proposal Rejected',
          message: `Your budget proposal (ID: #${id}) has been rejected by the administrator. Comment: ${comment || 'No explanation provided.'}`,
          type: 'budget_update',
          details: { budgetId: id, status: 'rejected', comment }
        });

        // Send email to requester
        await emailService.send(requester.email, subject, emailHtml);
      } catch (err) {
        console.error(`Failed to send budget rejection notification to requester:`, err);
        emailFailed = true;
        let reqEmail = '';
        try {
          const u = await notificationRepository.findUserByIdOrEmail(budget.proposed_by);
          reqEmail = u?.email || '';
        } catch (_) {}

        // Store failed email in the admin's inbox (the one who rejected it)
        await notificationRepository.insert({
          userId: adminId,
          title: 'Failed to notify requester via email',
          message: `We were unable to send the rejection email to the requester ${reqEmail || `(User ID: ${budget.proposed_by})`}. The budget status was updated to rejected, but you can retry sending the email from your inbox.`,
          type: 'failed_email',
          details: {
            to: reqEmail || String(budget.proposed_by),
            subject: `Budget Proposal Rejected - ID: #${id}`,
            body: customMessage || `Your budget proposal has been rejected. Comment: ${comment}`,
            error: err.message
          }
        });
      }
    }

    return {
      ...updatedBudget,
      emailFailed,
    };
  },

  async recordExpenditure(budgetId, data, recordedBy) {
    const budget = await budgetRepository.findById(budgetId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }

    if (budget.status !== 'approved') {
      throw new Error('Cannot record expenditure for non-approved budget');
    }

    const expenditure = await expenditureRepository.insert({
      budgetId,
      ...data,
      recordedBy,
    });

    // Emit audit log
    await auditQueue.add('audit.action', {
      actor: recordedBy,
      action: 'expenditure.recorded',
      target: 'expenditure',
      targetId: expenditure.expenditure_id,
      details: {
        budgetId,
        amount: expenditure.amount,
        category: expenditure.category,
      },
    });

    return expenditure;
  },

  async listExpenditures(budgetId) {
    return await expenditureRepository.findByBudget(budgetId);
  },
};
