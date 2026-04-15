import { validationResult } from 'express-validator';

export const validate = (schemas) => {
  return async (req, res, next) => {
    // Run all validations
    for (const schema of schemas) {
      await schema.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  };
};
