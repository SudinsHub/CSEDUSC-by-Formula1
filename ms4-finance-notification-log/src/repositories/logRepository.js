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
    const { page = 1, limit = 10, actorUserId, actionType, startDate, endDate, search } = filters;
    const offset = (page - 1) * limit;

    let baseSelect = `
      SELECT 
        al.log_id,
        al.actor_user_id,
        al.action_type,
        al.target_entity,
        al.target_entity_id,
        al.details,
        al.logged_at,
        u.name AS actor_name,
        CASE 
          WHEN al.target_entity = 'user' THEN target_user.name
          WHEN al.target_entity = 'notice' THEN target_notice.title
          WHEN al.target_entity = 'event' THEN target_event.title
          WHEN al.target_entity = 'election' THEN target_election.title
          WHEN al.target_entity = 'gallery' THEN target_gallery.title
          WHEN al.target_entity = 'budget' THEN budget_event.title
          WHEN al.target_entity = 'expenditure' THEN target_expenditure.description
          WHEN al.target_entity = 'event_registration' THEN reg_event.title
          WHEN al.target_entity = 'media' THEN target_media.file_path
          ELSE COALESCE(al.details->>'title', al.details->>'name', al.details->>'description', CAST(al.target_entity_id AS VARCHAR))
        END AS target_name
      FROM finance.activity_logs al
      LEFT JOIN auth.users u ON al.actor_user_id = u.user_id
      LEFT JOIN auth.users target_user ON al.target_entity = 'user' AND al.target_entity_id = target_user.user_id
      LEFT JOIN content.notices target_notice ON al.target_entity = 'notice' AND al.target_entity_id = target_notice.notice_id
      LEFT JOIN content.events target_event ON al.target_entity = 'event' AND al.target_entity_id = target_event.event_id
      LEFT JOIN election.elections target_election ON al.target_entity = 'election' AND al.target_entity_id = target_election.election_id
      LEFT JOIN content.gallery target_gallery ON al.target_entity = 'gallery' AND al.target_entity_id = target_gallery.gallery_id
      LEFT JOIN finance.budgets target_budget ON al.target_entity = 'budget' AND al.target_entity_id = target_budget.budget_id
      LEFT JOIN content.events budget_event ON target_budget.event_id = budget_event.event_id
      LEFT JOIN finance.expenditures target_expenditure ON al.target_entity = 'expenditure' AND al.target_entity_id = target_expenditure.expenditure_id
      LEFT JOIN content.event_registrations target_reg ON al.target_entity = 'event_registration' AND al.target_entity_id = target_reg.registration_id
      LEFT JOIN content.events reg_event ON target_reg.event_id = reg_event.event_id
      LEFT JOIN content.media target_media ON al.target_entity = 'media' AND al.target_entity_id = target_media.media_id
    `;

    let countSelect = `
      SELECT COUNT(*)
      FROM finance.activity_logs al
      LEFT JOIN auth.users u ON al.actor_user_id = u.user_id
      LEFT JOIN auth.users target_user ON al.target_entity = 'user' AND al.target_entity_id = target_user.user_id
      LEFT JOIN content.notices target_notice ON al.target_entity = 'notice' AND al.target_entity_id = target_notice.notice_id
      LEFT JOIN content.events target_event ON al.target_entity = 'event' AND al.target_entity_id = target_event.event_id
      LEFT JOIN election.elections target_election ON al.target_entity = 'election' AND al.target_entity_id = target_election.election_id
      LEFT JOIN content.gallery target_gallery ON al.target_entity = 'gallery' AND al.target_entity_id = target_gallery.gallery_id
      LEFT JOIN finance.budgets target_budget ON al.target_entity = 'budget' AND al.target_entity_id = target_budget.budget_id
      LEFT JOIN content.events budget_event ON target_budget.event_id = budget_event.event_id
      LEFT JOIN finance.expenditures target_expenditure ON al.target_entity = 'expenditure' AND al.target_entity_id = target_expenditure.expenditure_id
      LEFT JOIN content.event_registrations target_reg ON al.target_entity = 'event_registration' AND al.target_entity_id = target_reg.registration_id
      LEFT JOIN content.events reg_event ON target_reg.event_id = reg_event.event_id
      LEFT JOIN content.media target_media ON al.target_entity = 'media' AND al.target_entity_id = target_media.media_id
    `;

    const params = [];
    const conditions = [];

    if (actorUserId) {
      params.push(actorUserId);
      conditions.push(`al.actor_user_id = $${params.length}`);
    }

    if (actionType) {
      params.push(actionType);
      conditions.push(`al.action_type = $${params.length}`);
    }

    if (startDate) {
      params.push(startDate);
      conditions.push(`al.logged_at >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate);
      conditions.push(`al.logged_at <= $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const searchIdx = params.length;
      conditions.push(`(
        u.name ILIKE $${searchIdx} OR 
        al.action_type ILIKE $${searchIdx} OR 
        al.target_entity ILIKE $${searchIdx} OR
        (
          CASE 
            WHEN al.target_entity = 'user' THEN target_user.name
            WHEN al.target_entity = 'notice' THEN target_notice.title
            WHEN al.target_entity = 'event' THEN target_event.title
            WHEN al.target_entity = 'election' THEN target_election.title
            WHEN al.target_entity = 'gallery' THEN target_gallery.title
            WHEN al.target_entity = 'budget' THEN budget_event.title
            WHEN al.target_entity = 'expenditure' THEN target_expenditure.description
            WHEN al.target_entity = 'event_registration' THEN reg_event.title
            WHEN al.target_entity = 'media' THEN target_media.file_path
            ELSE COALESCE(al.details->>'title', al.details->>'name', al.details->>'description', CAST(al.target_entity_id AS VARCHAR))
          END
        ) ILIKE $${searchIdx}
      )`);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      baseSelect += whereClause;
      countSelect += whereClause;
    }

    const countResult = await pool.query(countSelect, params);
    const total = parseInt(countResult.rows[0].count, 10);

    baseSelect += ' ORDER BY al.logged_at DESC';

    params.push(limit);
    baseSelect += ` LIMIT $${params.length}`;

    params.push(offset);
    baseSelect += ` OFFSET $${params.length}`;

    const recordsResult = await pool.query(baseSelect, params);

    return {
      data: recordsResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  },

  async delete(filters = {}) {
    let query = 'DELETE FROM finance.activity_logs';
    const params = [];
    const conditions = [];

    if (filters.beforeDate) {
      params.push(filters.beforeDate);
      conditions.push(`logged_at < $${params.length}`);
    }

    if (filters.actorUserId) {
      params.push(filters.actorUserId);
      conditions.push(`actor_user_id = $${params.length}`);
    }

    if (filters.actionType) {
      params.push(filters.actionType);
      conditions.push(`action_type = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(query, params);
    return result.rowCount;
  },
};
