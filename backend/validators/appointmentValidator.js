import { z } from 'zod';

const attendanceStatusEnum = z.enum(['waiting', 'in-progress', 'done', 'pre_reserved']);
const confirmationActionEnum = z.enum(['confirmado', 'recusado', 'remarcar']);
const rescheduleDecisionEnum = z.enum(['approved', 'released', 'adjusted']);
const publicAppointmentTypeEnum = z.enum(['eval', 'routine', 'surgery', 'ortho', 'aesthetic', 'emergency']);
const publicCpfRegex = /^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;

const addRequestedSlotValidation = (body, context, startMessage, endMessage) => {
  if (!body.requestedStart && !body.requestedEnd) {
    return;
  }

  if (!body.requestedStart || !body.requestedEnd) {
    context.addIssue({
      code: 'custom',
      path: ['requestedStart'],
      message: startMessage,
    });
    return;
  }

  if (new Date(body.requestedStart) >= new Date(body.requestedEnd)) {
    context.addIssue({
      code: 'custom',
      path: ['requestedEnd'],
      message: endMessage,
    });
  }
};

export const createAppointmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'O título é obrigatório.'),
    patient: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID do paciente inválido.'),
    doctor: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID do profissional inválido.').optional(),
    start: z.string().datetime('A data de início deve ser válida.'),
    end: z.string().datetime('A data de término deve ser válida.'),
    type: z.enum(['eval', 'routine', 'surgery', 'ortho', 'aesthetic', 'emergency']).optional(),
    procedure: z.string().min(2, 'Procedimento deve ter ao menos 2 caracteres.').optional(),
    patientPhone: z.string().min(8, 'Telefone do paciente inválido.').optional(),
    statusConfirmacao: z.enum(['pendente', 'confirmado', 'recusado', 'remarcar']).optional(),
    confirmacaoObservacao: z.string().max(280, 'Observação muito longa.').optional(),
    attendanceStatus: attendanceStatusEnum.optional(),
    status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']).optional(),
    notes: z.string().optional(),
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'O título é obrigatório.').optional(),
    patient: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID do paciente inválido.').optional(),
    doctor: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID do profissional inválido.').optional(),
    start: z.string().datetime('A data de início deve ser válida.').optional(),
    end: z.string().datetime('A data de término deve ser válida.').optional(),
    type: z.enum(['eval', 'routine', 'surgery', 'ortho', 'aesthetic', 'emergency']).optional(),
    procedure: z.string().min(2, 'Procedimento deve ter ao menos 2 caracteres.').optional(),
    patientPhone: z.string().min(8, 'Telefone do paciente inválido.').optional(),
    statusConfirmacao: z.enum(['pendente', 'confirmado', 'recusado', 'remarcar']).optional(),
    confirmacaoObservacao: z.string().max(280, 'Observação muito longa.').optional(),
    attendanceStatus: attendanceStatusEnum.optional(),
    status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']).optional(),
    notes: z.string().optional(),
    reminderSent: z.boolean().optional(),
  }),
});

export const updateAttendanceStatusSchema = z.object({
  body: z.object({
    attendanceStatus: attendanceStatusEnum,
  }),
});

export const updateConfirmationHandledSchema = z.object({
  body: z.object({
    handled: z.boolean().optional().default(true),
  }),
});

export const publicBookingAvailabilitySchema = z.object({
  query: z.object({
    doctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID do profissional inválido.').optional(),
  }),
});

export const createPublicBookingSchema = z.object({
  body: z.object({
    patientName: z.string().min(3, 'Informe o nome completo do paciente.'),
    cpf: z.string().regex(publicCpfRegex, 'Informe um CPF válido.'),
    phone: z.string().min(8, 'Telefone do paciente inválido.'),
    email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
    doctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID do profissional inválido.').optional(),
    requestedStart: z.string().datetime('A data do agendamento deve ser válida.'),
    requestedEnd: z.string().datetime('A data final do agendamento deve ser válida.'),
    type: publicAppointmentTypeEnum.optional(),
    procedure: z.string().max(120, 'Procedimento muito longo.').optional(),
    note: z.string().max(280, 'Observação muito longa.').optional(),
  }).superRefine((body, context) => {
    if (new Date(body.requestedStart) >= new Date(body.requestedEnd)) {
      context.addIssue({
        code: 'custom',
        path: ['requestedEnd'],
        message: 'O horário final do agendamento deve ser maior que o inicial.',
      });
    }
  }),
});

export const submitAppointmentConfirmationSchema = z.object({
  body: z.object({
    action: confirmationActionEnum,
    note: z.string().max(280, 'Observação muito longa.').optional(),
    requestedStart: z.string().datetime('A data de remarcação deve ser válida.').optional(),
    requestedEnd: z.string().datetime('A data de término da remarcação deve ser válida.').optional(),
  }).superRefine((body, context) => {
    if (body.action === 'remarcar') {
      if (!body.requestedStart || !body.requestedEnd) {
        context.addIssue({
          code: 'custom',
          path: ['requestedStart'],
          message: 'Informe o novo horário solicitado para a remarcação.',
        });
        return;
      }
    }

    addRequestedSlotValidation(
      body,
      context,
      'Informe um intervalo completo para a remarcação.',
      'O horário final da remarcação deve ser maior que o inicial.'
    );
  }),
});

export const updateRescheduleRequestSchema = z.object({
  body: z.object({
    rescheduleDecision: rescheduleDecisionEnum,
    note: z.string().max(280, 'Observação muito longa.').optional(),
    requestedStart: z.string().datetime('A data de remarcação deve ser válida.').optional(),
    requestedEnd: z.string().datetime('A data de término da remarcação deve ser válida.').optional(),
  }).superRefine((body, context) => {
    if (body.rescheduleDecision === 'adjusted' && (!body.requestedStart || !body.requestedEnd)) {
      context.addIssue({
        code: 'custom',
        path: ['requestedStart'],
        message: 'Informe o novo horário ajustado para concluir a remarcação.',
      });
      return;
    }

    if (
      body.rescheduleDecision === 'approved'
      && (body.requestedStart || body.requestedEnd)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['rescheduleDecision'],
        message: 'Use `adjusted` para alterar o horário ao aprovar a remarcação.',
      });
      return;
    }

    addRequestedSlotValidation(
      body,
      context,
      'Informe um intervalo completo para a remarcação.',
      'O horário final da remarcação deve ser maior que o inicial.'
    );
  }),
});

