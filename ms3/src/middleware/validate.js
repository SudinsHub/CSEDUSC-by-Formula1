/**
 * Joi validation middleware
 * Validates request body against a Joi schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    req.body = value;
    next();
  };
};
