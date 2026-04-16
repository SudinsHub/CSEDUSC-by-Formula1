import { logService } from '../../services/logService.js';

export const logController = {
  async list(req, res) {
    try {
      const userRole = req.headers['x-user-role'];

      // Only admins can view activity logs
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Only admins can view activity logs' });
      }

      const filters = {
        actorUserId: req.query.actorUserId ? parseInt(req.query.actorUserId, 10) : undefined,
        actionType: req.query.actionType,
        targetEntity: req.query.targetEntity,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
      };

      const logs = await logService.list(filters);
      res.json(logs);
    } catch (error) {
      console.error('Error listing logs:', error);
      res.status(500).json({ error: 'Failed to list logs' });
    }
  },
};
