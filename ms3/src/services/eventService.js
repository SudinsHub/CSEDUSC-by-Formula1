import * as eventRepository from '../repositories/eventRepository.js';
import * as eventRegistrationRepository from '../repositories/eventRegistrationRepository.js';
import { emitAudit, emitNotification } from '../queues/index.js';

export const create = async (data, createdBy) => {
  const event = await eventRepository.insert({
    ...data,
    created_by: createdBy,
  });

  // Emit audit log
  await emitAudit({
    actor: createdBy,
    action: 'event.created',
    target: 'event',
    targetId: event.event_id,
    details: { title: event.title },
  });

  return event;
};

export const list = async () => {
  return await eventRepository.findAll();
};

export const getById = async (id) => {
  const event = await eventRepository.findById(id);
  if (!event) {
    const error = new Error('Event not found');
    error.status = 404;
    throw error;
  }
  return event;
};

export const update = async (id, data, userId) => {
  const event = await eventRepository.findById(id);
  if (!event) {
    const error = new Error('Event not found');
    error.status = 404;
    throw error;
  }

  const updated = await eventRepository.update(id, data);

  await emitAudit({
    actor: userId,
    action: 'event.updated',
    target: 'event',
    targetId: id,
    details: { changes: data },
  });

  return updated;
};

export const cancel = async (id, userId) => {
  const event = await eventRepository.findById(id);
  if (!event) {
    const error = new Error('Event not found');
    error.status = 404;
    throw error;
  }

  const cancelled = await eventRepository.updateStatus(id, 'cancelled');

  await emitAudit({
    actor: userId,
    action: 'event.cancelled',
    target: 'event',
    targetId: id,
    details: { title: event.title },
  });

  return cancelled;
};

export const registerAttendee = async (eventId, userId) => {
  const event = await eventRepository.findById(eventId);
  if (!event) {
    const error = new Error('Event not found');
    error.status = 404;
    throw error;
  }

  if (event.status !== 'open') {
    const error = new Error('Event is not open for registration');
    error.status = 400;
    throw error;
  }

  // Check if already registered
  const existing = await eventRegistrationRepository.findByUserAndEvent(userId, eventId);
  if (existing) {
    const error = new Error('You are already registered for this event');
    error.status = 409;
    throw error;
  }

  const registration = await eventRegistrationRepository.insert(eventId, userId, 'attendee');

  // Emit notification
  await emitNotification('event.registered', {
    userId,
    eventId,
    eventTitle: event.title,
    type: 'attendee',
  });

  await emitAudit({
    actor: userId,
    action: 'event.registered',
    target: 'event',
    targetId: eventId,
    details: { type: 'attendee' },
  });

  return registration;
};

export const applyVolunteer = async (eventId, userId) => {
  const event = await eventRepository.findById(eventId);
  if (!event) {
    const error = new Error('Event not found');
    error.status = 404;
    throw error;
  }

  if (event.status !== 'open') {
    const error = new Error('Event is not open for volunteer applications');
    error.status = 400;
    throw error;
  }

  // Check if already applied
  const existing = await eventRegistrationRepository.findByUserAndEvent(userId, eventId);
  if (existing) {
    const error = new Error('You have already applied for this event');
    error.status = 409;
    throw error;
  }

  const registration = await eventRegistrationRepository.insert(eventId, userId, 'volunteer');

  await emitAudit({
    actor: userId,
    action: 'volunteer.applied',
    target: 'event',
    targetId: eventId,
    details: { type: 'volunteer' },
  });

  return registration;
};

export const manageVolunteer = async (registrationId, status, managerId) => {
  const updated = await eventRegistrationRepository.updateStatus(registrationId, status);
  
  if (!updated) {
    const error = new Error('Registration not found');
    error.status = 404;
    throw error;
  }

  // Emit notification to volunteer
  await emitNotification('volunteer.decided', {
    userId: updated.user_id,
    eventId: updated.event_id,
    status,
  });

  await emitAudit({
    actor: managerId,
    action: 'volunteer.decided',
    target: 'event_registration',
    targetId: registrationId,
    details: { status },
  });

  return updated;
};

export const listRegistrations = async (eventId) => {
  return await eventRegistrationRepository.findByEvent(eventId);
};
