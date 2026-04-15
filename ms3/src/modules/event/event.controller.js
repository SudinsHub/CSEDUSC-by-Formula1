import * as eventService from '../../services/eventService.js';

export const create = async (req, res) => {
  try {
    const event = await eventService.create(req.body, req.userId);
    res.status(201).json(event);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[event/create]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const list = async (req, res) => {
  try {
    const events = await eventService.list();
    res.status(200).json(events);
  } catch (err) {
    console.error('[event/list]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getById = async (req, res) => {
  try {
    const event = await eventService.getById(parseInt(req.params.id, 10));
    res.status(200).json(event);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[event/getById]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const update = async (req, res) => {
  try {
    const event = await eventService.update(
      parseInt(req.params.id, 10),
      req.body,
      req.userId
    );
    res.status(200).json(event);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[event/update]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cancel = async (req, res) => {
  try {
    const event = await eventService.cancel(parseInt(req.params.id, 10), req.userId);
    res.status(200).json(event);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[event/cancel]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerAttendee = async (req, res) => {
  try {
    const registration = await eventService.registerAttendee(
      parseInt(req.params.id, 10),
      req.userId
    );
    res.status(201).json(registration);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[event/registerAttendee]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const applyVolunteer = async (req, res) => {
  try {
    const registration = await eventService.applyVolunteer(
      parseInt(req.params.id, 10),
      req.userId
    );
    res.status(201).json(registration);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[event/applyVolunteer]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listRegistrations = async (req, res) => {
  try {
    const registrations = await eventService.listRegistrations(
      parseInt(req.params.id, 10)
    );
    res.status(200).json(registrations);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[event/listRegistrations]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const manageVolunteer = async (req, res) => {
  try {
    const registration = await eventService.manageVolunteer(
      parseInt(req.params.vid, 10),
      req.body.status,
      req.userId
    );
    res.status(200).json(registration);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[event/manageVolunteer]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
