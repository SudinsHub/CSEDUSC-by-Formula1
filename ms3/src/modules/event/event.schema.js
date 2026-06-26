import Joi from 'joi';

export const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().required(),
  event_date: Joi.date().iso().required(),
  location: Joi.string().max(300).required(),
  volunteers_needed: Joi.number().integer().min(0).default(0),
  registration_fee: Joi.number().min(0).default(0),
  banner_image_id: Joi.number().integer().min(1).allow(null).optional(),
});

export const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string(),
  event_date: Joi.date().iso(),
  location: Joi.string().max(300),
  volunteers_needed: Joi.number().integer().min(0),
  registration_fee: Joi.number().min(0),
  banner_image_id: Joi.number().integer().min(1).allow(null).optional(),
}).min(1);

export const manageVolunteerSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
});
