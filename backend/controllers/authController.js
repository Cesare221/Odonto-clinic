// =============================================================================
// CONTROLLERS/AUTHCONTROLLER.JS - BACKEND - Authentication Logic
// Handles registration, login, token refresh and logout
// =============================================================================

import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils.js';
import { asyncHandler } from '../utils/apiError.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public (Admin only in production)
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Verifica se usuário já existe
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      status: 'error',
      message: 'Este email já está cadastrado.'
    });
  }

  // Cria novo usuário
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'doctor'
  });

  res.status(201).json({
    status: 'success',
    message: 'Usuário criado com sucesso',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validação de entrada
  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Email e senha são obrigatórios.'
    });
  }

  // Busca usuário incluindo senha
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    console.warn(`Tentativa de login falha: usuário não encontrado [${email}]`);
    return res.status(401).json({
      status: 'error',
      message: 'Email ou senha inválidos.'
    });
  }

  // Verifica se conta está ativa
  if (!user.isActive) {
    console.warn(`Tentativa de login bloqueada: conta inativa [${email}]`);
    return res.status(403).json({
      status: 'error',
      message: 'Conta desativada. Entre em contato com o administrador.'
    });
  }

  // Compara a senha
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    console.warn(`Tentativa de login falha: senha incorreta [${email}]`);
    return res.status(401).json({
      status: 'error',
      message: 'Email ou senha inválidos.'
    });
  }

  // Verifica se 2FA está habilitado
  if (user.isTwoFactorEnabled) {
    return res.status(200).json({
      status: 'success',
      data: {
        requires2FA: true,
        userId: user._id
      }
    });
  }

  // Gera tokens se não tiver 2FA
  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  const refreshToken = generateRefreshToken({ userId: user._id });

  // Atualiza último login
  user.lastLogin = new Date();
  await user.addRefreshToken(refreshToken);

  console.info(`Login com sucesso: [${email}] - Role: ${user.role}`);

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public (with refresh token)
 */
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      status: 'error',
      message: 'Refresh token é obrigatório.'
    });
  }

  const { refreshTokenPair } = await import('../utils/jwtUtils.js'); // Importação dinâmica para evitar circular dependency
  const newTokens = await refreshTokenPair(refreshToken);

  res.status(200).json({
    status: 'success',
    data: newTokens
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken && req.user) {
    // Remove o refresh token do usuário
    const user = await User.findById(req.user.userId);
    if (user) {
      await user.removeRefreshToken(refreshToken);
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Logout realizado com sucesso.'
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password');

  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'Usuário não encontrado.'
    });
  }

  res.status(200).json({
    status: 'success',
    data: user
  });
});

/**
 * @desc    Verify 2FA login
 * @route   POST /api/auth/login/verify-2fa
 * @access  Public
 */
export const verify2FALogin = asyncHandler(async (req, res) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ status: 'error', message: 'User ID e token são obrigatórios.' });
  }

  const user = await User.findById(userId).select('+twoFactorSecret');
  if (!user || !user.isTwoFactorEnabled) {
    return res.status(400).json({ status: 'error', message: 'Usuário não encontrado ou 2FA não habilitado.' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token
  });

  if (!verified) {
    console.warn(`Tentativa de login falha: token 2FA inválido [${user.email}]`);
    return res.status(401).json({ status: 'error', message: 'Código 2FA inválido.' });
  }

  // Gera tokens
  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  const refreshToken = generateRefreshToken({ userId: user._id });
  user.lastLogin = new Date();
  await user.addRefreshToken(refreshToken);

  console.info(`Login com sucesso (2FA): [${user.email}] - Role: ${user.role}`);

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    }
  });
});

/**
 * @desc    Setup 2FA for current user
 * @route   POST /api/auth/2fa/setup
 * @access  Private
 */
export const setup2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  
  if (user.isTwoFactorEnabled) {
    return res.status(400).json({ status: 'error', message: '2FA já está habilitado.' });
  }

  const secret = speakeasy.generateSecret({ name: `CliniDent (${user.email})` });
  
  user.twoFactorSecret = secret.base32;
  await user.save();

  qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'Erro ao gerar QR Code.' });
    }
    res.status(200).json({
      status: 'success',
      data: { secret: secret.base32, qrCode: dataUrl }
    });
  });
});

/**
 * @desc    Verify and enable 2FA for current user
 * @route   POST /api/auth/2fa/verify
 * @access  Private
 */
export const verify2FA = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user.userId).select('+twoFactorSecret');

  if (user.isTwoFactorEnabled) {
    return res.status(400).json({ status: 'error', message: '2FA já está habilitado.' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token
  });

  if (verified) {
    user.isTwoFactorEnabled = true;
    await user.save();
    res.status(200).json({ status: 'success', message: '2FA habilitado com sucesso.' });
  } else {
    res.status(400).json({ status: 'error', message: 'Código 2FA inválido.' });
  }
});



