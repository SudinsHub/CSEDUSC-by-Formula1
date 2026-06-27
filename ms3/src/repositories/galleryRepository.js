import { query } from '../db.js';

export const insert = async (data) => {
  const sql = `
    INSERT INTO gallery (title, content, created_by, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING *
  `;
  const values = [
    data.title,
    data.content,
    data.created_by,
  ];
  const result = await query(sql, values);
  return result.rows[0];
};

export const findAll = async () => {
  const sql = `
    SELECT g.*,
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
           ) as images
    FROM gallery g
    LEFT JOIN auth.users u ON g.created_by = u.user_id
    LEFT JOIN media m ON m.gallery_id = g.gallery_id
    GROUP BY g.gallery_id, u.name
    ORDER BY g.created_at DESC
  `;
  const result = await query(sql);
  return result.rows;
};

export const findById = async (id) => {
  const sql = `
    SELECT g.*,
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
           ) as images
    FROM gallery g
    LEFT JOIN auth.users u ON g.created_by = u.user_id
    LEFT JOIN media m ON m.gallery_id = g.gallery_id
    WHERE g.gallery_id = $1
    GROUP BY g.gallery_id, u.name, u.email
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

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const sql = `UPDATE gallery SET ${fields.join(', ')} WHERE gallery_id = $${paramCount} RETURNING *`;
  const result = await query(sql, values);
  return result.rows[0];
};

export const remove = async (id) => {
  const sql = 'DELETE FROM gallery WHERE gallery_id = $1 RETURNING *';
  const result = await query(sql, [id]);
  return result.rows[0];
};
