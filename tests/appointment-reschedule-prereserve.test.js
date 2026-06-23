import test from 'node:test';
import assert from 'node:assert/strict';
import Appointment from '../backend/models/Appointment.js';
import AppointmentSlotLock from '../backend/models/AppointmentSlotLock.js';
import Patient from '../backend/models/Patient.js';
import User from '../backend/models/User.js';
import {
  createPublicBooking,
  getPublicRescheduleOptions,
  getPublicBookingAvailability,
  submitAppointmentConfirmation,
  updateAppointmentRescheduleRequest,
  isSlotAvailableForPublicReschedule,
} from '../backend/controllers/appointmentController.js';
import { signAppointmentConfirmationToken } from '../backend/utils/appointmentConfirmationToken.js';

const RealDate = Date;
const fixedNow = new RealDate('2026-06-07T12:00:00.000Z');

globalThis.Date = class extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      super(fixedNow.toISOString());
      return;
    }

    super(...args);
  }

  static now() {
    return fixedNow.getTime();
  }

  static parse(value) {
    return RealDate.parse(value);
  }

  static UTC(...args) {
    return RealDate.UTC(...args);
  }
};

test.after(() => {
  globalThis.Date = RealDate;
});

const createResponse = (resolve) => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      resolve({ statusCode: this.statusCode, body: payload });
      return this;
    },
  };

  return response;
};

const invokeHandler = (handler, req) => {
  return new Promise((resolve, reject) => {
    const res = createResponse(resolve);
    const next = (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ statusCode: res.statusCode, body: res.body });
    };

    handler(req, res, next);
  });
};

const buildAppointment = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  doctor: '507f191e810c19729de860ea',
  start: new Date('2026-06-08T13:00:00.000Z'),
  end: new Date('2026-06-08T13:30:00.000Z'),
  status: 'scheduled',
  statusConfirmacao: 'pendente',
  attendanceStatus: 'waiting',
  confirmacaoObservacao: '',
  confirmToken: '',
  confirmTokenExpiresAt: new Date('2026-06-09T13:00:00.000Z'),
  confirmTokenUsedAt: null,
  rescheduleRequest: null,
  saveCalls: 0,
  async save() {
    this.saveCalls += 1;
    return this;
  },
  ...overrides,
});

test('isSlotAvailableForPublicReschedule blocks occupied and pre_reserved slots', () => {
  assert.equal(typeof isSlotAvailableForPublicReschedule, 'function');

  const appointments = [
    {
      start: '2026-06-08T14:00:00.000Z',
      end: '2026-06-08T14:30:00.000Z',
      attendanceStatus: 'waiting',
      status: 'scheduled',
    },
    {
      start: '2026-06-08T18:00:00.000Z',
      end: '2026-06-08T18:30:00.000Z',
      attendanceStatus: 'waiting',
      status: 'scheduled',
      rescheduleRequest: {
        requestedStart: '2026-06-08T15:00:00.000Z',
        requestedEnd: '2026-06-08T15:30:00.000Z',
        requestStatus: 'pending_review',
      },
    },
  ];

  assert.equal(
    isSlotAvailableForPublicReschedule(
      appointments,
      new Date('2026-06-08T14:00:00.000Z'),
      new Date('2026-06-08T14:30:00.000Z')
    ),
    false
  );
  assert.equal(
    isSlotAvailableForPublicReschedule(
      appointments,
      new Date('2026-06-08T15:00:00.000Z'),
      new Date('2026-06-08T15:30:00.000Z')
    ),
    false
  );
  assert.equal(
    isSlotAvailableForPublicReschedule(
      appointments,
      new Date('2026-06-08T16:00:00.000Z'),
      new Date('2026-06-08T16:30:00.000Z')
    ),
    true
  );
});

test('getPublicBookingAvailability returns slots for the first active doctor', async () => {
  const originalUserFindOne = User.findOne;
  const originalUserFind = User.find;
  const originalAppointmentFind = Appointment.find;
  const originalLockFind = AppointmentSlotLock.find;

  User.find = () => ({
    sort() {
      return this;
    },
    select: async () => ([{
      _id: '507f191e810c19729de860ea',
      name: 'Dra. Ana',
    }]),
  });
  User.findOne = () => ({
    sort() {
      return this;
    },
    select: async () => ({
      _id: '507f191e810c19729de860ea',
      name: 'Dra. Ana',
    }),
  });
  Appointment.find = async () => [];
  AppointmentSlotLock.find = async () => [];

  try {
    const result = await invokeHandler(getPublicBookingAvailability, {
      query: {},
    });

    assert.equal(result.statusCode, 200);
    assert.equal(result.body.data.doctor.name, 'Dra. Ana');
    assert.equal(result.body.data.doctors.length, 1);
    assert.ok(Array.isArray(result.body.data.slots));
    assert.ok(result.body.data.slots.length > 0);
  } finally {
    User.findOne = originalUserFindOne;
    User.find = originalUserFind;
    Appointment.find = originalAppointmentFind;
    AppointmentSlotLock.find = originalLockFind;
  }
});

test('createPublicBooking creates patient and appointment for an available slot', async () => {
  const originalUserFindOne = User.findOne;
  const originalPatientFindOne = Patient.findOne;
  const originalPatientCreate = Patient.create;
  const originalAppointmentFind = Appointment.find;
  const originalAppointmentSave = Appointment.prototype.save;
  const originalLockCreate = AppointmentSlotLock.create;
  const originalLockDeleteOne = AppointmentSlotLock.deleteOne;

  let savedAppointment = null;
  let releasedLocks = 0;

  User.findOne = () => ({
    sort() {
      return this;
    },
    select: async () => ({
      _id: '507f191e810c19729de860ea',
      name: 'Dra. Ana',
    }),
  });
  Patient.findOne = async () => null;
  Patient.create = async (payload) => ({
    _id: '507f1f77bcf86cd799439041',
    ...payload,
    async save() {
      return this;
    },
  });
  Appointment.find = async () => [];
  Appointment.prototype.save = async function save() {
    savedAppointment = this;
    return this;
  };
  AppointmentSlotLock.create = async () => ({ _id: 'lock-public-booking' });
  AppointmentSlotLock.deleteOne = async () => {
    releasedLocks += 1;
    return { acknowledged: true, deletedCount: 1 };
  };

  try {
    const result = await invokeHandler(createPublicBooking, {
      body: {
        patientName: 'Maria Souza',
        cpf: '123.456.789-00',
        phone: '(11) 99999-0000',
        email: 'maria@teste.com',
        doctorId: '507f191e810c19729de860ea',
        requestedStart: '2026-06-08T16:00:00.000Z',
        requestedEnd: '2026-06-08T16:30:00.000Z',
        type: 'eval',
        procedure: 'Avaliação inicial',
        note: 'Primeira consulta',
      },
    });

    assert.equal(result.statusCode, 201);
    assert.equal(result.body.data.patient.name, 'Maria Souza');
    assert.equal(result.body.data.doctor.name, 'Dra. Ana');
    assert.equal(savedAppointment.statusConfirmacao, 'confirmado');
    assert.equal(savedAppointment.attendanceStatus, 'waiting');
    assert.equal(savedAppointment.procedure, 'Avaliação inicial');
    assert.equal(releasedLocks, 1);
  } finally {
    User.findOne = originalUserFindOne;
    Patient.findOne = originalPatientFindOne;
    Patient.create = originalPatientCreate;
    Appointment.find = originalAppointmentFind;
    Appointment.prototype.save = originalAppointmentSave;
    AppointmentSlotLock.create = originalLockCreate;
    AppointmentSlotLock.deleteOne = originalLockDeleteOne;
  }
});

test('submitAppointmentConfirmation stores remarcacao as pre_reserved when slot is available', async () => {
  globalThis.process.env.JWT_SECRET = 'test-secret';

  const token = signAppointmentConfirmationToken({
    appointmentId: '507f1f77bcf86cd799439011',
  });
  const appointment = buildAppointment({
    confirmToken: token,
    confirmTokenExpiresAt: new Date(Date.now() + 60_000),
  });
  const originalFindById = Appointment.findById;
  const originalFind = Appointment.find;
  const originalLockCreate = AppointmentSlotLock.create;
  const originalLockDeleteOne = AppointmentSlotLock.deleteOne;

  Appointment.findById = async () => appointment;
  Appointment.find = async () => [];
  AppointmentSlotLock.create = async () => ({ _id: 'lock-1' });
  AppointmentSlotLock.deleteOne = async () => ({ acknowledged: true, deletedCount: 1 });

  try {
    const result = await invokeHandler(submitAppointmentConfirmation, {
      params: { token },
      body: {
        action: 'remarcar',
        note: 'Prefiro esse novo horario.',
        requestedStart: '2026-06-08T16:00:00.000Z',
        requestedEnd: '2026-06-08T16:30:00.000Z',
      },
      ip: '127.0.0.1',
      get(header) {
        return header === 'user-agent' ? 'node-test' : '';
      },
    });

    assert.equal(result.statusCode, 200);
    assert.equal(appointment.statusConfirmacao, 'remarcar');
    assert.equal(appointment.attendanceStatus, 'pre_reserved');
    assert.equal(appointment.rescheduleRequest.requestStatus, 'pending_review');
    assert.equal(appointment.rescheduleRequest.requestSource, 'public_confirmation');
    assert.equal(
      new Date(appointment.rescheduleRequest.requestedStart).toISOString(),
      '2026-06-08T16:00:00.000Z'
    );
    assert.equal(appointment.saveCalls, 1);
  } finally {
    Appointment.findById = originalFindById;
    Appointment.find = originalFind;
    AppointmentSlotLock.create = originalLockCreate;
    AppointmentSlotLock.deleteOne = originalLockDeleteOne;
  }
});

test('submitAppointmentConfirmation rejects remarcacao when selected slot is no longer available', async () => {
  globalThis.process.env.JWT_SECRET = 'test-secret';

  const token = signAppointmentConfirmationToken({
    appointmentId: '507f1f77bcf86cd799439012',
  });
  const appointment = buildAppointment({
    _id: '507f1f77bcf86cd799439012',
    confirmToken: token,
    confirmTokenExpiresAt: new Date(Date.now() + 60_000),
  });
  const originalFindById = Appointment.findById;
  const originalFind = Appointment.find;

  Appointment.findById = async () => appointment;
  Appointment.find = async () => [{
    start: '2026-06-08T16:00:00.000Z',
    end: '2026-06-08T16:30:00.000Z',
    attendanceStatus: 'waiting',
    status: 'scheduled',
  }];

  try {
    const result = await invokeHandler(submitAppointmentConfirmation, {
      params: { token },
      body: {
        action: 'remarcar',
        note: 'Prefiro esse novo horario.',
        requestedStart: '2026-06-08T16:00:00.000Z',
        requestedEnd: '2026-06-08T16:30:00.000Z',
      },
      ip: '127.0.0.1',
      get(header) {
        return header === 'user-agent' ? 'node-test' : '';
      },
    });

    assert.equal(result.statusCode, 409);
    assert.match(result.body.message, /dispon/i);
    assert.equal(appointment.attendanceStatus, 'waiting');
    assert.equal(appointment.saveCalls, 0);
  } finally {
    Appointment.findById = originalFindById;
    Appointment.find = originalFind;
  }
});

test('submitAppointmentConfirmation rejects remarcacao outside the public clinic window', async () => {
  globalThis.process.env.JWT_SECRET = 'test-secret';

  const token = signAppointmentConfirmationToken({
    appointmentId: '507f1f77bcf86cd799439013',
  });
  const appointment = buildAppointment({
    _id: '507f1f77bcf86cd799439013',
    confirmToken: token,
    confirmTokenExpiresAt: new Date(Date.now() + 60_000),
  });
  const originalFindById = Appointment.findById;

  Appointment.findById = async () => appointment;

  try {
    const result = await invokeHandler(submitAppointmentConfirmation, {
      params: { token },
      body: {
        action: 'remarcar',
        note: 'Prefiro esse novo horario.',
        requestedStart: '2026-06-08T21:00:00.000Z',
        requestedEnd: '2026-06-08T21:30:00.000Z',
      },
      ip: '127.0.0.1',
      get(header) {
        return header === 'user-agent' ? 'node-test' : '';
      },
    });

    assert.equal(result.statusCode, 400);
    assert.match(result.body.message, /janela p[úu]blica/i);
  } finally {
    Appointment.findById = originalFindById;
  }
});

test('submitAppointmentConfirmation rejects remarcacao when slot lock is already claimed', async () => {
  globalThis.process.env.JWT_SECRET = 'test-secret';

  const token = signAppointmentConfirmationToken({
    appointmentId: '507f1f77bcf86cd799439014',
  });
  const appointment = buildAppointment({
    _id: '507f1f77bcf86cd799439014',
    confirmToken: token,
    confirmTokenExpiresAt: new Date(Date.now() + 60_000),
  });
  const originalFindById = Appointment.findById;
  const originalFind = Appointment.find;
  const originalLockCreate = AppointmentSlotLock.create;
  const originalLockFindOne = AppointmentSlotLock.findOne;

  Appointment.findById = async () => appointment;
  Appointment.find = async () => [];
  AppointmentSlotLock.create = async () => {
    const error = new Error('duplicate key');
    error.code = 11000;
    throw error;
  };
  AppointmentSlotLock.findOne = async () => ({
    appointment: '507f1f77bcf86cd799439099',
  });

  try {
    const result = await invokeHandler(submitAppointmentConfirmation, {
      params: { token },
      body: {
        action: 'remarcar',
        note: 'Prefiro esse novo horario.',
        requestedStart: '2026-06-08T16:00:00.000Z',
        requestedEnd: '2026-06-08T16:30:00.000Z',
      },
      ip: '127.0.0.1',
      get(header) {
        return header === 'user-agent' ? 'node-test' : '';
      },
    });

    assert.equal(result.statusCode, 409);
    assert.match(result.body.message, /reservado por outra solicita[cç][aã]o/i);
  } finally {
    Appointment.findById = originalFindById;
    Appointment.find = originalFind;
    AppointmentSlotLock.create = originalLockCreate;
    AppointmentSlotLock.findOne = originalLockFindOne;
  }
});

test('getPublicRescheduleOptions rejects a token that was already consumed', async () => {
  globalThis.process.env.JWT_SECRET = 'test-secret';

  const token = signAppointmentConfirmationToken({
    appointmentId: '507f1f77bcf86cd799439099',
    action: 'confirmacao',
  });
  const appointment = buildAppointment({
    _id: '507f1f77bcf86cd799439099',
    confirmToken: token,
    confirmTokenUsedAt: new Date('2026-06-07T11:00:00.000Z'),
  });
  const originalFindById = Appointment.findById;

  Appointment.findById = async () => appointment;

  try {
    const result = await invokeHandler(getPublicRescheduleOptions, {
      params: { token },
    });

    assert.equal(result.statusCode, 409);
    assert.match(result.body.message, /j[áa] foi utilizado/i);
  } finally {
    Appointment.findById = originalFindById;
  }
});

test('updateAppointmentRescheduleRequest approves a pending pre_reserved slot', async () => {
  assert.equal(typeof updateAppointmentRescheduleRequest, 'function');

  const appointment = buildAppointment({
    statusConfirmacao: 'remarcar',
    attendanceStatus: 'pre_reserved',
    rescheduleRequest: {
      requestedAt: new Date('2026-06-06T12:00:00.000Z'),
      requestedStart: new Date('2026-06-08T16:00:00.000Z'),
      requestedEnd: new Date('2026-06-08T16:30:00.000Z'),
      requestSource: 'public_confirmation',
      requestStatus: 'pending_review',
    },
  });
  const originalFindById = Appointment.findById;
  const originalFind = Appointment.find;
  const originalLockDeleteOne = AppointmentSlotLock.deleteOne;

  Appointment.findById = async () => appointment;
  Appointment.find = async () => [];
  AppointmentSlotLock.deleteOne = async () => ({ acknowledged: true, deletedCount: 1 });

  try {
    const result = await invokeHandler(updateAppointmentRescheduleRequest, {
      params: { id: appointment._id },
      body: {
        rescheduleDecision: 'approved',
        note: 'Horário validado pela recepção.',
      },
      user: {
        userId: '507f1f77bcf86cd799439099',
        role: 'receptionist',
      },
    });

    assert.equal(result.statusCode, 200);
    assert.equal(appointment.statusConfirmacao, 'confirmado');
    assert.equal(appointment.attendanceStatus, 'waiting');
    assert.equal(appointment.rescheduleRequest.requestStatus, 'approved');
    assert.equal(new Date(appointment.start).toISOString(), '2026-06-08T16:00:00.000Z');
    assert.equal(new Date(appointment.end).toISOString(), '2026-06-08T16:30:00.000Z');
    assert.equal(String(appointment.rescheduleRequest.reviewedBy), '507f1f77bcf86cd799439099');
  } finally {
    Appointment.findById = originalFindById;
    Appointment.find = originalFind;
    AppointmentSlotLock.deleteOne = originalLockDeleteOne;
  }
});

test('updateAppointmentRescheduleRequest rejects changed slot when decision is approved', async () => {
  const appointment = buildAppointment({
    _id: '507f1f77bcf86cd799439017',
    statusConfirmacao: 'remarcar',
    attendanceStatus: 'pre_reserved',
    rescheduleRequest: {
      requestedAt: new Date('2026-06-06T12:00:00.000Z'),
      requestedStart: new Date('2026-06-08T16:00:00.000Z'),
      requestedEnd: new Date('2026-06-08T16:30:00.000Z'),
      requestSource: 'public_confirmation',
      requestStatus: 'pending_review',
    },
  });
  const originalFindById = Appointment.findById;

  Appointment.findById = async () => appointment;

  try {
    const result = await invokeHandler(updateAppointmentRescheduleRequest, {
      params: { id: appointment._id },
      body: {
        rescheduleDecision: 'approved',
        requestedStart: '2026-06-09T16:00:00.000Z',
        requestedEnd: '2026-06-09T16:30:00.000Z',
      },
      user: {
        userId: '507f1f77bcf86cd799439099',
        role: 'receptionist',
      },
    });

    assert.equal(result.statusCode, 400);
    assert.match(result.body.message, /use `?adjusted`?/i);
  } finally {
    Appointment.findById = originalFindById;
  }
});

test('updateAppointmentRescheduleRequest releases a pending pre_reserved slot and clears the hold', async () => {
  const appointment = buildAppointment({
    _id: '507f1f77bcf86cd799439015',
    statusConfirmacao: 'remarcar',
    attendanceStatus: 'pre_reserved',
    rescheduleRequest: {
      requestedAt: new Date('2026-06-06T12:00:00.000Z'),
      requestedStart: new Date('2026-06-08T16:00:00.000Z'),
      requestedEnd: new Date('2026-06-08T16:30:00.000Z'),
      requestSource: 'public_confirmation',
      requestStatus: 'pending_review',
    },
  });
  const originalFindById = Appointment.findById;
  const originalLockDeleteOne = AppointmentSlotLock.deleteOne;
  let deletedLockPayload = null;

  Appointment.findById = async () => appointment;
  AppointmentSlotLock.deleteOne = async (payload) => {
    deletedLockPayload = payload;
    return { acknowledged: true, deletedCount: 1 };
  };

  try {
    const result = await invokeHandler(updateAppointmentRescheduleRequest, {
      params: { id: appointment._id },
      body: {
        rescheduleDecision: 'released',
        note: 'A recepcao vai oferecer outra opcao depois.',
      },
      user: {
        userId: '507f1f77bcf86cd799439099',
        role: 'receptionist',
      },
    });

    assert.equal(result.statusCode, 200);
    assert.equal(appointment.attendanceStatus, 'waiting');
    assert.equal(appointment.rescheduleRequest.requestStatus, 'released');
    assert.equal(String(deletedLockPayload.appointment), appointment._id);
  } finally {
    Appointment.findById = originalFindById;
    AppointmentSlotLock.deleteOne = originalLockDeleteOne;
  }
});

test('updateAppointmentRescheduleRequest keeps the slot lock when release save fails', async () => {
  const appointment = buildAppointment({
    _id: '507f1f77bcf86cd799439018',
    statusConfirmacao: 'remarcar',
    attendanceStatus: 'pre_reserved',
    rescheduleRequest: {
      requestedAt: new Date('2026-06-06T12:00:00.000Z'),
      requestedStart: new Date('2026-06-08T16:00:00.000Z'),
      requestedEnd: new Date('2026-06-08T16:30:00.000Z'),
      requestSource: 'public_confirmation',
      requestStatus: 'pending_review',
    },
    async save() {
      throw new Error('save failed');
    },
  });
  const originalFindById = Appointment.findById;
  const originalLockDeleteOne = AppointmentSlotLock.deleteOne;
  let deleteCalls = 0;

  Appointment.findById = async () => appointment;
  AppointmentSlotLock.deleteOne = async () => {
    deleteCalls += 1;
    return { acknowledged: true, deletedCount: 1 };
  };

  try {
    await assert.rejects(
      invokeHandler(updateAppointmentRescheduleRequest, {
        params: { id: appointment._id },
        body: {
          rescheduleDecision: 'released',
          note: 'Falha proposital para validar o lock.',
        },
        user: {
          userId: '507f1f77bcf86cd799439099',
          role: 'receptionist',
        },
      }),
      /save failed/
    );

    assert.equal(deleteCalls, 0);
  } finally {
    Appointment.findById = originalFindById;
    AppointmentSlotLock.deleteOne = originalLockDeleteOne;
  }
});

test('updateAppointmentRescheduleRequest adjusts to a new slot and rotates the lock', async () => {
  const appointment = buildAppointment({
    _id: '507f1f77bcf86cd799439016',
    statusConfirmacao: 'remarcar',
    attendanceStatus: 'pre_reserved',
    rescheduleRequest: {
      requestedAt: new Date('2026-06-06T12:00:00.000Z'),
      requestedStart: new Date('2026-06-08T16:00:00.000Z'),
      requestedEnd: new Date('2026-06-08T16:30:00.000Z'),
      requestSource: 'public_confirmation',
      requestStatus: 'pending_review',
    },
  });
  const originalFindById = Appointment.findById;
  const originalFind = Appointment.find;
  const originalLockCreate = AppointmentSlotLock.create;
  const originalLockFindOne = AppointmentSlotLock.findOne;
  const originalLockDeleteOne = AppointmentSlotLock.deleteOne;
  const lockDeletes = [];

  Appointment.findById = async () => appointment;
  Appointment.find = async () => [];
  AppointmentSlotLock.create = async () => ({ _id: 'lock-adjusted' });
  AppointmentSlotLock.findOne = async () => null;
  AppointmentSlotLock.deleteOne = async (payload) => {
    lockDeletes.push(payload);
    return { acknowledged: true, deletedCount: 1 };
  };

  try {
    const result = await invokeHandler(updateAppointmentRescheduleRequest, {
      params: { id: appointment._id },
      body: {
        rescheduleDecision: 'adjusted',
        note: 'Ajustado pela recepcao.',
        requestedStart: '2026-06-09T16:00:00.000Z',
        requestedEnd: '2026-06-09T16:30:00.000Z',
      },
      user: {
        userId: '507f1f77bcf86cd799439099',
        role: 'receptionist',
      },
    });

    assert.equal(result.statusCode, 200);
    assert.equal(appointment.statusConfirmacao, 'confirmado');
    assert.equal(appointment.rescheduleRequest.requestStatus, 'adjusted');
    assert.equal(new Date(appointment.start).toISOString(), '2026-06-09T16:00:00.000Z');
    assert.equal(lockDeletes.length, 2);
  } finally {
    Appointment.findById = originalFindById;
    Appointment.find = originalFind;
    AppointmentSlotLock.create = originalLockCreate;
    AppointmentSlotLock.findOne = originalLockFindOne;
    AppointmentSlotLock.deleteOne = originalLockDeleteOne;
  }
});

test('updateAppointmentRescheduleRequest rejects release when there is no active pre_reserve', async () => {
  assert.equal(typeof updateAppointmentRescheduleRequest, 'function');

  const appointment = buildAppointment({
    statusConfirmacao: 'remarcar',
    attendanceStatus: 'waiting',
    rescheduleRequest: {
      requestedAt: new Date('2026-06-06T12:00:00.000Z'),
      requestedStart: new Date('2026-06-08T16:00:00.000Z'),
      requestedEnd: new Date('2026-06-08T16:30:00.000Z'),
      requestSource: 'public_confirmation',
      requestStatus: 'released',
    },
  });
  const originalFindById = Appointment.findById;

  Appointment.findById = async () => appointment;

  try {
    const result = await invokeHandler(updateAppointmentRescheduleRequest, {
      params: { id: appointment._id },
      body: {
        rescheduleDecision: 'released',
      },
      user: {
        userId: '507f1f77bcf86cd799439099',
        role: 'receptionist',
      },
    });

    assert.equal(result.statusCode, 409);
    assert.match(result.body.message, /pr[eé]-reserva ativa/i);
  } finally {
    Appointment.findById = originalFindById;
  }
});
