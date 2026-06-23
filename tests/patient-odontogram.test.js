import test from 'node:test';
import assert from 'node:assert/strict';

import { applyToothUpdates, ensurePatientOdontogram } from '../backend/utils/patientOdontogram.js';

test('ensurePatientOdontogram inicializa o mapa quando ele nao existe', () => {
  const patient = {};

  assert.equal(patient.odontogram, undefined);

  const odontogram = ensurePatientOdontogram(patient);

  assert.equal(typeof odontogram.set, 'function');
  assert.equal(patient.odontogram, odontogram);
});

test('applyToothUpdates grava dentes mesmo para pacientes legados sem odontograma', () => {
  const patient = {};

  applyToothUpdates(patient, [
    { tooth: 11, status: 'carie', note: 'Teste' },
  ]);

  assert.equal(patient.odontogram.get('11').status, 'carie');
  assert.equal(patient.odontogram.get('11').note, 'Teste');
  assert.ok(patient.odontogram.get('11').dateUpdated instanceof Date);
});

test('ensurePatientOdontogram devolve um mapa utilizavel mesmo quando a atribuicao do documento nao expõe set', () => {
  const fallbackMap = new Map();
  const patient = {};

  Object.defineProperty(patient, 'odontogram', {
    configurable: true,
    enumerable: true,
    get() {
      return undefined;
    },
    set() {
      // Intentionally ignore assignments to emulate a legacy/hostile descriptor.
    },
  });

  const ensured = ensurePatientOdontogram(patient);

  assert.equal(typeof ensured.set, 'function');
  ensured.set('11', { status: 'carie', note: '', dateUpdated: new Date() });
  assert.equal(fallbackMap.size, 0);
});
