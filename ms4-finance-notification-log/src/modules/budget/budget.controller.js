import { budgetService } from '../../services/budgetService.js';

export const budgetController = {
  async submit(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10);
      const userRole = req.headers['x-user-role'];

      // Only EC members and admins can submit budgets
      if (userRole !== 'ec_member' && userRole !== 'admin') {
        return res.status(403).json({ error: 'Only EC members and admins can submit budget proposals' });
      }

      const budget = await budgetService.submit(req.body, userId);
      res.status(201).json(budget);
    } catch (error) {
      console.error('Error submitting budget:', error);
      res.status(500).json({ error: 'Failed to submit budget' });
    }
  },

  async list(req, res) {
    try {
      const budgets = await budgetService.list();
      res.json(budgets);
    } catch (error) {
      console.error('Error listing budgets:', error);
      res.status(500).json({ error: 'Failed to list budgets' });
    }
  },

  async getById(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10);
      const userRole = req.headers['x-user-role'];
      const budgetId = parseInt(req.params.id, 10);

      const budget = await budgetService.getById(budgetId, userId, userRole);
      res.json(budget);
    } catch (error) {
      if (error.message === 'Budget not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      console.error('Error getting budget:', error);
      res.status(500).json({ error: 'Failed to get budget' });
    }
  },

  async approve(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10);
      const userRole = req.headers['x-user-role'];
      const budgetId = parseInt(req.params.id, 10);

      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Only admins can approve budgets' });
      }

      const budget = await budgetService.approve(budgetId, userId);
      res.json(budget);
    } catch (error) {
      if (error.message === 'Budget not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('already been reviewed')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error approving budget:', error);
      res.status(500).json({ error: 'Failed to approve budget' });
    }
  },

  async reject(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10);
      const userRole = req.headers['x-user-role'];
      const budgetId = parseInt(req.params.id, 10);
      const { comment } = req.body;

      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Only admins can reject budgets' });
      }

      const budget = await budgetService.reject(budgetId, userId, comment);
      res.json(budget);
    } catch (error) {
      if (error.message === 'Budget not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('already been reviewed')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error rejecting budget:', error);
      res.status(500).json({ error: 'Failed to reject budget' });
    }
  },

  async recordExpenditure(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10);
      const userRole = req.headers['x-user-role'];
      const budgetId = parseInt(req.params.id, 10);

      // Only EC members and admins can record expenditures
      if (userRole !== 'ec_member' && userRole !== 'admin') {
        return res.status(403).json({ error: 'Only EC members and admins can record expenditures' });
      }

      const expenditure = await budgetService.recordExpenditure(budgetId, req.body, userId);
      res.status(201).json(expenditure);
    } catch (error) {
      if (error.message === 'Budget not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('non-approved budget')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error recording expenditure:', error);
      res.status(500).json({ error: 'Failed to record expenditure' });
    }
  },

  async listExpenditures(req, res) {
    try {
      const budgetId = parseInt(req.params.id, 10);
      const expenditures = await budgetService.listExpenditures(budgetId);
      res.json(expenditures);
    } catch (error) {
      console.error('Error listing expenditures:', error);
      res.status(500).json({ error: 'Failed to list expenditures' });
    }
  },
};
