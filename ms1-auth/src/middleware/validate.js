/**
 * Validates req.body against a Zod schema.
 * On failure responds 400 with the list of validation error messages.
 *
 * @param {import('zod').ZodSchema} schema
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors.map((e) => e.message),
    });
  }
  req.body = result.data;
  next();
};
