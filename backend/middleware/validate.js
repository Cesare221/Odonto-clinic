import { ZodError } from 'zod';
import ApiError from '../utils/apiError.js';

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues || error.errors || [];
      const messages = issues.map((issue) => {
        const path = Array.isArray(issue.path) ? issue.path.join('.') : 'request';
        const message = String(issue.message || 'valor inválido').toLowerCase();
        return `${path} is ${message}`;
      });

      const finalMessage = messages.length > 0
        ? `Erro de validação: ${messages.join('; ')}`
        : 'Erro de validação.';

      return next(new ApiError(400, finalMessage));
    }

    return next(new ApiError(500, 'Erro interno do servidor.'));
  }
};

export default validate;
