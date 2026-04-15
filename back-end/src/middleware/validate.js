import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.details = error.issues.map((e) => ({
        path: e.path,
        message: e.message,
      }));
      return next(err);
    }
    next(error);
  }
};
