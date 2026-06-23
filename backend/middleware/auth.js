import { verifyAccessToken } from '../utils/jwtUtils.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Acesso não autorizado. Token não fornecido.',
      });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Usuário não encontrado ou token inválido.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Conta desativada. Entre em contato com o administrador.',
      });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Sessão expirada. Por favor, faça login novamente.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token inválido. Por favor, faça login novamente.',
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Erro de autenticação.',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Acesso não autorizado. Faça login primeiro.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para acessar este recurso.',
      });
    }

    next();
  };
};
