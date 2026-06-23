// =============================================================================
// VALIDATORS/USERVALIDATOR.JS - User validation schemas
// =============================================================================

import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    role: z.enum(['admin', 'doctor', 'receptionist']).optional()
  })
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
    email: z.string().email('Email inválido').optional(),
    role: z.enum(['admin', 'doctor', 'receptionist']).optional(),
    isActive: z.boolean().optional()
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres')
  })
});

export default {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema
};
