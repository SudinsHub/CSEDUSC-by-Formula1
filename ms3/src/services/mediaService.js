import * as mediaRepository from '../repositories/mediaRepository.js';
import * as fileStorageService from './fileStorageService.js';
import { emitAudit } from '../queues/index.js';

export const upload = async (file, uploadedBy, eventId = null, noticeId = null) => {
  // Save file to filesystem
  const relativePath = await fileStorageService.save(file);
  
  // Save metadata to database
  const media = await mediaRepository.insert({
    file_path: relativePath,
    file_type: file.mimetype,
    event_id: eventId,
    notice_id: noticeId,
    uploaded_by: uploadedBy,
  });

  await emitAudit({
    actor: uploadedBy,
    action: 'media.uploaded',
    target: 'media',
    targetId: media.media_id,
    details: { 
      file_type: file.mimetype,
      event_id: eventId,
      notice_id: noticeId,
    },
  });

  return media;
};

export const list = async () => {
  return await mediaRepository.findAll();
};

export const getById = async (id) => {
  const media = await mediaRepository.findById(id);
  if (!media) {
    const error = new Error('Media not found');
    error.status = 404;
    throw error;
  }
  return media;
};

export const streamFile = async (id, res) => {
  const media = await getById(id);
  fileStorageService.stream(media.file_path, res);
};
