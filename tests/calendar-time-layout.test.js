import test from 'node:test';
import assert from 'node:assert/strict';

import { computeWeeklyAppointmentLayout } from '../frontend/src/components/calendar/calendarLayout.helpers.js';

test('computeWeeklyAppointmentLayout ocupa meia hora, uma hora e uma hora e meia proporcionalmente', () => {
  const halfHour = computeWeeklyAppointmentLayout({
    appointment: { start: 9, duration: 0.5 },
    clinicStartHour: 8,
    slotDurationMinutes: 30,
    slotHeightPx: 40,
    verticalInsetPx: 2,
  });

  const oneHour = computeWeeklyAppointmentLayout({
    appointment: { start: 9, duration: 1 },
    clinicStartHour: 8,
    slotDurationMinutes: 30,
    slotHeightPx: 40,
    verticalInsetPx: 2,
  });

  const ninetyMinutes = computeWeeklyAppointmentLayout({
    appointment: { start: 9, duration: 1.5 },
    clinicStartHour: 8,
    slotDurationMinutes: 30,
    slotHeightPx: 40,
    verticalInsetPx: 2,
  });

  assert.deepEqual(halfHour, {
    topOffsetPx: 82,
    heightPx: 36,
    slotSpan: 1,
  });

  assert.deepEqual(oneHour, {
    topOffsetPx: 82,
    heightPx: 76,
    slotSpan: 2,
  });

  assert.deepEqual(ninetyMinutes, {
    topOffsetPx: 82,
    heightPx: 116,
    slotSpan: 3,
  });
});
