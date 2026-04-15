import { query } from '../db.js';

export const insert = async (data) => {
  const sql = `
    INSERT INTO events (title, description, event_date, location, volunteers_needed, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [
    data.title,
    data.description,
    data.event_date,
    data.location,
    data.volunteers_needed || 0,
    data.status || 'open',
    data.created_by,
  ];
  const result = await query(sql, values);
  return result.rows[0];
};

export const findAll = async () => {
  const sql = `
    SELECT e.*, 
           (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.event_id AND type = 'attendee') as attendee_count,
           (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.event_id AND type = 'volunteer' AND status = 'approved') as volunteer_count
    FROM events e
    WHERE e.status != 'cancelled'
    ORDER BY e.event_date DESC
  `;
  const result = await query(sql);
  return result.rows;
};

export const findById = async (id) => {
  const sql = `
    SELECT e.*,
           (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.event_id AND type = 'attendee') as attendee_count,
           (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.event_id AND type = 'volunteer' AND status = 'approved') as volunteer_count
    FROM events e
    WHERE e.event_id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0];
};

export const update = async (id, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(data.description);
  }
  if (data.event_date !== undefined) {
    fields.push(`event_date = $${paramCount++}`);
    values.push(data.event_date);
  }
  if (data.location !== undefined) {
    fields.push(`location = $${paramCount++}`);
    values.push(data.location);
  }
  if (data.volunteers_needed !== undefined) {
    fields.push(`volunteers_needed = $${paramCount++}`);
    values.push(data.volunteers_needed);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const sql = `UPDATE events SET ${fields.join(', ')} WHERE event_id = $${paramCount} RETURNING *`;
  const result = await query(sql, values);
  return result.rows[0];
};

export const updateStatus = async (id, status) => {
  const sql = `UPDATE events SET status = $1 WHERE event_id = $2 RETURNING *`;
  const result = await query(sql, [status, id]);
  return result.rows[0];
};
