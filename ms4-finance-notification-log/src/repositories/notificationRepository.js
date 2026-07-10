import pool from '../db.js';

export const notificationRepository = {
  // Check spam: returns true if same email has sent >= 3 submissions in the last 5 minutes
  async checkSpam(email) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications 
       WHERE (type = 'contact_submission' OR type = 'pending_approval')
       AND details->>'email' = $1 
       AND created_at > NOW() - INTERVAL '5 minutes'`,
      [email]
    );
    return parseInt(result.rows[0].count, 10) >= 3;
  },

  async insert(data) {
    const { userId, title, message, type, details } = data;
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING 
         notification_id AS "notificationId", 
         user_id AS "userId", 
         title, 
         message, 
         type, 
         is_read AS "isRead", 
         details, 
         created_at AS "createdAt"`,
      [userId, title, message, type, details ? JSON.stringify(details) : null]
    );
    return result.rows[0];
  },
  
  async findByUserId(userId) {
    const result = await pool.query(
      `SELECT 
         notification_id AS "notificationId", 
         user_id AS "userId", 
         title, 
         message, 
         type, 
         is_read AS "isRead", 
         details, 
         created_at AS "createdAt"
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getUnreadCountByUserId(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT 
         notification_id AS "notificationId", 
         user_id AS "userId", 
         title, 
         message, 
         type, 
         is_read AS "isRead", 
         details, 
         created_at AS "createdAt"
       FROM notifications
       WHERE notification_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async markAsRead(id) {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE notification_id = $1
       RETURNING 
         notification_id AS "notificationId", 
         user_id AS "userId", 
         title, 
         message, 
         type, 
         is_read AS "isRead", 
         details, 
         created_at AS "createdAt"`,
      [id]
    );
    return result.rows[0];
  },

  async markAllAsRead(userId) {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1
       RETURNING 
         notification_id AS "notificationId", 
         user_id AS "userId", 
         title, 
         message, 
         type, 
         is_read AS "isRead", 
         details, 
         created_at AS "createdAt"`,
      [userId]
    );
    return result.rows;
  },

  async delete(id) {
    const result = await pool.query(
      `DELETE FROM notifications
       WHERE notification_id = $1
       RETURNING notification_id AS "notificationId"`,
      [id]
    );
    return result.rows[0];
  },

  async findAdmins() {
    const result = await pool.query(
      `SELECT user_id AS "userId", name, email FROM auth.users WHERE role = 'Administrator' AND status = 'ACTIVE'`
    );
    return result.rows;
  },

  async findUsersByRole(role) {
    const result = await pool.query(
      `SELECT user_id AS "userId", name, email FROM auth.users WHERE role = $1 AND status = 'ACTIVE'`,
      [role]
    );
    return result.rows;
  },

  async findAllUsers() {
    const result = await pool.query(
      `SELECT user_id AS "userId", name, email FROM auth.users WHERE status = 'ACTIVE'`
    );
    return result.rows;
  },

  async findUserByIdOrEmail(identifier) {
    const isEmail = String(identifier).includes('@');
    let queryStr = `SELECT user_id AS "userId", name, email FROM auth.users WHERE status = 'ACTIVE' AND `;
    let params = [identifier];
    if (isEmail) {
      queryStr += `email = $1`;
    } else {
      const id = parseInt(identifier, 10);
      if (isNaN(id)) return null;
      queryStr += `user_id = $1`;
      params = [id];
    }
    const result = await pool.query(queryStr, params);
    return result.rows[0];
  }
};
