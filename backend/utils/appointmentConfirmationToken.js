import jwt from 'jsonwebtoken';

const getSecret = () => {
  if (!globalThis.process?.env?.JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado.');
  }

  return globalThis.process.env.JWT_SECRET;
};

export const signAppointmentConfirmationToken = (payload) => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: '24h',
    issuer: 'clinica-odonto-api',
    algorithm: 'HS256',
  });
};

export const verifyAppointmentConfirmationToken = (token) => {
  return jwt.verify(token, getSecret(), {
    issuer: 'clinica-odonto-api',
    algorithms: ['HS256'],
  });
};


