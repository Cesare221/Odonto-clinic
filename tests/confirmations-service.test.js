import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createConfirmationsService,
  fetchPublicRescheduleOptions,
  submitPublicConfirmation,
} from '../frontend/src/services/confirmationsService.shared.js';

test('fetchPublicRescheduleOptions consulta os horarios publicos pelo token', async () => {
  const calls = [];
  const service = createConfirmationsService({
    async get(...args) {
      calls.push(args);
      return {
        data: {
          status: 'success',
          data: [
            {
              start: '2026-06-09T15:00:00.000Z',
              end: '2026-06-09T15:30:00.000Z',
            },
          ],
        },
      };
    },
  });

  const result = await service.fetchPublicRescheduleOptions('token-publico');

  assert.deepEqual(calls[0], ['/appointments/public-reschedule-options/token-publico']);
  assert.deepEqual(result, [
    {
      start: '2026-06-09T15:00:00.000Z',
      end: '2026-06-09T15:30:00.000Z',
    },
  ]);
});

test('submitPublicConfirmation envia o payload final de confirmacao e remarcacao', async () => {
  const calls = [];
  const service = createConfirmationsService({
    async post(...args) {
      calls.push(args);
      return {
        data: {
          status: 'success',
          data: {
            statusConfirmacao: 'remarcar',
          },
        },
      };
    },
  });

  const payload = {
    action: 'remarcar',
    note: 'Preciso ajustar.',
    requestedStart: '2026-06-09T15:00:00.000Z',
    requestedEnd: '2026-06-09T15:30:00.000Z',
  };

  const result = await service.submitPublicConfirmation('token-publico', payload);

  assert.deepEqual(calls[0], ['/appointments/confirm/token-publico', payload]);
  assert.deepEqual(result, {
    status: 'success',
    data: {
      statusConfirmacao: 'remarcar',
    },
  });
});

test('exports prontos reutilizam a mesma factory do service', async () => {
  const fakeApiCalls = [];
  const service = createConfirmationsService({
    async get(...args) {
      fakeApiCalls.push(['get', ...args]);
      return { data: { data: [] } };
    },
    async post(...args) {
      fakeApiCalls.push(['post', ...args]);
      return {
        data: {
          status: 'success',
          data: {
            statusConfirmacao: 'confirmado',
          },
        },
      };
    },
  });

  await fetchPublicRescheduleOptions('abc', service);
  await submitPublicConfirmation('abc', { action: 'confirmado' }, service);

  assert.deepEqual(fakeApiCalls, [
    ['get', '/appointments/public-reschedule-options/abc'],
    ['post', '/appointments/confirm/abc', { action: 'confirmado' }],
  ]);
});
