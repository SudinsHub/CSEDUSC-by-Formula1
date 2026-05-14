import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(`Validation failed for ${req.method} ${req.originalUrl}:`, errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
