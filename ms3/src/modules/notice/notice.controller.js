import * as noticeService from '../../services/noticeService.js';

export const publish = async (req, res) => {
  try {
    const notice = await noticeService.publish(req.body, req.userId);
    res.status(201).json(notice);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[notice/publish]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const list = async (req, res) => {
  try {
    const notices = await noticeService.list();
    res.status(200).json(notices);
  } catch (err) {
    console.error('[notice/list]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getById = async (req, res) => {
  try {
    const notice = await noticeService.getById(parseInt(req.params.id, 10));
    res.status(200).json(notice);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[notice/getById]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const update = async (req, res) => {
  try {
    const notice = await noticeService.update(
      parseInt(req.params.id, 10),
      req.body,
      req.userId
    );
    res.status(200).json(notice);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[notice/update]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
