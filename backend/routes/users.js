// =============================================================================
// ROUTES/USERS.JS - User Management Routes
// =============================================================================

import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  resetPassword,
  deleteUser
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from '../validators/userValidator.js';

const router = express.Router();

// Todas as rotas requerem autenticação e autorização admin
router.use(authenticate);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(validate(createUserSchema), createUser);

router.route('/:id')
  .get(getUser)
  .put(validate(updateUserSchema), updateUser)
  .delete(deleteUser);

router.route('/:id/reset-password')
  .put(validate(resetPasswordSchema), resetPassword);

export default router;
