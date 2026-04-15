import Joi from 'joi';

export const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().required(),
  event_date: Joi.date().iso().required(),
  location: Joi.string().max(300).required(),
  volunteers_needed: Joi.number().integer().min(0).default(0),
});

export const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string(),
  event_date: Joi.date().iso(),
  location: Joi.string().max(300),
  volunteers_needed: Joi.number().integer().min(0),
}).min(1);

export const manageVolunteerSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
});
