import { query } from '../db.js';

export const insert = async (data) => {
  const sql = `
    INSERT INTO notices (title, content, priority, expiry_date, created_by, published_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  const values = [
    data.title,
    data.content,
    data.priority || 'normal',
    data.expiry_date || null,
    data.created_by,
  ];
  const result = await query(sql, values);
  return result.rows[0];
};

export const findAllActive = async () => {
  const sql = `
    SELECT n.*,
           u.name as author_name,
           COALESCE(
             json_agg(
               json_build_object(
                 'media_id', m.media_id,
                 'file_path', m.file_path,
                 'file_type', m.file_type
               )
             ) FILTER (WHERE m.media_id IS NOT NULL),
             '[]'::json
           ) as attachments
    FROM notices n
    LEFT JOIN auth.users u ON n.created_by = u.user_id
    LEFT JOIN media m ON m.notice_id = n.notice_id
    WHERE (n.expiry_date IS NULL OR n.expiry_date >= CURRENT_DATE)
    GROUP BY n.notice_id, u.name
    ORDER BY 
      CASE n.priority
        WHEN 'urgent' THEN 1
        WHEN 'normal' THEN 2
        WHEN 'low' THEN 3
      END,
      n.published_at DESC
  `;
  const result = await query(sql);
  return result.rows;
};

export const findById = async (id) => {
  const sql = `
    SELECT n.*,
           u.name as author_name,
           u.email as author_email,
           COALESCE(
             json_agg(
               json_build_object(
                 'media_id', m.media_id,
                 'file_path', m.file_path,
                 'file_type', m.file_type
               )
             ) FILTER (WHERE m.media_id IS NOT NULL),
             '[]'::json
           ) as attachments
    FROM notices n
    LEFT JOIN auth.users u ON n.created_by = u.user_id
    LEFT JOIN media m ON m.notice_id = n.notice_id
    WHERE n.notice_id = $1
    GROUP BY n.notice_id, u.name, u.email
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
  if (data.content !== undefined) {
    fields.push(`content = $${paramCount++}`);
    values.push(data.content);
  }
  if (data.priority !== undefined) {
    fields.push(`priority = $${paramCount++}`);
    values.push(data.priority);
  }
  if (data.expiry_date !== undefined) {
    fields.push(`expiry_date = $${paramCount++}`);
    values.push(data.expiry_date);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const sql = `UPDATE notices SET ${fields.join(', ')} WHERE notice_id = $${paramCount} RETURNING *`;
  const result = await query(sql, values);
  return result.rows[0];
};

export const remove = async (id) => {
  const sql = 'DELETE FROM notices WHERE notice_id = $1 RETURNING *';
  const result = await query(sql, [id]);
  return result.rows[0];
};

