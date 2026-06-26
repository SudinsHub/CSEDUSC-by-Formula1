import { query } from '../db.js';

export const insert = async (data) => {
  const sql = `
    INSERT INTO events (title, description, event_date, location, volunteers_needed, status, created_by, banner_image_id, registration_fee)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
    data.banner_image_id || null,
    data.registration_fee || 0.00,
  ];
  const result = await query(sql, values);
  return result.rows[0];
};

export const findAll = async (userId = null) => {
  const sql = `
    SELECT e.*, 
           m.file_path as banner_image_path,
           (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.event_id AND type = 'attendee') as attendee_count,
           (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.event_id AND type = 'volunteer' AND status = 'approved') as volunteer_count
           ${userId ? `, (
             SELECT json_build_object(
               'registration_id', er.registration_id,
               'type', er.type,
               'status', er.status,
               'registered_at', er.registered_at,
               'payment_status', COALESCE(t.payment_status, 'pending'),
               'transaction_reference', t.transaction_reference
             )
             FROM event_registrations er
             LEFT JOIN finance.transactions t ON t.purpose = 'event_registration' AND t.target_id = er.registration_id
             WHERE er.event_id = e.event_id AND er.user_id = $1
             LIMIT 1
           ) as user_registration` : ''}
    FROM events e
    LEFT JOIN media m ON e.banner_image_id = m.media_id
    WHERE e.status != 'cancelled'
    ORDER BY e.event_date DESC
  `;
  const result = await query(sql, userId ? [userId] : []);
  return result.rows;
};

export const findById = async (id, userId = null) => {
  const sql = `
    SELECT e.*,
           m.file_path as banner_image_path,
           (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.event_id AND type = 'attendee') as attendee_count,
           (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.event_id AND type = 'volunteer' AND status = 'approved') as volunteer_count
           ${userId ? `, (
             SELECT json_build_object(
               'registration_id', er.registration_id,
               'type', er.type,
               'status', er.status,
               'registered_at', er.registered_at,
               'payment_status', COALESCE(t.payment_status, 'pending'),
               'transaction_reference', t.transaction_reference
             )
             FROM event_registrations er
             LEFT JOIN finance.transactions t ON t.purpose = 'event_registration' AND t.target_id = er.registration_id
             WHERE er.event_id = e.event_id AND er.user_id = $2
             LIMIT 1
           ) as user_registration` : ''}
    FROM events e
    LEFT JOIN media m ON e.banner_image_id = m.media_id
    WHERE e.event_id = $1
  `;
  const result = await query(sql, userId ? [id, userId] : [id]);
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
  if (data.registration_fee !== undefined) {
    fields.push(`registration_fee = $${paramCount++}`);
    values.push(data.registration_fee);
  }
  if (data.banner_image_id !== undefined) {
    fields.push(`banner_image_id = $${paramCount++}`);
    values.push(data.banner_image_id);
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
