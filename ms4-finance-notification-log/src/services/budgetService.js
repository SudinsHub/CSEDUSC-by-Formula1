import { budgetRepository } from '../repositories/budgetRepository.js';
import { expenditureRepository } from '../repositories/expenditureRepository.js';
import { notificationQueue } from '../queues/index.js';
import { auditQueue } from '../queues/index.js';

export const budgetService = {
  async submit(data, proposedBy) {
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

    return budget;
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
    if (requesterRole === 'ec_member' && budget.proposed_by !== requesterId) {
      throw new Error('Access denied: You can only view your own budget proposals');
    }

    return budget;
  },

  async approve(id, adminId) {
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

    // Emit notification to EC member
    await notificationQueue.add('budget.decided', {
      userId: budget.proposed_by,
      budgetId: id,
      status: 'approved',
      comment: null,
    });

    // Emit audit log
    await auditQueue.add('audit.action', {
      actor: adminId,
      action: 'budget.approved',
      target: 'budget',
      targetId: id,
    });

    return updatedBudget;
  },

  async reject(id, adminId, comment) {
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

    // Emit notification to EC member
    await notificationQueue.add('budget.decided', {
      userId: budget.proposed_by,
      budgetId: id,
      status: 'rejected',
      comment,
    });

    // Emit audit log
    await auditQueue.add('audit.action', {
      actor: adminId,
      action: 'budget.rejected',
      target: 'budget',
      targetId: id,
      details: { comment },
    });

    return updatedBudget;
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
