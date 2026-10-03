import { ZodError } from 'zod';
import { fail } from '../utils/response.js';

function fieldMessages(error) {
  const result = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : 'form';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          data: { errors: fieldMessages(error) },
          message: 'Validation failed.'
        });
      }
      next(error);
    }
  };
}
