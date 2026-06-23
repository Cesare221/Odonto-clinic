export const ensurePatientOdontogram = (patient) => {
  if (!patient) {
    return new Map();
  }

  if (patient.odontogram && typeof patient.odontogram.set === 'function') {
    return patient.odontogram;
  }

  const seededEntries = patient.odontogram && typeof patient.odontogram === 'object'
    ? Object.entries(patient.odontogram)
    : [];

  const fallbackMap = new Map(seededEntries);
  patient.odontogram = fallbackMap;

  if (patient.odontogram && typeof patient.odontogram.set === 'function') {
    return patient.odontogram;
  }

  return fallbackMap;
};

export const applyToothUpdates = (patient, teethUpdates = []) => {
  if (!Array.isArray(teethUpdates)) {
    return ensurePatientOdontogram(patient);
  }

  const odontogram = ensurePatientOdontogram(patient);

  if (!odontogram || typeof odontogram.set !== 'function') {
    throw new Error('Não foi possível preparar o odontograma do paciente para atualização.');
  }

  teethUpdates.forEach((toothUpdate) => {
    if (!toothUpdate?.tooth || !toothUpdate?.status) {
      return;
    }

    odontogram.set(String(toothUpdate.tooth), {
      status: toothUpdate.status,
      note: toothUpdate.note || '',
      dateUpdated: new Date(),
    });
  });

  return odontogram;
};

