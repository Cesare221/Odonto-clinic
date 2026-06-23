import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeWhatsAppPhone,
  resolveWhatsAppDestination,
  WHATSAPP_HOMOLOGATION_FALLBACK_PHONE,
} from '../frontend/src/utils/whatsapp.js';

test('normalizeWhatsAppPhone adiciona 55 para numero local', () => {
  assert.equal(normalizeWhatsAppPhone('(62) 99826-2340'), '5562998262340');
});

test('normalizeWhatsAppPhone preserva numero ja com 55', () => {
  assert.equal(normalizeWhatsAppPhone('55629982623408'), '55629982623408');
});

test('resolveWhatsAppDestination usa fallback quando paciente nao tem telefone', () => {
  const result = resolveWhatsAppDestination('');
  assert.equal(result.usingFallbackPhone, true);
  assert.equal(result.phone, `55${WHATSAPP_HOMOLOGATION_FALLBACK_PHONE}`);
});

test('resolveWhatsAppDestination prioriza telefone do paciente', () => {
  const result = resolveWhatsAppDestination('62998262340');
  assert.equal(result.usingFallbackPhone, false);
  assert.equal(result.phone, '5562998262340');
});
