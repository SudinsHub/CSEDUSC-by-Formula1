import * as mediaService from '../../services/mediaService.js';

export const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const eventId = req.body.event_id ? parseInt(req.body.event_id, 10) : null;
    const noticeId = req.body.notice_id ? parseInt(req.body.notice_id, 10) : null;

    const media = await mediaService.upload(req.file, req.userId, eventId, noticeId);
    res.status(201).json(media);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[media/upload]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const list = async (req, res) => {
  try {
    const media = await mediaService.list();
    res.status(200).json(media);
  } catch (err) {
    console.error('[media/list]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const streamFile = async (req, res) => {
  try {
    const download = req.query.download === 'true';
    await mediaService.streamFile(parseInt(req.params.id, 10), res, download);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[media/streamFile]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const remove = async (req, res) => {
  try {
    const deleted = await mediaService.remove(
      parseInt(req.params.id, 10),
      req.userId
    );
    res.status(200).json(deleted);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[media/delete]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadPublic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'], 10) : null;

    const media = await mediaService.upload(req.file, userId);
    res.status(201).json(media);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[media/uploadPublic]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const streamFileByPath = async (req, res) => {
  try {
    const download = req.query.download === 'true';
    const { year, month, filename } = req.params;
    const filePath = `${year}/${month}/${filename}`;
    await mediaService.streamFileByPath(filePath, res, download);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[media/streamFileByPath]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


