import rateLimit from 'express-rate-limit';

const isDevelopment = process.env.NODE_ENV !== 'production';

// The local SPA performs polling and auth refreshes frequently during day-to-day use.
// In development we skip the limiters so demo and validation flows do not dead-end.
const skipInDevelopment = () => isDevelopment;

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDevelopment,
  message: {
    status: 'error',
    message: 'Muitas requisições. Tente novamente mais tarde.',
  },
});

export const publicBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDevelopment,
  message: {
    status: 'error',
    message: 'Muitas tentativas de agendamento online. Aguarde alguns minutos e tente novamente.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipInDevelopment,
  message: {
    status: 'error',
    message: 'Muitas tentativas de login. Tente novamente após 15 minutos.',
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: skipInDevelopment,
  keyGenerator: (req) => `login_${req.body.email || 'unknown'}`,
  message: {
    status: 'error',
    message: 'Muitas tentativas para esta conta. Tente novamente após 15 minutos.',
  },
});

export const confirmationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDevelopment,
  message: {
    status: 'error',
    message: 'Muitas tentativas de confirmação. Aguarde alguns minutos e tente novamente.',
  },
});
