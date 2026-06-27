import * as galleryService from '../../services/galleryService.js';

export const create = async (req, res) => {
  try {
    const gallery = await galleryService.create(req.body, req.userId);
    res.status(201).json(gallery);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[gallery/create]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const list = async (req, res) => {
  try {
    const galleries = await galleryService.list();
    res.status(200).json(galleries);
  } catch (err) {
    console.error('[gallery/list]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getById = async (req, res) => {
  try {
    const gallery = await galleryService.getById(parseInt(req.params.id, 10));
    res.status(200).json(gallery);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[gallery/getById]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const update = async (req, res) => {
  try {
    const gallery = await galleryService.update(
      parseInt(req.params.id, 10),
      req.body,
      req.userId
    );
    res.status(200).json(gallery);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[gallery/update]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const remove = async (req, res) => {
  try {
    const deleted = await galleryService.remove(
      parseInt(req.params.id, 10),
      req.userId
    );
    res.status(200).json(deleted);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[gallery/delete]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
