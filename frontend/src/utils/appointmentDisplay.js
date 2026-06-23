export const APPOINTMENT_TYPE_LABELS = {
  eval: 'Avaliação inicial',
  routine: 'Limpeza e profilaxia',
  surgery: 'Cirurgia oral',
  ortho: 'Ortodontia',
  aesthetic: 'Estética dental',
  emergency: 'Emergência odontológica',
};

export const looksCorruptedText = (value = '') => {
  const text = String(value || '').trim();
  if (!text) return false;
  return /�|Ã|Â/.test(text) || /\b\w*\?\w*\b/.test(text);
};

export const sanitizeDisplayText = (value, fallback = '') => {
  const text = String(value || '').trim();
  if (!text || looksCorruptedText(text)) {
    return fallback;
  }
  return text;
};

export const getAppointmentTypeLabel = (appointment = {}) => {
  const explicitTypeLabel = sanitizeDisplayText(appointment?.typeLabel, '');
  if (explicitTypeLabel) return explicitTypeLabel;

  const mappedTypeLabel = APPOINTMENT_TYPE_LABELS[appointment?.type];
  if (mappedTypeLabel) return mappedTypeLabel;

  return sanitizeDisplayText(appointment?.type, appointment?.title || 'Consulta');
};

export const getAppointmentProcedureLabel = (appointment = {}) => {
  const explicitProcedure = sanitizeDisplayText(appointment?.procedure, '');
  if (explicitProcedure) return explicitProcedure;

  const mappedTypeLabel = APPOINTMENT_TYPE_LABELS[appointment?.type];
  if (mappedTypeLabel) return mappedTypeLabel;

  const confirmationNote = sanitizeDisplayText(appointment?.confirmacaoObservacao, '');
  if (confirmationNote) return confirmationNote;

  return 'Sem observações complementares.';
};
