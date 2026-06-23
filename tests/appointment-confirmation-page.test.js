import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addMonths,
  buildPublicBookingPayload,
  buildRescheduleCalendarDays,
  buildRescheduleMonthCalendarDays,
  buildPublicConfirmationPayload,
  formatRescheduleMonthLabel,
  getMonthStart,
  groupRescheduleOptionsByDay,
} from '../frontend/src/pages/appointmentConfirmationPage.helpers.js';

test('groupRescheduleOptionsByDay organiza os slots por dia com labels legiveis', () => {
  const grouped = groupRescheduleOptionsByDay(
    [
      {
        start: '2026-06-08T13:00:00.000Z',
        end: '2026-06-08T13:30:00.000Z',
      },
      {
        start: '2026-06-08T14:00:00.000Z',
        end: '2026-06-08T14:30:00.000Z',
      },
      {
        start: '2026-06-09T15:00:00.000Z',
        end: '2026-06-09T15:30:00.000Z',
      },
    ],
    { timeZone: 'UTC' }
  );

  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].dateKey, '2026-06-08');
  assert.match(grouped[0].label, /08\/06\/2026/);
  assert.equal(grouped[0].slots.length, 2);
  assert.equal(grouped[0].slots[0].id, '2026-06-08T13:00:00.000Z__2026-06-08T13:30:00.000Z');
  assert.equal(grouped[0].slots[0].timeLabel, '13:00 - 13:30');
  assert.equal(grouped[1].dateKey, '2026-06-09');
  assert.equal(grouped[1].slots[0].timeLabel, '15:00 - 15:30');
});

test('buildRescheduleCalendarDays monta os proximos 30 dias e marca os dias com vaga', () => {
  const grouped = groupRescheduleOptionsByDay(
    [
      {
        start: '2026-06-08T13:00:00.000Z',
        end: '2026-06-08T13:30:00.000Z',
      },
      {
        start: '2026-06-09T15:00:00.000Z',
        end: '2026-06-09T15:30:00.000Z',
      },
    ],
    { timeZone: 'UTC' }
  );

  const calendarDays = buildRescheduleCalendarDays(grouped, {
    timeZone: 'UTC',
    startDate: new Date('2026-06-08T12:00:00.000Z'),
    daysToShow: 5,
  });

  assert.equal(calendarDays.length, 5);
  assert.equal(calendarDays[0].dateKey, '2026-06-08');
  assert.equal(calendarDays[0].isAvailable, true);
  assert.equal(calendarDays[0].slotCount, 1);
  assert.equal(calendarDays[1].dateKey, '2026-06-09');
  assert.equal(calendarDays[1].isAvailable, true);
  assert.equal(calendarDays[2].dateKey, '2026-06-10');
  assert.equal(calendarDays[2].isAvailable, false);
});

test('helpers mensais montam o mes inteiro e permitem avancar meses', () => {
  const grouped = groupRescheduleOptionsByDay(
    [
      {
        start: '2026-07-02T13:00:00.000Z',
        end: '2026-07-02T13:30:00.000Z',
      },
      {
        start: '2026-07-31T15:00:00.000Z',
        end: '2026-07-31T15:30:00.000Z',
      },
    ],
    { timeZone: 'UTC' }
  );

  const juneStart = getMonthStart(new Date('2026-06-29T12:00:00.000Z'));
  const julyStart = addMonths(juneStart, 1);
  const calendarDays = buildRescheduleMonthCalendarDays(grouped, {
    timeZone: 'UTC',
    monthDate: julyStart,
  });

  assert.equal(juneStart.getFullYear(), 2026);
  assert.equal(juneStart.getMonth(), 5);
  assert.equal(juneStart.getDate(), 1);
  assert.equal(julyStart.getFullYear(), 2026);
  assert.equal(julyStart.getMonth(), 6);
  assert.equal(julyStart.getDate(), 1);
  assert.equal(formatRescheduleMonthLabel(julyStart, { timeZone: 'UTC' }), 'julho de 2026');
  assert.equal(calendarDays.length, 31);
  assert.equal(calendarDays[0].dateKey, '2026-07-01');
  assert.equal(calendarDays[1].dateKey, '2026-07-02');
  assert.equal(calendarDays[1].isAvailable, true);
  assert.equal(calendarDays[30].dateKey, '2026-07-31');
  assert.equal(calendarDays[30].isAvailable, true);
});

test('buildPublicConfirmationPayload envia intervalo selecionado ao remarcar', () => {
  const payload = buildPublicConfirmationPayload({
    action: 'remarcar',
    note: '  Se possivel, manter esse horario. ',
    selectedSlot: {
      start: '2026-06-09T15:00:00.000Z',
      end: '2026-06-09T15:30:00.000Z',
    },
  });

  assert.deepEqual(payload, {
    action: 'remarcar',
    note: 'Se possivel, manter esse horario.',
    requestedStart: '2026-06-09T15:00:00.000Z',
    requestedEnd: '2026-06-09T15:30:00.000Z',
  });
});

test('buildPublicConfirmationPayload preserva confirmar e recusar sem intervalo', () => {
  assert.deepEqual(
    buildPublicConfirmationPayload({
      action: 'confirmado',
      note: '  Estarei presente. ',
      selectedSlot: {
        start: '2026-06-09T15:00:00.000Z',
        end: '2026-06-09T15:30:00.000Z',
      },
    }),
    {
      action: 'confirmado',
      note: 'Estarei presente.',
    }
  );

  assert.deepEqual(
    buildPublicConfirmationPayload({
      action: 'recusado',
      note: '',
      selectedSlot: null,
    }),
    {
      action: 'recusado',
      note: '',
    }
  );
});

test('buildPublicBookingPayload normaliza os dados do novo agendamento', () => {
  assert.deepEqual(
    buildPublicBookingPayload({
      form: {
        patientName: '  Maria Clara Souza  ',
        cpf: '123.456.789-00',
        phone: ' (11) 99999-0000 ',
        email: '  maria@teste.com ',
        doctorId: '507f191e810c19729de860ea',
        type: 'eval',
        procedure: '  Avaliação inicial ',
        note: '  Primeira consulta. ',
      },
      selectedSlot: {
        start: '2026-06-09T15:00:00.000Z',
        end: '2026-06-09T15:30:00.000Z',
      },
    }),
    {
      patientName: 'Maria Clara Souza',
      cpf: '123.456.789-00',
      phone: '(11) 99999-0000',
      email: 'maria@teste.com',
      doctorId: '507f191e810c19729de860ea',
      type: 'eval',
      procedure: 'Avaliação inicial',
      note: 'Primeira consulta.',
      requestedStart: '2026-06-09T15:00:00.000Z',
      requestedEnd: '2026-06-09T15:30:00.000Z',
    }
  );
});
