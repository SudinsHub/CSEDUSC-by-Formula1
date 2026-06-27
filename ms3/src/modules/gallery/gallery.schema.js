import Joi from 'joi';

export const createGallerySchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().required(),
  images: Joi.array().items(Joi.number().integer()).optional(),
});

export const updateGallerySchema = Joi.object({
  title: Joi.string().min(3).max(200),
  content: Joi.string(),
  images: Joi.array().items(Joi.number().integer()).optional(),
}).min(1);
