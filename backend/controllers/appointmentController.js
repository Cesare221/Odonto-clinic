import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import AppointmentSlotLock from '../models/AppointmentSlotLock.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/apiError.js';
import {
  signAppointmentConfirmationToken,
  verifyAppointmentConfirmationToken,
} from '../utils/appointmentConfirmationToken.js';
import { resolveClientUrlForRequest } from '../config/runtime.js';

const ALLOWED_CONFIRMATION_ACTIONS = ['confirmado', 'recusado', 'remarcar'];
const ACTIVE_SLOT_STATUSES = new Set(['scheduled', 'in-progress']);
const BLOCKING_ATTENDANCE_STATUSES = new Set(['waiting', 'in-progress', 'pre_reserved']);
const ACTIVE_RESCHEDULE_REQUEST_STATUSES = new Set(['pending_review', 'approved', 'adjusted']);
const PUBLIC_SLOT_WINDOW_DAYS = 90;
const CLINIC_HOURS = {
  startHour: 8.5,
  endHour: 18,
  slotDurationMinutes: 30,
};
const PUBLIC_BOOKING_DEFAULT_TYPE = 'eval';
const PUBLIC_BOOKING_TYPE_LABELS = {
  eval: 'Avaliação',
  routine: 'Rotina',
  surgery: 'Cirurgia',
  ortho: 'Ortodontia',
  aesthetic: 'Estética',
  emergency: 'Emergência',
};

const toDate = (value) => (value instanceof Date ? value : new Date(value));
const trimText = (value) => String(value || '').trim();
const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');
const normalizeEmail = (value) => trimText(value).toLowerCase();
const formatCpf = (value) => {
  const digits = normalizeDigits(value);

  if (digits.length !== 11) {
    return trimText(value);
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};
const getPublicBookingProcedureLabel = (type, procedure) => (
  trimText(procedure) || PUBLIC_BOOKING_TYPE_LABELS[type] || PUBLIC_BOOKING_TYPE_LABELS[PUBLIC_BOOKING_DEFAULT_TYPE]
);
const buildPublicAppointmentTitle = (patientName, procedureLabel) => `${procedureLabel} - ${patientName}`;

const datesOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;

const isActiveAppointmentBlocker = (appointment) => {
  const status = appointment?.status || 'scheduled';
  const attendanceStatus = appointment?.attendanceStatus || 'waiting';

  return ACTIVE_SLOT_STATUSES.has(status) && BLOCKING_ATTENDANCE_STATUSES.has(attendanceStatus);
};

const isActivePreReserveBlocker = (appointment) => {
  const requestStatus = appointment?.rescheduleRequest?.requestStatus;

  return ACTIVE_RESCHEDULE_REQUEST_STATUSES.has(requestStatus);
};

const buildPublicRescheduleReview = (appointment, requestStatus, note, overrides = {}) => ({
  requestedAt: appointment?.rescheduleRequest?.requestedAt || new Date(),
  requestedStart: overrides.requestedStart ?? appointment?.rescheduleRequest?.requestedStart ?? null,
  requestedEnd: overrides.requestedEnd ?? appointment?.rescheduleRequest?.requestedEnd ?? null,
  requestSource: appointment?.rescheduleRequest?.requestSource || 'public_confirmation',
  requestStatus,
  reviewedAt: overrides.reviewedAt ?? appointment?.rescheduleRequest?.reviewedAt ?? null,
  reviewedBy: overrides.reviewedBy ?? appointment?.rescheduleRequest?.reviewedBy ?? null,
  reviewNote: overrides.reviewNote ?? note ?? appointment?.rescheduleRequest?.reviewNote ?? '',
  finalStart: overrides.finalStart ?? appointment?.rescheduleRequest?.finalStart ?? null,
  finalEnd: overrides.finalEnd ?? appointment?.rescheduleRequest?.finalEnd ?? null,
});

const isSlotRangeValid = (requestedStart, requestedEnd) => (
  requestedStart instanceof Date
  && requestedEnd instanceof Date
  && !Number.isNaN(requestedStart.getTime())
  && !Number.isNaN(requestedEnd.getTime())
  && requestedStart < requestedEnd
);

const isWithinPublicRescheduleWindow = (requestedStart, requestedEnd, now = new Date()) => {
  if (!isSlotRangeValid(requestedStart, requestedEnd)) {
    return false;
  }

  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + PUBLIC_SLOT_WINDOW_DAYS);

  const slotDurationMinutes = (requestedEnd.getTime() - requestedStart.getTime()) / (60 * 1000);
  const minutesFromMidnight = (requestedStart.getHours() * 60) + requestedStart.getMinutes();

  return (
    requestedStart > now
    && requestedEnd <= maxDate
    && requestedStart.getDay() !== 0
    && minutesFromMidnight >= CLINIC_HOURS.startHour * 60
    && (minutesFromMidnight + slotDurationMinutes) <= CLINIC_HOURS.endHour * 60
    && requestedStart.getSeconds() === 0
    && requestedStart.getMilliseconds() === 0
    && requestedEnd.getSeconds() === 0
    && requestedEnd.getMilliseconds() === 0
    && requestedStart.getMinutes() % CLINIC_HOURS.slotDurationMinutes === 0
    && slotDurationMinutes === CLINIC_HOURS.slotDurationMinutes
  );
};

const isDuplicateKeyError = (error) => error?.code === 11000;

const acquireSlotLock = async ({ doctor, appointmentId, requestedStart, requestedEnd }) => {
  try {
    return await AppointmentSlotLock.create({
      doctor,
      appointment: appointmentId,
      start: requestedStart,
      end: requestedEnd,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const existingLock = await AppointmentSlotLock.findOne({
      doctor,
      start: requestedStart,
      end: requestedEnd,
    });

    if (existingLock && String(existingLock.appointment) === String(appointmentId)) {
      return existingLock;
    }

    return null;
  }
};

const releaseSlotLock = async ({ doctor, appointmentId, requestedStart, requestedEnd }) => (
  AppointmentSlotLock.deleteOne({
    doctor,
    appointment: appointmentId,
    start: requestedStart,
    end: requestedEnd,
  })
);

const buildAvailabilityQuery = ({ doctorId, excludeAppointmentId }, rangeStart, rangeEnd) => {
  const query = {
    doctor: doctorId,
    $or: [
      {
        start: { $lt: rangeEnd },
        end: { $gt: rangeStart },
        status: { $in: Array.from(ACTIVE_SLOT_STATUSES) },
      },
      {
        'rescheduleRequest.requestStatus': { $in: Array.from(ACTIVE_RESCHEDULE_REQUEST_STATUSES) },
        'rescheduleRequest.requestedStart': { $lt: rangeEnd },
        'rescheduleRequest.requestedEnd': { $gt: rangeStart },
      },
    ],
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  return query;
};

const findBlockingAppointmentsByDoctor = async ({ doctorId, excludeAppointmentId }, requestedStart, requestedEnd) => (
  Appointment.find(buildAvailabilityQuery({ doctorId, excludeAppointmentId }, requestedStart, requestedEnd))
);

const findBlockingAppointmentsForRange = async (appointment, requestedStart, requestedEnd) => (
  findBlockingAppointmentsByDoctor(
    {
      doctorId: appointment.doctor,
      excludeAppointmentId: appointment._id,
    },
    requestedStart,
    requestedEnd
  )
);

const ensureValidPublicToken = async (token) => {
  let payload;

  try {
    payload = verifyAppointmentConfirmationToken(token);
  } catch {
    return {
      error: {
        status: 400,
        message: 'Link invalido ou expirado.',
      },
    };
  }

  const appointment = await Appointment.findById(payload.appointmentId);

  if (!appointment || appointment.confirmToken !== token) {
    return {
      error: {
        status: 400,
        message: 'Link invalido ou expirado.',
      },
    };
  }

  if (!appointment.confirmTokenExpiresAt || appointment.confirmTokenExpiresAt < new Date()) {
    return {
      error: {
        status: 400,
        message: 'Link invalido ou expirado.',
      },
    };
  }

  return { appointment };
};

export const isSlotAvailableForPublicReschedule = (appointments, requestedStart, requestedEnd) => {
  return !appointments.some((appointment) => {
    const start = toDate(appointment.start);
    const end = toDate(appointment.end);
    const requestedSlotStart = appointment?.rescheduleRequest?.requestedStart
      ? toDate(appointment.rescheduleRequest.requestedStart)
      : null;
    const requestedSlotEnd = appointment?.rescheduleRequest?.requestedEnd
      ? toDate(appointment.rescheduleRequest.requestedEnd)
      : null;

    const blocksCurrentAppointment = (
      isActiveAppointmentBlocker(appointment)
      && datesOverlap(start, end, requestedStart, requestedEnd)
    );
    const blocksPreReserve = (
      requestedSlotStart
      && requestedSlotEnd
      && isActivePreReserveBlocker(appointment)
      && datesOverlap(requestedSlotStart, requestedSlotEnd, requestedStart, requestedEnd)
    );

    return blocksCurrentAppointment || blocksPreReserve;
  });
};

const buildAvailabilityWindow = (now = new Date()) => {
  const rangeStart = new Date(now);
  const rangeEnd = new Date(now);
  rangeEnd.setDate(rangeEnd.getDate() + PUBLIC_SLOT_WINDOW_DAYS);

  return { rangeStart, rangeEnd };
};

const generatePublicAvailabilityOptions = async ({
  doctorId,
  excludeAppointmentId = null,
  excludeExactSlot = null,
}) => {
  const now = new Date();
  const options = [];
  const seen = new Set();
  const { rangeStart, rangeEnd } = buildAvailabilityWindow(now);

  const existingAppointments = await Appointment.find(
    buildAvailabilityQuery({ doctorId, excludeAppointmentId }, rangeStart, rangeEnd)
  );
  const lockQuery = {
    doctor: doctorId,
    start: { $lt: rangeEnd },
    end: { $gt: rangeStart },
  };

  if (excludeAppointmentId) {
    lockQuery.appointment = { $ne: excludeAppointmentId };
  }

  const existingLocks = await AppointmentSlotLock.find(lockQuery);

  for (let dayOffset = 0; dayOffset < PUBLIC_SLOT_WINDOW_DAYS; dayOffset += 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + dayOffset);

    if (day.getDay() === 0) {
      continue;
    }

    for (
      let minutes = CLINIC_HOURS.startHour * 60;
      minutes < CLINIC_HOURS.endHour * 60;
      minutes += CLINIC_HOURS.slotDurationMinutes
    ) {
      const start = new Date(day);
      start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      const end = new Date(start.getTime() + (CLINIC_HOURS.slotDurationMinutes * 60 * 1000));

      if (start <= now) {
        continue;
      }

      if (
        excludeExactSlot
        && start.getTime() === toDate(excludeExactSlot.start).getTime()
        && end.getTime() === toDate(excludeExactSlot.end).getTime()
      ) {
        continue;
      }

      if (!isSlotAvailableForPublicReschedule(existingAppointments, start, end)) {
        continue;
      }

      const hasActiveLock = existingLocks.some((lock) => (
        datesOverlap(toDate(lock.start), toDate(lock.end), start, end)
      ));
      if (hasActiveLock) {
        continue;
      }

      const key = `${start.toISOString()}-${end.toISOString()}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      options.push({
        start: start.toISOString(),
        end: end.toISOString(),
      });
    }
  }

  return options;
};

const generatePublicRescheduleOptions = async (appointment) => (
  generatePublicAvailabilityOptions({
    doctorId: appointment.doctor,
    excludeAppointmentId: appointment._id,
    excludeExactSlot: {
      start: appointment.start,
      end: appointment.end,
    },
  })
);

const listPublicBookingDoctors = async () => {
  const doctors = await User.find({
    role: 'doctor',
    isActive: true,
  })
    .sort({ name: 1, createdAt: 1, _id: 1 })
    .select('_id name');

  return doctors.map((doctor) => ({
    id: doctor._id,
    name: doctor.name,
  }));
};

const resolvePublicBookingDoctor = async (doctorId) => {
  if (doctorId && mongoose.Types.ObjectId.isValid(String(doctorId))) {
    return User.findOne({
      _id: doctorId,
      role: 'doctor',
      isActive: true,
    }).select('_id name');
  }

  return User.findOne({
    role: 'doctor',
    isActive: true,
  })
    .sort({ createdAt: 1, _id: 1 })
    .select('_id name');
};

const upsertPublicPatient = async ({ patientName, cpf, phone, email }, createdBy) => {
  const normalizedCpf = formatCpf(cpf);
  const normalizedName = trimText(patientName);
  const normalizedPhone = trimText(phone);
  const normalizedEmail = normalizeEmail(email);

  let patient = await Patient.findOne({ cpf: normalizedCpf });

  if (!patient) {
    try {
      patient = await Patient.create({
        name: normalizedName,
        cpf: normalizedCpf,
        phone: normalizedPhone,
        email: normalizedEmail || undefined,
        createdBy,
        isActive: true,
      });

      return patient;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      patient = await Patient.findOne({ cpf: normalizedCpf });
    }
  }

  if (!patient) {
    throw new Error('Não foi possível localizar ou criar o paciente do agendamento.');
  }

  patient.name = normalizedName || patient.name;
  patient.phone = normalizedPhone || patient.phone;
  patient.email = normalizedEmail || patient.email;
  patient.isActive = true;
  await patient.save();

  return patient;
};

export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.create({
    ...req.body,
    statusConfirmacao: req.body.statusConfirmacao || 'pendente',
    attendanceStatus: req.body.attendanceStatus || 'waiting',
    doctor: req.user.userId,
  });

  res.status(201).json({
    status: 'success',
    data: appointment,
  });
});

export const getPublicBookingAvailability = asyncHandler(async (req, res) => {
  const doctors = await listPublicBookingDoctors();
  const doctor = await resolvePublicBookingDoctor(req.query?.doctorId);

  if (!doctor) {
    return res.status(req.query?.doctorId ? 404 : 503).json({
      status: 'error',
      message: req.query?.doctorId
        ? 'Profissional não encontrado para o agendamento online.'
        : 'Nenhum profissional está disponível para o agendamento online no momento.',
    });
  }

  const slots = await generatePublicAvailabilityOptions({
    doctorId: doctor._id,
  });

  return res.status(200).json({
    status: 'success',
    data: {
      doctor: {
        id: doctor._id,
        name: doctor.name,
      },
      doctors,
      clinicHours: CLINIC_HOURS,
      windowDays: PUBLIC_SLOT_WINDOW_DAYS,
      slots,
    },
  });
});

export const createPublicBooking = asyncHandler(async (req, res) => {
  const {
    patientName,
    cpf,
    phone,
    email,
    requestedStart: requestedStartRaw,
    requestedEnd: requestedEndRaw,
    type = PUBLIC_BOOKING_DEFAULT_TYPE,
    procedure,
    note,
  } = req.body;

  const doctor = await resolvePublicBookingDoctor(req.body?.doctorId);
  if (!doctor) {
    return res.status(503).json({
      status: 'error',
      message: 'Nenhum profissional está disponível para receber agendamentos online no momento.',
    });
  }

  const requestedStart = toDate(requestedStartRaw);
  const requestedEnd = toDate(requestedEndRaw);
  if (!isWithinPublicRescheduleWindow(requestedStart, requestedEnd)) {
    return res.status(400).json({
      status: 'error',
      message: 'Escolha um horário válido dentro da agenda pública.',
    });
  }

  const blockers = await findBlockingAppointmentsByDoctor(
    { doctorId: doctor._id },
    requestedStart,
    requestedEnd
  );
  if (!isSlotAvailableForPublicReschedule(blockers, requestedStart, requestedEnd)) {
    return res.status(409).json({
      status: 'error',
      message: 'O horário escolhido acabou de ficar indisponível. Atualize a agenda e selecione outro horário.',
    });
  }

  const appointmentId = new mongoose.Types.ObjectId();
  const slotLock = await acquireSlotLock({
    doctor: doctor._id,
    appointmentId,
    requestedStart,
    requestedEnd,
  });
  if (!slotLock) {
    return res.status(409).json({
      status: 'error',
      message: 'O horário escolhido acabou de ser reservado por outra solicitação. Atualize a agenda e tente novamente.',
    });
  }

  const patient = await upsertPublicPatient(
    {
      patientName,
      cpf,
      phone,
      email,
    },
    doctor._id
  );
  const procedureLabel = getPublicBookingProcedureLabel(type, procedure);

  const appointment = new Appointment({
    _id: appointmentId,
    title: buildPublicAppointmentTitle(patient.name, procedureLabel),
    patient: patient._id,
    doctor: doctor._id,
    start: requestedStart,
    end: requestedEnd,
    type,
    procedure: procedureLabel,
    patientPhone: patient.phone || trimText(phone),
    notes: trimText(note),
    status: 'scheduled',
    statusConfirmacao: 'confirmado',
    attendanceStatus: 'waiting',
  });

  try {
    await appointment.save();
  } catch (error) {
    await releaseSlotLock({
      doctor: doctor._id,
      appointmentId,
      requestedStart,
      requestedEnd,
    });
    throw error;
  }

  await releaseSlotLock({
    doctor: doctor._id,
    appointmentId,
    requestedStart,
    requestedEnd,
  });

  return res.status(201).json({
    status: 'success',
    data: {
      id: appointment._id,
      title: appointment.title,
      start: appointment.start,
      end: appointment.end,
      procedure: appointment.procedure,
      patient: {
        id: patient._id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email || '',
      },
      doctor: {
        id: doctor._id,
        name: doctor.name,
      },
    },
  });
});

export const getAppointments = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    status,
    doctor,
    attendanceStatus,
    statusConfirmacao,
  } = req.query;

  const query = {};

  if (startDate || endDate) {
    query.start = {};
    if (startDate) query.start.$gte = new Date(startDate);
    if (endDate) query.start.$lte = new Date(endDate);
  }

  if (status) query.status = status;
  if (doctor) query.doctor = doctor;
  if (attendanceStatus) query.attendanceStatus = attendanceStatus;
  if (statusConfirmacao) query.statusConfirmacao = statusConfirmacao;

  const appointments = await Appointment.find(query)
    .populate('patient', 'name cpf phone email')
    .populate('doctor', 'name email')
    .sort({ start: 1 });

  res.status(200).json({
    status: 'success',
    data: appointments,
  });
});

export const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name cpf phone email')
    .populate('doctor', 'name email');

  if (!appointment) {
    return res.status(404).json({
      status: 'error',
      message: 'Agendamento não encontrado.',
    });
  }

  res.status(200).json({
    status: 'success',
    data: appointment,
  });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  if (
    req.user?.role === 'receptionist'
    && (req.body?.attendanceStatus || req.body?.status === 'in-progress')
  ) {
    return res.status(403).json({
      status: 'error',
      message: 'Recepcionista não possui permissão para iniciar atendimento.',
    });
  }

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!appointment) {
    return res.status(404).json({
      status: 'error',
      message: 'Agendamento não encontrado.',
    });
  }

  res.status(200).json({
    status: 'success',
    data: appointment,
  });
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      status: 'error',
      message: 'Agendamento não encontrado.',
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Agendamento cancelado com sucesso.',
  });
});

export const getCalendarAppointments = asyncHandler(async (req, res) => {
  const { weekStart, weekEnd } = req.query;

  const query = {
    start: {
      $gte: new Date(weekStart),
      $lte: new Date(weekEnd),
    },
  };

  const appointments = await Appointment.find(query)
    .populate('patient', 'name cpf')
    .sort({ start: 1 });

  res.status(200).json({
    status: 'success',
    data: appointments,
  });
});

export const updateAppointmentAttendanceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { attendanceStatus } = req.body;

  const appointment = await Appointment.findByIdAndUpdate(
    id,
    { attendanceStatus },
    { new: true, runValidators: true }
  );

  if (!appointment) {
    return res.status(404).json({
      status: 'error',
      message: 'Agendamento não encontrado.',
    });
  }

  return res.status(200).json({
    status: 'success',
    data: appointment,
  });
});

export const updateAppointmentConfirmationHandled = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const handled = req.body?.handled !== false;
  const update = handled
    ? { confirmacaoTratadaAt: new Date(), confirmacaoTratadaBy: req.user?.userId || null }
    : { confirmacaoTratadaAt: null, confirmacaoTratadaBy: null };

  const appointment = await Appointment.findByIdAndUpdate(
    id,
    update,
    { new: true, runValidators: true }
  );

  if (!appointment) {
    return res.status(404).json({
      status: 'error',
      message: 'Agendamento não encontrado.',
    });
  }

  return res.status(200).json({
    status: 'success',
    data: appointment,
  });
});

export const generateAppointmentConfirmationLink = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name phone');

  if (!appointment) {
    return res.status(404).json({
      status: 'error',
      message: 'Agendamento não encontrado.',
    });
  }

  const token = signAppointmentConfirmationToken({
    appointmentId: appointment._id.toString(),
  });

  appointment.confirmToken = token;
  appointment.confirmTokenExpiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000));
  appointment.confirmTokenUsedAt = null;
  await appointment.save();

  const baseUrl = resolveClientUrlForRequest(req);

  return res.status(200).json({
    status: 'success',
    data: {
      token,
      url: `${baseUrl}/confirmacao/${token}`,
    },
  });
});

export const getPublicRescheduleOptions = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const tokenCheck = await ensureValidPublicToken(token);

  if (tokenCheck.error) {
    return res.status(tokenCheck.error.status).json({
      status: 'error',
      message: tokenCheck.error.message,
    });
  }

  if (tokenCheck.appointment.confirmTokenUsedAt) {
    return res.status(409).json({
      status: 'error',
      message: 'Este link já foi utilizado. Solicite um novo link de confirmação.',
    });
  }

  const options = await generatePublicRescheduleOptions(tokenCheck.appointment);

  return res.status(200).json({
    status: 'success',
    data: options,
  });
});

export const submitAppointmentConfirmation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const {
    action,
    note,
    requestedStart: requestedStartRaw,
    requestedEnd: requestedEndRaw,
  } = req.body;

  if (!ALLOWED_CONFIRMATION_ACTIONS.includes(action)) {
    return res.status(400).json({
      status: 'error',
      message: 'Ação inválida. Use: confirmado, recusado ou remarcar.',
    });
  }

  const tokenCheck = await ensureValidPublicToken(token);
  if (tokenCheck.error) {
    return res.status(tokenCheck.error.status).json({
      status: 'error',
      message: tokenCheck.error.message,
    });
  }

  const appointment = tokenCheck.appointment;
  const normalizedNote = trimText(note);
  const requestedStart = requestedStartRaw ? toDate(requestedStartRaw) : null;
  const requestedEnd = requestedEndRaw ? toDate(requestedEndRaw) : null;

  if (appointment.confirmTokenUsedAt) {
    const sameAction = appointment.statusConfirmacao === action;
    const sameNote = (appointment.confirmacaoObservacao || '') === normalizedNote;
    const sameRequestedStart = (
      (!requestedStart && !appointment?.rescheduleRequest?.requestedStart)
      || (
        requestedStart
        && appointment?.rescheduleRequest?.requestedStart
        && toDate(appointment.rescheduleRequest.requestedStart).getTime() === requestedStart.getTime()
      )
    );
    const sameRequestedEnd = (
      (!requestedEnd && !appointment?.rescheduleRequest?.requestedEnd)
      || (
        requestedEnd
        && appointment?.rescheduleRequest?.requestedEnd
        && toDate(appointment.rescheduleRequest.requestedEnd).getTime() === requestedEnd.getTime()
      )
    );

    if (sameAction && sameNote && sameRequestedStart && sameRequestedEnd) {
      return res.status(200).json({
        status: 'success',
        message: 'Resposta já registrada anteriormente.',
        data: appointment,
      });
    }

    return res.status(409).json({
      status: 'error',
      message: 'Este link já foi utilizado. Solicite um novo link de confirmação.',
    });
  }

  if (action === 'remarcar') {
    if (!isWithinPublicRescheduleWindow(requestedStart, requestedEnd)) {
      return res.status(400).json({
        status: 'error',
        message: 'Informe um novo horário válido dentro da janela pública de remarcação.',
      });
    }

    const blockers = await findBlockingAppointmentsForRange(appointment, requestedStart, requestedEnd);
    if (!isSlotAvailableForPublicReschedule(blockers, requestedStart, requestedEnd)) {
      return res.status(409).json({
        status: 'error',
        message: 'O horário escolhido não está mais disponível. Atualize as opções e selecione outro horário.',
      });
    }

    const slotLock = await acquireSlotLock({
      doctor: appointment.doctor,
      appointmentId: appointment._id,
      requestedStart,
      requestedEnd,
    });
    if (!slotLock) {
      return res.status(409).json({
        status: 'error',
        message: 'O horário escolhido acabou de ser reservado por outra solicitação. Atualize as opções e tente novamente.',
      });
    }

    appointment.attendanceStatus = 'pre_reserved';
    appointment.rescheduleRequest = buildPublicRescheduleReview(
      appointment,
      'pending_review',
      normalizedNote,
      {
        requestedAt: new Date(),
        requestedStart,
        requestedEnd,
        reviewedAt: null,
        reviewedBy: null,
        reviewNote: '',
        finalStart: null,
        finalEnd: null,
      }
    );
  }

  if (action !== 'remarcar') {
    appointment.attendanceStatus = appointment.attendanceStatus === 'pre_reserved'
      ? 'waiting'
      : appointment.attendanceStatus;
    appointment.rescheduleRequest = null;
  }

  appointment.statusConfirmacao = action;
  appointment.confirmacaoObservacao = normalizedNote;
  appointment.confirmacaoTratadaAt = null;
  appointment.confirmacaoTratadaBy = null;
  appointment.confirmTokenUsedAt = new Date();
  appointment.confirmacaoRespondedAt = new Date();
  appointment.confirmacaoResponderIp = req.ip || '';
  appointment.confirmacaoResponderUserAgent = req.get('user-agent') || '';

  try {
    await appointment.save();
  } catch (error) {
    if (action === 'remarcar') {
      await releaseSlotLock({
        doctor: appointment.doctor,
        appointmentId: appointment._id,
        requestedStart,
        requestedEnd,
      });
    }
    throw error;
  }

  return res.status(200).json({
    status: 'success',
    data: appointment,
  });
});

export const updateAppointmentRescheduleRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    rescheduleDecision,
    note,
    requestedStart: requestedStartRaw,
    requestedEnd: requestedEndRaw,
  } = req.body;

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return res.status(404).json({
      status: 'error',
      message: 'Agendamento não encontrado.',
    });
  }

  const hasActivePreReserve = (
    appointment.attendanceStatus === 'pre_reserved'
    && appointment?.rescheduleRequest?.requestStatus === 'pending_review'
  );

  if (!hasActivePreReserve) {
    return res.status(409).json({
      status: 'error',
      message: 'Este agendamento não possui uma pré-reserva ativa para revisão.',
    });
  }

  const normalizedNote = trimText(note);
  const originalRequestedStart = toDate(appointment.rescheduleRequest.requestedStart);
  const originalRequestedEnd = toDate(appointment.rescheduleRequest.requestedEnd);
  const isChangingSlot = Boolean(requestedStartRaw || requestedEndRaw);

  if (rescheduleDecision === 'approved' && isChangingSlot) {
    return res.status(400).json({
      status: 'error',
      message: 'Use `adjusted` quando precisar alterar o horário durante a aprovação.',
    });
  }

  const requestedStart = requestedStartRaw
    ? toDate(requestedStartRaw)
    : originalRequestedStart;
  const requestedEnd = requestedEndRaw
    ? toDate(requestedEndRaw)
    : originalRequestedEnd;

  if (rescheduleDecision === 'released') {
    appointment.attendanceStatus = 'waiting';
    appointment.rescheduleRequest = buildPublicRescheduleReview(
      appointment,
      'released',
      normalizedNote,
      {
        reviewedAt: new Date(),
        reviewedBy: req.user?.userId || null,
        reviewNote: normalizedNote,
        finalStart: null,
        finalEnd: null,
      }
    );
    await appointment.save();
    await releaseSlotLock({
      doctor: appointment.doctor,
      appointmentId: appointment._id,
      requestedStart: originalRequestedStart,
      requestedEnd: originalRequestedEnd,
    });

    return res.status(200).json({
      status: 'success',
      data: appointment,
    });
  }

  if (!isWithinPublicRescheduleWindow(requestedStart, requestedEnd)) {
    return res.status(400).json({
      status: 'error',
      message: 'Informe um intervalo válido dentro da janela pública de remarcação.',
    });
  }

  const blockers = await findBlockingAppointmentsForRange(appointment, requestedStart, requestedEnd);
  if (!isSlotAvailableForPublicReschedule(blockers, requestedStart, requestedEnd)) {
    return res.status(409).json({
      status: 'error',
      message: 'O horário informado não está disponível para concluir a remarcação.',
    });
  }

  const isSameLockedSlot = (
    originalRequestedStart.getTime() === requestedStart.getTime()
    && originalRequestedEnd.getTime() === requestedEnd.getTime()
  );

  if (!isSameLockedSlot) {
    const slotLock = await acquireSlotLock({
      doctor: appointment.doctor,
      appointmentId: appointment._id,
      requestedStart,
      requestedEnd,
    });
    if (!slotLock) {
      return res.status(409).json({
        status: 'error',
        message: 'O horário informado acabou de ser reservado por outra solicitação.',
      });
    }
  }

  appointment.start = requestedStart;
  appointment.end = requestedEnd;
  appointment.statusConfirmacao = 'confirmado';
  appointment.attendanceStatus = 'waiting';
  appointment.rescheduleRequest = buildPublicRescheduleReview(
    appointment,
    rescheduleDecision,
    normalizedNote,
    {
      requestedStart,
      requestedEnd,
      reviewedAt: new Date(),
      reviewedBy: req.user?.userId || null,
      reviewNote: normalizedNote,
      finalStart: requestedStart,
      finalEnd: requestedEnd,
    }
  );

  try {
    await appointment.save();
  } catch (error) {
    if (!isSameLockedSlot) {
      await releaseSlotLock({
        doctor: appointment.doctor,
        appointmentId: appointment._id,
        requestedStart,
        requestedEnd,
      });
    }
    throw error;
  }

  await releaseSlotLock({
    doctor: appointment.doctor,
    appointmentId: appointment._id,
    requestedStart: originalRequestedStart,
    requestedEnd: originalRequestedEnd,
  });
  if (!isSameLockedSlot) {
    await releaseSlotLock({
      doctor: appointment.doctor,
      appointmentId: appointment._id,
      requestedStart,
      requestedEnd,
    });
  }

  return res.status(200).json({
    status: 'success',
    data: appointment,
  });
});
