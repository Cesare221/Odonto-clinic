// =============================================================================
// UTILS/JWTUTILS.JS - BACKEND - Utility functions for JWT management
// =============================================================================

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createSecretKey } from 'node:crypto';
import { promisify } from 'node:util';

// Converte as chaves secretas em objetos KeyObject para melhor desempenho
const getSecretKey = (secret) => {
  if (!secret) {
    throw new Error('JWT secret is not defined');
  }
  return createSecretKey(Buffer.from(secret, 'utf-8'));
};

// Cria versões assíncronas das funções de verificação para evitar bloqueio
const jwtVerifyAsync = promisify(jwt.verify);

/**
 * Gera um access token (curta duração)
 * @param {Object} payload - Dados do usuário
 * @returns {String} - Token JWT
 */
export const generateAccessToken = (payload) => {
  const secret = getSecretKey(process.env.JWT_SECRET);
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role },
    secret,
    { expiresIn: '15m', issuer: 'clinica-odonto-api', algorithm: 'HS256' }
  );
};

/**
 * Gera um refresh token (longa duração)
 * @param {Object} payload - Dados do usuário
 * @returns {String} - Token JWT
 */
export const generateRefreshToken = (payload) => {
  const secret = getSecretKey(process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  return jwt.sign(
    { userId: payload.userId, type: 'refresh' },
    secret,
    { expiresIn: '7d', issuer: 'clinica-odonto-api', algorithm: 'HS256' }
  );
};

/**
 * Verifica e retorna payload do access token
 * @param {String} token - Token a ser verificado
 * @returns {Object} - Payload decodificado
 * @throws {Error} - Se token inválido
 */
export const verifyAccessToken = async (token) => {
  const secret = getSecretKey(process.env.JWT_SECRET);
  return await jwtVerifyAsync(token, secret);
};

/**
 * Verifica e retorna payload do refresh token
 * @param {String} token - Token a ser verificado
 * @returns {Object} - Payload decodificado
 * @throws {Error} - Se token inválido
 */
export const verifyRefreshToken = async (token) => {
  const secret = getSecretKey(process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  return await jwtVerifyAsync(token, secret);
};

/**
 * Renova o par de tokens usando o refresh token
 * - Remove o token antigo (rotação)
 * - Rejeita se o token não for encontrado (possível roubo)
 * @param {String} refreshToken - Refresh token atual
 * @returns {Object} - Novos tokens
 */
export const refreshTokenPair = async (refreshToken) => {
  const payload = await verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId);
  
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  
  const storedToken = user.refreshTokens.find(t => t.token === refreshToken);
  if (!storedToken) {
    // Token não encontrado na lista — possível roubo ou reuso
    // Limpa todos os refresh tokens do usuário por segurança
    user.refreshTokens = [];
    await user.save();
    const err = new Error('Refresh token inválido ou reutilizado');
    err.statusCode = 401;
    throw err;
  }
  
  // Remove o token antigo (rotação)
  await user.removeRefreshToken(refreshToken);
  
  const newAccessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });
  
  const newRefreshToken = generateRefreshToken({
    userId: user._id
  });
  
  // Adiciona o novo token
  await user.addRefreshToken(newRefreshToken);
  
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Gera par completo de tokens para um usuário recém-autenticado
 * Atualiza o refresh token no banco
 */
export const generateAuthTokens = async (user) => {
  const accessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });
  
  const refreshToken = generateRefreshToken({
    userId: user._id
  });
  
  // Armazena o refresh token hash no banco (para invalidação futura)
  await user.addRefreshToken(refreshToken);
  
  return { accessToken, refreshToken };
};
