import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getOperationalStatusMeta,
  getOperationalNextAction,
  getOperationalToneClasses,
  getQueuePriority,
  isQueueActionable,
  isConfirmationWithinPeriod,
  isOperationalConfirmationOpen,
} from '../frontend/src/utils/operationalStatus.js';

test('getOperationalStatusMeta traduz estados de atendimento e confirmacao', () => {
  const waitingMeta = getOperationalStatusMeta({ status: 'waiting' });
  const confirmationMeta = getOperationalStatusMeta({ statusConfirmacao: 'remarcar' });

  assert.equal(waitingMeta.label, 'Aguardando');
  assert.equal(waitingMeta.category, 'queue');
  assert.equal(confirmationMeta.label, 'Remarcar');
  assert.equal(confirmationMeta.category, 'confirmation');
});

test('getOperationalStatusMeta suporta os estados canonicos agendado e chegou', () => {
  const scheduledMeta = getOperationalStatusMeta({ status: 'agendado' });
  const arrivedMeta = getOperationalStatusMeta({ status: 'chegou' });

  assert.equal(scheduledMeta.key, 'agendado');
  assert.equal(scheduledMeta.label, 'Agendado');
  assert.equal(scheduledMeta.category, 'confirmation');
  assert.equal(arrivedMeta.key, 'chegou');
  assert.equal(arrivedMeta.label, 'Chegou');
  assert.equal(arrivedMeta.category, 'queue');
});

test('getQueuePriority prioriza atendimentos em progresso e pendencias criticas', () => {
  assert.equal(getQueuePriority({ status: 'in-progress' }), 0);
  assert.equal(getQueuePriority({ statusConfirmacao: 'remarcar' }), 1);
  assert.equal(getQueuePriority({ statusConfirmacao: 'recusado' }), 2);
  assert.equal(getQueuePriority({ statusConfirmacao: 'pendente' }), 3);
  assert.equal(getQueuePriority({ status: 'waiting' }), 4);
  assert.equal(getQueuePriority({ status: 'done' }), 5);
});

test('getOperationalNextAction indica o proximo passo operacional mais util', () => {
  assert.equal(
    getOperationalNextAction({ status: 'in-progress' }),
    'Retome o atendimento e finalize a consulta com segurança.'
  );
  assert.equal(
    getOperationalNextAction({ statusConfirmacao: 'remarcar', confirmationHandledAt: null }),
    'Entre em contato para oferecer novo horário e registrar a decisão.'
  );
  assert.equal(
    getOperationalNextAction({ status: 'waiting' }),
    'Chame o paciente e inicie o atendimento quando a sala estiver pronta.'
  );
  assert.equal(
    getOperationalNextAction({ statusConfirmacao: 'confirmado', attendanceStatus: 'waiting' }),
    'Paciente confirmado: prepare a sala e chame no horário combinado.'
  );
  assert.equal(
    getOperationalNextAction({ statusConfirmacao: 'pendente', appointmentDate: '2026-05-30' }),
    'Confirme a presença deste paciente antes do horário agendado.'
  );
  assert.equal(
    getOperationalNextAction({ status: 'done', statusConfirmacao: 'confirmado' }),
    'Consulta concluída: registre o desfecho e alinhe o próximo acompanhamento.'
  );
});

test('getOperationalNextAction cobre os estados canonicos agendado e chegou', () => {
  assert.equal(
    getOperationalNextAction({ status: 'agendado' }),
    'Consulta agendada: confirme a presença e deixe a recepção preparada para a chegada.'
  );
  assert.equal(
    getOperationalNextAction({ status: 'chegou' }),
    'Paciente chegou: acolha na recepção e direcione para a sala de espera.'
  );
});

test('getOperationalToneClasses retorna classes reutilizaveis para status operacionais', () => {
  const tone = getOperationalToneClasses('confirmado');

  assert.match(tone.badge, /emerald/i);
  assert.match(tone.panel, /emerald/i);
  assert.match(tone.accent, /emerald/i);
});

test('isOperationalConfirmationOpen ignora solicitacoes ja tratadas nos alertas operacionais', () => {
  assert.equal(isOperationalConfirmationOpen({ statusConfirmacao: 'remarcar', confirmationHandledAt: null }), true);
  assert.equal(isOperationalConfirmationOpen({ statusConfirmacao: 'pendente', confirmationHandledAt: null }), true);
  assert.equal(isOperationalConfirmationOpen({ statusConfirmacao: 'recusado', confirmationHandledAt: null }), true);
  assert.equal(isOperationalConfirmationOpen({ statusConfirmacao: 'remarcar', confirmationHandledAt: '2026-05-30T09:00:00.000Z' }), false);
  assert.equal(isOperationalConfirmationOpen({ statusConfirmacao: 'recusado', confirmationHandledAt: '2026-05-30T09:00:00.000Z' }), false);
  assert.equal(isOperationalConfirmationOpen({ statusConfirmacao: 'confirmado', confirmationHandledAt: null }), false);
});

test('isConfirmationWithinPeriod respeita janelas fechadas para hoje', () => {
  const now = new Date('2026-05-30T15:00:00.000Z');

  assert.equal(isConfirmationWithinPeriod({
    confirmationUpdatedAt: '2026-05-30T10:00:00.000Z',
  }, 'today', now), true);
  assert.equal(isConfirmationWithinPeriod({
    confirmationUpdatedAt: '2026-05-31T10:00:00.000Z',
  }, 'today', now), false);
  assert.equal(isConfirmationWithinPeriod({
    confirmationUpdatedAt: '2026-05-29T23:00:00.000Z',
  }, 'today', now), false);
});

test('isConfirmationWithinPeriod respeita janelas fechadas para semana e mes', () => {
  const now = new Date('2026-05-30T15:00:00.000Z');

  assert.equal(isConfirmationWithinPeriod({
    confirmationUpdatedAt: '2026-05-24T12:00:00.000Z',
  }, 'week', now), false);
  assert.equal(isConfirmationWithinPeriod({
    confirmationUpdatedAt: '2026-05-25T12:00:00.000Z',
  }, 'week', now), true);
  assert.equal(isConfirmationWithinPeriod({
    confirmationUpdatedAt: '2026-05-31T12:00:00.000Z',
  }, 'week', now), true);
  assert.equal(isConfirmationWithinPeriod({
    confirmationUpdatedAt: '2026-06-01T12:00:00.000Z',
  }, 'week', now), false);
  assert.equal(isConfirmationWithinPeriod({
    confirmationUpdatedAt: '2026-05-05T12:00:00.000Z',
  }, 'month', now), true);
  assert.equal(isConfirmationWithinPeriod({
    confirmationUpdatedAt: '2026-06-01T12:00:00.000Z',
  }, 'month', now), false);
});

test('getOperationalStatusMeta prioriza o atendimento quando a consulta ja esta em curso ou concluida', () => {
  const inProgressMeta = getOperationalStatusMeta({
    status: 'in-progress',
    statusConfirmacao: 'confirmado',
  });
  const doneMeta = getOperationalStatusMeta({
    status: 'done',
    statusConfirmacao: 'pendente',
  });

  assert.equal(inProgressMeta.key, 'in-progress');
  assert.equal(doneMeta.key, 'done');
});

test('getOperationalStatusMeta respeita attendanceStatus mesmo com status legado ou decoracao anterior', () => {
  const inProgressMeta = getOperationalStatusMeta({
    attendanceStatus: 'in-progress',
    status: 'waiting',
    statusConfirmacao: 'confirmado',
    operationalStatusKey: 'confirmado',
  });
  const doneMeta = getOperationalStatusMeta({
    attendanceStatus: 'done',
    status: 'waiting',
    statusConfirmacao: 'pendente',
    operationalStatusKey: 'waiting',
  });

  assert.equal(inProgressMeta.key, 'in-progress');
  assert.equal(doneMeta.key, 'done');
});

test('getOperationalStatusMeta reconhece arrived e scheduled via attendanceStatus', () => {
  const arrivedMeta = getOperationalStatusMeta({
    attendanceStatus: 'arrived',
    statusConfirmacao: 'confirmado',
  });
  const scheduledMeta = getOperationalStatusMeta({
    attendanceStatus: 'scheduled',
    statusConfirmacao: 'pendente',
  });

  assert.equal(arrivedMeta.key, 'chegou');
  assert.equal(scheduledMeta.key, 'agendado');
});

test('getOperationalNextAction acompanha a rederivacao do atendimento mais atual', () => {
  assert.equal(
    getOperationalNextAction({
      attendanceStatus: 'done',
      status: 'waiting',
      statusConfirmacao: 'confirmado',
      operationalStatusKey: 'confirmado',
    }),
    'Consulta concluída: registre o desfecho e alinhe o próximo acompanhamento.'
  );
});

test('isQueueActionable remove cancelamentos e remarcacoes da fila de atendimento', () => {
  assert.equal(isQueueActionable({ attendanceStatus: 'waiting', statusConfirmacao: 'confirmado' }), true);
  assert.equal(isQueueActionable({ attendanceStatus: 'in-progress', statusConfirmacao: 'remarcar' }), true);
  assert.equal(isQueueActionable({ attendanceStatus: 'waiting', statusConfirmacao: 'remarcar' }), false);
  assert.equal(isQueueActionable({ attendanceStatus: 'waiting', statusConfirmacao: 'recusado' }), false);
  assert.equal(isQueueActionable({ attendanceStatus: 'done', statusConfirmacao: 'confirmado' }), false);
});
