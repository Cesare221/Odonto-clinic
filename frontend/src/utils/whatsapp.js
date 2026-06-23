export const WHATSAPP_HOMOLOGATION_FALLBACK_PHONE = '62982623408';

export function normalizeWhatsAppPhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  return digits;
}

export function resolveWhatsAppDestination(patientPhone, fallbackPhone = WHATSAPP_HOMOLOGATION_FALLBACK_PHONE) {
  const preferredPhone = normalizeWhatsAppPhone(patientPhone);
  const usingFallbackPhone = !preferredPhone;
  const phone = preferredPhone || normalizeWhatsAppPhone(fallbackPhone);

  return {
    phone,
    usingFallbackPhone,
  };
}
