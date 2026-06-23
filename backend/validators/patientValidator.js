import { z } from 'zod';

const medicalHistorySchema = z.object({
  question: z.string(),
  answer: z.enum(['sim', 'nao']),
  detail: z.string().optional(),
});

const addressSchema = z.object({
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const phoneSchema = z.string().optional().refine((value) => {
  if (!value) return true;
  return value.replace(/\D/g, '').length >= 10;
}, 'Telefone invalido.');

export const createPatientSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'O nome e obrigatorio.'),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF invalido.'),
    phone: phoneSchema,
    email: z.string().email('E-mail invalido.').optional(),
    birthdate: z.string().optional(),
    gender: z.enum(['Masculino', 'Feminino', 'Outro', 'Nao informado']).optional(),
    address: addressSchema.optional(),
    medicalHistory: z.array(medicalHistorySchema).optional(),
  }),
});

export const updatePatientSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'O nome e obrigatorio.').optional(),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF invalido.').optional(),
    rg: z.string().optional(),
    phone: phoneSchema,
    email: z.string().email('E-mail invalido.').optional(),
    birthdate: z.string().optional(),
    gender: z.enum(['Masculino', 'Feminino', 'Outro', 'Nao informado']).optional(),
    maritalStatus: z.string().optional(),
    profession: z.string().optional(),
    address: addressSchema.optional(),
    medicalHistory: z.array(medicalHistorySchema).optional(),
    dentalNotes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});
