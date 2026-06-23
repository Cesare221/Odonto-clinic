import express from 'express';
import { register, login, refresh, logout, getMe, setup2FA, verify2FA, verify2FALogin } from '../controllers/authController.js';
import { createDoctorCesarPublic } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { authLimiter, loginLimiter } from '../middleware/rateLimiter.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/authValidator.js';

const router = express.Router();

// Rota pública temporária para criar Dr. Cesar
router.post('/create-doctor-cesar-temp', createDoctorCesarPublic);

// Rotas de autenticação
router.post('/register', authenticate, authorize('admin'), validate(registerSchema), register);
router.post('/login', authLimiter, loginLimiter, validate(loginSchema), login);
router.post('/login/verify-2fa', authLimiter, loginLimiter, verify2FALogin);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

// Rotas de 2FA
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify', authenticate, verify2FA);

export default router;
