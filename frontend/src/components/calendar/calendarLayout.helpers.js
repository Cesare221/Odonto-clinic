export function computeWeeklyAppointmentLayout({
  appointment,
  clinicStartHour,
  slotDurationMinutes,
  slotHeightPx = 40,
  verticalInsetPx = 2,
}) {
  const slotStepHours = Number(slotDurationMinutes) / 60;
  const start = Number(appointment?.start) || Number(clinicStartHour) || 0;
  const duration = Math.max(slotStepHours || 0.5, Number(appointment?.duration) || 0);
  const slotSpan = Math.max(1, Math.round(duration / slotStepHours));
  const startOffsetSlots = Math.max(0, Math.round((start - Number(clinicStartHour || 0)) / slotStepHours));
  const topOffsetPx = (startOffsetSlots * slotHeightPx) + verticalInsetPx;
  const heightPx = Math.max(slotHeightPx - (verticalInsetPx * 2), (slotSpan * slotHeightPx) - (verticalInsetPx * 2));

  return {
    topOffsetPx,
    heightPx,
    slotSpan,
  };
}
