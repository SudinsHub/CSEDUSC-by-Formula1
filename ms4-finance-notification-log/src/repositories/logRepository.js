import pool from '../db.js';

export const logRepository = {
  async insert(logEntry) {
    const { actorUserId, actionType, targetEntity, targetEntityId, details } = logEntry;
    const result = await pool.query(
      `INSERT INTO activity_logs (actor_user_id, action_type, target_entity, target_entity_id, details, logged_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [actorUserId, actionType, targetEntity, targetEntityId, JSON.stringify(details || {})]
    );
    return result.rows[0];
  },

  async findAll(filters = {}) {
    let query = 'SELECT * FROM activity_logs';
    const params = [];
    const conditions = [];

    if (filters.actorUserId) {
      params.push(filters.actorUserId);
      conditions.push(`actor_user_id = $${params.length}`);
    }

    if (filters.actionType) {
      params.push(filters.actionType);
      conditions.push(`action_type = $${params.length}`);
    }

    if (filters.targetEntity) {
      params.push(filters.targetEntity);
      conditions.push(`target_entity = $${params.length}`);
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      conditions.push(`logged_at >= $${params.length}`);
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      conditions.push(`logged_at <= $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY logged_at DESC';

    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);
    return result.rows;
  },
};
