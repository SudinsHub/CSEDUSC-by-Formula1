import { notificationService } from '../../services/notificationService.js';

export const notificationController = {
  async list(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10);
      if (isNaN(userId)) {
        return res.status(401).json({ error: 'Unauthorized: missing user ID header' });
      }

      const result = await notificationService.getNotifications(userId);
      res.json(result);
    } catch (error) {
      console.error('Error listing notifications:', error);
      res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
  },

  async markRead(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10);
      const id = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updated = await notificationService.markRead(id, userId);
      res.json(updated);
    } catch (error) {
      if (error.message === 'Notification not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  },

  async markAllRead(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10);
      if (isNaN(userId)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updated = await notificationService.markAllRead(userId);
      res.json({ message: `Successfully marked ${updated.length} notifications as read` });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to update notifications' });
    }
  },

  async delete(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10);
      const id = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await notificationService.deleteNotification(id, userId);
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      if (error.message === 'Notification not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  },

  async contact(req, res) {
    try {
      const result = await notificationService.submitContact(req.body);
      res.status(200).json(result);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error('Error in public contact form:', error);
      res.status(500).json({ error: error.message || 'Failed to submit contact message' });
    }
  },

  async pendingContact(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10) || null;
      const result = await notificationService.submitPendingContact(req.body, userId);
      res.status(200).json(result);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error('Error in pending contact form:', error);
      res.status(500).json({ error: error.message || 'Failed to submit inquiry' });
    }
  },

  async sendCustom(req, res) {
    try {
      const userId = parseInt(req.headers['x-user-id'], 10);
      const userRole = req.headers['x-user-role'];

      if (isNaN(userId) || userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Only administrators can broadcast custom notifications' });
      }

      const result = await notificationService.sendCustomNotification(req.body, userId);
      res.status(200).json(result);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error('Error in custom broadcast:', error);
      res.status(500).json({ error: error.message || 'Failed to send broadcast' });
    }
  }
};
