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
    await mediaService.streamFile(parseInt(req.params.id, 10), res);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[media/streamFile]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
