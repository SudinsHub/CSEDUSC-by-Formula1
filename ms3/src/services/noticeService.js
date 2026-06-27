import * as noticeRepository from '../repositories/noticeRepository.js';
import * as mediaRepository from '../repositories/mediaRepository.js';
import { emitAudit } from '../queues/index.js';

export const publish = async (data, authorId) => {
  const { attachments, ...noticeData } = data;
  const notice = await noticeRepository.insert({
    ...noticeData,
    created_by: authorId,
  });

  if (attachments && attachments.length > 0) {
    await mediaRepository.linkToNotice(notice.notice_id, attachments);
  }

  await emitAudit({
    actor: authorId,
    action: 'notice.published',
    target: 'notice',
    targetId: notice.notice_id,
    details: { title: notice.title, priority: notice.priority },
  });

  return await getById(notice.notice_id);
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

  const { attachments, ...noticeData } = data;
  const updated = await noticeRepository.update(id, noticeData);

  if (attachments !== undefined) {
    await mediaRepository.unlinkFromNotice(id);
    if (attachments.length > 0) {
      await mediaRepository.linkToNotice(id, attachments);
    }
  }

  await emitAudit({
    actor: userId,
    action: 'notice.updated',
    target: 'notice',
    targetId: id,
    details: { changes: data },
  });

  return await getById(id);
};

export const remove = async (id, userId) => {
  const notice = await noticeRepository.findById(id);
  if (!notice) {
    const error = new Error('Notice not found');
    error.status = 404;
    throw error;
  }
  const deleted = await noticeRepository.remove(id);
  await emitAudit({
    actor: userId,
    action: 'notice.deleted',
    target: 'notice',
    targetId: id,
    details: { title: notice.title },
  });
  return deleted;
};


