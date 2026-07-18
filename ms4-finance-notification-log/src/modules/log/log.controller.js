import { logService } from '../../services/logService.js';

export const logController = {
  async list(req, res) {
    try {
      const userRole = req.headers['x-user-role'];

      // Only admins can view activity logs
      if (userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Only admins can view activity logs' });
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
        actorUserId: req.query.actorUserId ? parseInt(req.query.actorUserId, 10) : undefined,
        actionType: req.query.actionType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search,
      };

      const result = await logService.list(filters);
      res.json(result);
    } catch (error) {
      console.error('Error listing logs:', error);
      res.status(500).json({ error: 'Failed to list logs' });
    }
  },

  async delete(req, res) {
    try {
      const userRole = req.headers['x-user-role'];

      // Only admins can delete activity logs
      if (userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Only admins can manage activity logs' });
      }

      const filters = {
        beforeDate: req.query.beforeDate,
        actorUserId: req.query.actorUserId ? parseInt(req.query.actorUserId, 10) : undefined,
        actionType: req.query.actionType,
      };

      const deletedCount = await logService.delete(filters);
      res.json({
        message: 'Activity logs deleted successfully',
        deletedCount,
      });
    } catch (error) {
      console.error('Error deleting logs:', error);
      res.status(500).json({ error: 'Failed to delete logs' });
    }
  },
};
