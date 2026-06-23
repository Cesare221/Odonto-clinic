// =============================================================================
// MIDDLEWARE/ERRORHANDLER.JS - BACKEND - Global Error Handler
// =============================================================================

/**
 * Handler de erros para erros de validação do Mongoose
 */
const handleMongooseValidationError = (err) => {
  const messages = Object.values(err.errors).map((value) => value.message);
  return `Erro de validação: ${messages.join(', ')}`;
};

/**
 * Handler para erro de duplicidade (unique)
 */
const handleMongooseDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return `O valor para "${field}" já está em uso.`;
};

/**
 * Handler para erro de ID do Mongoose inválido
 */
const handleMongooseCastError = (err) => {
  return `O identificador "${err.value}" não é válido.`;
};

/**
 * Middleware global de tratamento de erros
 */
const errorHandler = (err, req, res, next) => {
  void req;
  void next;

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erro interno do servidor';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = handleMongooseValidationError(err);
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = handleMongooseDuplicateKey(err);
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = handleMongooseCastError(err);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware para rotas não encontradas
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Rota ${req.originalUrl} não encontrada`,
  });
};

export default errorHandler;
