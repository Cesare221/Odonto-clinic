import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.'),
    email: z.string().email('O e-mail fornecido não é válido.'),
    password: z.string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres.')
      .regex(passwordRegex, 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.'),
    role: z.enum(['admin', 'doctor', 'receptionist']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('O e-mail fornecido não é válido.'),
    password: z.string().min(1, 'A senha é obrigatória.'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'O refresh token é obrigatório.'),
  }),
});
