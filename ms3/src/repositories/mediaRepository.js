import { query } from '../db.js';

export const insert = async (data) => {
  const sql = `
    INSERT INTO media (file_path, file_type, event_id, notice_id, uploaded_by, uploaded_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  const values = [
    data.file_path,
    data.file_type,
    data.event_id || null,
    data.notice_id || null,
    data.uploaded_by,
  ];
  const result = await query(sql, values);
  return result.rows[0];
};

export const findAll = async () => {
  const sql = `
    SELECT m.*,
           u.name as uploader_name,
           e.title as event_title,
           n.title as notice_title
    FROM media m
    LEFT JOIN auth.users u ON m.uploaded_by = u.user_id
    LEFT JOIN events e ON m.event_id = e.event_id
    LEFT JOIN notices n ON m.notice_id = n.notice_id
    ORDER BY m.uploaded_at DESC
  `;
  const result = await query(sql);
  return result.rows;
};

export const findById = async (id) => {
  const sql = `
    SELECT m.*,
           u.name as uploader_name,
           e.title as event_title,
           n.title as notice_title
    FROM media m
    LEFT JOIN auth.users u ON m.uploaded_by = u.user_id
    LEFT JOIN events e ON m.event_id = e.event_id
    LEFT JOIN notices n ON m.notice_id = n.notice_id
    WHERE m.media_id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0];
};

export const linkToNotice = async (noticeId, mediaIds) => {
  const sql = `
    UPDATE media
    SET notice_id = $1
    WHERE media_id = ANY($2::int[])
  `;
  await query(sql, [noticeId, mediaIds]);
};

export const unlinkFromNotice = async (noticeId) => {
  const sql = `
    UPDATE media
    SET notice_id = NULL
    WHERE notice_id = $1
  `;
  await query(sql, [noticeId]);
};

export const remove = async (id) => {
  const sql = 'DELETE FROM media WHERE media_id = $1 RETURNING *';
  const result = await query(sql, [id]);
  return result.rows[0];
};



