import Joi from 'joi';

export const createNoticeSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().required(),
  priority: Joi.string().valid('low', 'normal', 'urgent').default('normal'),
  expiry_date: Joi.date().iso().allow(null),
});

export const updateNoticeSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  content: Joi.string(),
  priority: Joi.string().valid('low', 'normal', 'urgent'),
  expiry_date: Joi.date().iso().allow(null),
}).min(1);
