import { query } from '../db.js';

export const insert = async (eventId, userId, type, paymentDetails = null) => {
  const sql = `
    INSERT INTO event_registrations (event_id, user_id, type, status, registered_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;
  const status = type === 'volunteer' ? 'pending' : 'approved';
  const result = await query(sql, [eventId, userId, type, status]);
  const registration = result.rows[0];

  if (paymentDetails) {
    const txSql = `
      INSERT INTO finance.transactions (user_id, amount, payment_status, payment_method, transaction_reference, purpose, target_id)
      VALUES ($1, $2, $3, $4, $5, 'event_registration', $6)
    `;
    await query(txSql, [
      userId,
      paymentDetails.amount,
      paymentDetails.payment_status || 'paid',
      paymentDetails.payment_method,
      paymentDetails.transaction_reference,
      registration.registration_id
    ]);
  }

  return registration;
};

export const findByEvent = async (eventId) => {
  const sql = `
    SELECT er.*, 
           u.name as user_name, 
           u.email as user_email,
           u.batch_year,
           t.payment_status,
           t.transaction_reference,
           t.payment_method,
           t.amount as paid_amount
    FROM event_registrations er
    LEFT JOIN auth.users u ON er.user_id = u.user_id
    LEFT JOIN finance.transactions t ON t.purpose = 'event_registration' AND t.target_id = er.registration_id
    WHERE er.event_id = $1
    ORDER BY er.registered_at DESC
  `;
  const result = await query(sql, [eventId]);
  return result.rows;
};

export const findByUserAndEvent = async (userId, eventId) => {
  const sql = `
    SELECT * FROM event_registrations
    WHERE user_id = $1 AND event_id = $2
  `;
  const result = await query(sql, [userId, eventId]);
  return result.rows[0];
};

export const updateStatus = async (registrationId, status) => {
  const sql = `
    UPDATE event_registrations 
    SET status = $1 
    WHERE registration_id = $2 
    RETURNING *
  `;
  const result = await query(sql, [status, registrationId]);
  return result.rows[0];
};

export const countByEvent = async (eventId, type = null) => {
  let sql = `SELECT COUNT(*) as count FROM event_registrations WHERE event_id = $1`;
  const params = [eventId];
  
  if (type) {
    sql += ` AND type = $2`;
    params.push(type);
  }
  
  const result = await query(sql, params);
  return parseInt(result.rows[0].count, 10);
};
