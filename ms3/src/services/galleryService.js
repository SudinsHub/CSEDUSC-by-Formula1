import * as galleryRepository from '../repositories/galleryRepository.js';
import * as mediaRepository from '../repositories/mediaRepository.js';
import { emitAudit } from '../queues/index.js';

export const create = async (data, authorId) => {
  const { images, ...galleryData } = data;
  const gallery = await galleryRepository.insert({
    ...galleryData,
    created_by: authorId,
  });

  if (images && images.length > 0) {
    await mediaRepository.linkToGallery(gallery.gallery_id, images);
  }

  await emitAudit({
    actor: authorId,
    action: 'gallery.created',
    target: 'gallery',
    targetId: gallery.gallery_id,
    details: { title: gallery.title },
  });

  return await getById(gallery.gallery_id);
};

export const list = async () => {
  return await galleryRepository.findAll();
};

export const getById = async (id) => {
  const gallery = await galleryRepository.findById(id);
  if (!gallery) {
    const error = new Error('Gallery entry not found');
    error.status = 404;
    throw error;
  }
  return gallery;
};

export const update = async (id, data, userId) => {
  const gallery = await galleryRepository.findById(id);
  if (!gallery) {
    const error = new Error('Gallery entry not found');
    error.status = 404;
    throw error;
  }

  const { images, ...galleryData } = data;
  const updated = await galleryRepository.update(id, galleryData);

  if (images !== undefined) {
    await mediaRepository.unlinkFromGallery(id);
    if (images.length > 0) {
      await mediaRepository.linkToGallery(id, images);
    }
  }

  await emitAudit({
    actor: userId,
    action: 'gallery.updated',
    target: 'gallery',
    targetId: id,
    details: { changes: data },
  });

  return await getById(id);
};

export const remove = async (id, userId) => {
  const gallery = await galleryRepository.findById(id);
  if (!gallery) {
    const error = new Error('Gallery entry not found');
    error.status = 404;
    throw error;
  }
  const deleted = await galleryRepository.remove(id);
  
  // Unlink associated media records
  await mediaRepository.unlinkFromGallery(id);

  await emitAudit({
    actor: userId,
    action: 'gallery.deleted',
    target: 'gallery',
    targetId: id,
    details: { title: gallery.title },
  });
  return deleted;
};
