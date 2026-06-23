// =============================================================================
// CONTROLLERS/USERCONTROLLER.JS - User Management
// =============================================================================

import User from '../models/User.js';
import { asyncHandler } from '../utils/apiError.js';

/**
 * @desc Get all users (admin only)
 * @route GET /api/users
 * @access Private/Admin
 */
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password -refreshTokens');
  
  res.status(200).json({
    status: 'success',
    count: users.length,
    data: users
  });
});

/**
 * @desc Get single user
 * @route GET /api/users/:id
 * @access Private/Admin
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshTokens');
  
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
 * @desc Create new user
 * @route POST /api/users
 * @access Private/Admin
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Verifica se email já existe
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      status: 'error',
      message: 'Este email já está cadastrado.'
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'doctor'
  });

  res.status(201).json({
    status: 'success',
    message: 'Usuário criado com sucesso.',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

/**
 * @desc Update user
 * @route PUT /api/users/:id
 * @access Private/Admin
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, isActive } = req.body;

  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'Usuário não encontrado.'
    });
  }

  // Verifica email duplicado
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'Este email já está em uso por outro usuário.'
      });
    }
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.role = role || user.role;
  user.isActive = isActive !== undefined ? isActive : user.isActive;

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Usuário atualizado com sucesso.',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  });
});

/**
 * @desc Reset user password
 * @route PUT /api/users/:id/reset-password
 * @access Private/Admin
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      status: 'error',
      message: 'Senha é obrigatória.'
    });
  }

  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'Usuário não encontrado.'
    });
  }

  user.password = password; // O middleware de hash fará o trabalho
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Senha redefinida com sucesso.'
  });
});

/**
 * @desc Delete user
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'Usuário não encontrado.'
    });
  }

  // Não permite excluir a si mesmo
  if (user._id.toString() === req.user.userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Você não pode excluir sua própria conta.'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Usuário excluído com sucesso.'
  });
});
