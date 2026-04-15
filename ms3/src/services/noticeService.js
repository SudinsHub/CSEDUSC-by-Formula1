import * as noticeRepository from '../repositories/noticeRepository.js';
import { emitAudit } from '../queues/index.js';

export const publish = async (data, authorId) => {
  const notice = await noticeRepository.insert({
    ...data,
    created_by: authorId,
  });

  await emitAudit({
    actor: authorId,
    action: 'notice.published',
    target: 'notice',
    targetId: notice.notice_id,
    details: { title: notice.title, priority: notice.priority },
  });

  return notice;
};

export const list = async () => {
  return await noticeRepository.findAllActive();
};

export const getById = async (id) => {
  const notice = await noticeRepository.findById(id);
  if (!notice) {
    const error = new Error('Notice not found');
    error.status = 404;
    throw error;
  }
  return notice;
};

export const update = async (id, data, userId) => {
  const notice = await noticeRepository.findById(id);
  if (!notice) {
    const error = new Error('Notice not found');
    error.status = 404;
    throw error;
  }

  const updated = await noticeRepository.update(id, data);

  await emitAudit({
    actor: userId,
    action: 'notice.updated',
    target: 'notice',
    targetId: id,
    details: { changes: data },
  });

  return updated;
};
