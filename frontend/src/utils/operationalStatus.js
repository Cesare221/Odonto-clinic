const STATUS_META = {
  agendado: {
    key: 'agendado',
    label: 'Agendado',
    shortLabel: 'Agendado',
    category: 'confirmation',
    tone: 'slate',
  },
  chegou: {
    key: 'chegou',
    label: 'Chegou',
    shortLabel: 'Chegou',
    category: 'queue',
    tone: 'sky',
  },
  waiting: {
    key: 'waiting',
    label: 'Aguardando',
    shortLabel: 'Fila',
    category: 'queue',
    tone: 'sky',
  },
  'in-progress': {
    key: 'in-progress',
    label: 'Em atendimento',
    shortLabel: 'Em curso',
    category: 'queue',
    tone: 'amber',
  },
  done: {
    key: 'done',
    label: 'Concluído',
    shortLabel: 'Finalizado',
    category: 'queue',
    tone: 'slate',
  },
  confirmado: {
    key: 'confirmado',
    label: 'Confirmado',
    shortLabel: 'Confirmado',
    category: 'confirmation',
    tone: 'emerald',
  },
  remarcar: {
    key: 'remarcar',
    label: 'Remarcar',
    shortLabel: 'Ajustar agenda',
    category: 'confirmation',
    tone: 'amber',
  },
  recusado: {
    key: 'recusado',
    label: 'Recusado',
    shortLabel: 'Cancelado',
    category: 'confirmation',
    tone: 'rose',
  },
  pendente: {
    key: 'pendente',
    label: 'Pendente',
    shortLabel: 'Sem retorno',
    category: 'confirmation',
    tone: 'slate',
  },
};

const TONE_CLASSES = {
  amber: {
    badge: 'border-amber-200 bg-amber-50 text-amber-900',
    panel: 'border-amber-200/80 bg-amber-50/80',
    accent: 'bg-amber-600 text-white',
    hint: 'text-amber-900',
  },
  emerald: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    panel: 'border-emerald-200/80 bg-emerald-50/80',
    accent: 'bg-emerald-700 text-white',
    hint: 'text-emerald-900',
  },
  rose: {
    badge: 'border-rose-200 bg-rose-50 text-rose-900',
    panel: 'border-rose-200/80 bg-rose-50/80',
    accent: 'bg-rose-700 text-white',
    hint: 'text-rose-900',
  },
  sky: {
    badge: 'border-sky-200 bg-sky-50 text-sky-900',
    panel: 'border-sky-200/80 bg-sky-50/80',
    accent: 'bg-sky-700 text-white',
    hint: 'text-sky-900',
  },
  slate: {
    badge: 'border-slate-200 bg-slate-100 text-slate-800',
    panel: 'border-slate-200 bg-slate-50/80',
    accent: 'bg-slate-700 text-white',
    hint: 'text-slate-800',
  },
};

const normalizeStatusKey = (value) => {
  if (value === 'scheduled' || value === 'agendado') return 'agendado';
  if (value === 'arrived' || value === 'chegou') return 'chegou';
  return value;
};

const resolveStatusKey = (itemOrStatus) => {
  if (typeof itemOrStatus === 'string') return normalizeStatusKey(itemOrStatus);
  if (normalizeStatusKey(itemOrStatus?.attendanceStatus) === 'in-progress' || normalizeStatusKey(itemOrStatus?.status) === 'in-progress') return 'in-progress';
  if (normalizeStatusKey(itemOrStatus?.attendanceStatus) === 'done' || normalizeStatusKey(itemOrStatus?.status) === 'done') return 'done';
  if (normalizeStatusKey(itemOrStatus?.attendanceStatus) === 'chegou' || normalizeStatusKey(itemOrStatus?.status) === 'chegou') return 'chegou';
  if (normalizeStatusKey(itemOrStatus?.attendanceStatus) === 'agendado' || normalizeStatusKey(itemOrStatus?.status) === 'agendado') return 'agendado';
  if (itemOrStatus?.statusConfirmacao === 'remarcar') return 'remarcar';
  if (itemOrStatus?.statusConfirmacao === 'recusado') return 'recusado';
  if (itemOrStatus?.statusConfirmacao === 'pendente') return 'pendente';
  if (itemOrStatus?.statusConfirmacao === 'confirmado' && (normalizeStatusKey(itemOrStatus?.attendanceStatus) === 'waiting' || normalizeStatusKey(itemOrStatus?.status) === 'waiting')) return 'confirmado';
  if (normalizeStatusKey(itemOrStatus?.attendanceStatus) === 'waiting' || normalizeStatusKey(itemOrStatus?.status) === 'waiting') return 'waiting';
  if (itemOrStatus?.operationalStatusKey) return normalizeStatusKey(itemOrStatus.operationalStatusKey);
  if (itemOrStatus?.statusConfirmacao) return itemOrStatus.statusConfirmacao;
  return 'pendente';
};

const getPeriodBounds = (period, now = new Date()) => {
  const current = new Date(now);
  const startOfDay = new Date(current.getFullYear(), current.getMonth(), current.getDate());

  if (period === 'today') {
    const end = new Date(startOfDay);
    end.setDate(end.getDate() + 1);
    return { start: startOfDay, end };
  }

  if (period === 'week') {
    const start = new Date(startOfDay);
    const weekday = start.getDay();
    const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
    start.setDate(start.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  if (period === 'month') {
    const start = new Date(current.getFullYear(), current.getMonth(), 1);
    const end = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    return { start, end };
  }

  return null;
};

const getConfirmationRelevantDate = (item) => {
  if (item?.confirmationUpdatedAt) {
    const updated = new Date(item.confirmationUpdatedAt);
    if (!Number.isNaN(updated.getTime())) return updated;
  }

  if (item?.appointmentDate) {
    const appointment = new Date(`${item.appointmentDate}T00:00:00`);
    if (!Number.isNaN(appointment.getTime())) return appointment;
  }

  return null;
};

export const getOperationalStatusMeta = (itemOrStatus) => {
  const key = resolveStatusKey(itemOrStatus);
  return STATUS_META[key] || STATUS_META.pendente;
};

export const getOperationalToneClasses = (itemOrStatus) => {
  const { tone } = getOperationalStatusMeta(itemOrStatus);
  return TONE_CLASSES[tone] || TONE_CLASSES.slate;
};

export const getOperationalNextAction = (item) => {
  const statusKey = resolveStatusKey(item);

  if (statusKey === 'in-progress') {
    return 'Retome o atendimento e finalize a consulta com segurança.';
  }

  if (statusKey === 'done') {
    return 'Consulta concluída: registre o desfecho e alinhe o próximo acompanhamento.';
  }

  if (statusKey === 'agendado') {
    return 'Consulta agendada: confirme a presença e deixe a recepção preparada para a chegada.';
  }

  if (statusKey === 'remarcar' && !item?.confirmationHandledAt) {
    return 'Entre em contato para oferecer novo horário e registrar a decisão.';
  }

  if (statusKey === 'recusado') {
    return 'Atualize a agenda, libere o horário e sinalize a equipe clínica.';
  }

  if (statusKey === 'confirmado') {
    if (item?.status === 'waiting' || item?.attendanceStatus === 'waiting') {
      return 'Paciente confirmado: prepare a sala e chame no horário combinado.';
    }
    return 'Mantenha a preparação da sala e receba o paciente no horário previsto.';
  }

  if (statusKey === 'waiting') {
    return 'Chame o paciente e inicie o atendimento quando a sala estiver pronta.';
  }

  if (statusKey === 'chegou') {
    return 'Paciente chegou: acolha na recepção e direcione para a sala de espera.';
  }

  if (statusKey === 'pendente') {
    return 'Confirme a presença deste paciente antes do horário agendado.';
  }

  return 'Siga o fluxo previsto e mantenha a equipe alinhada sobre o próximo passo.';
};

export const isOperationalConfirmationOpen = (item) => {
  const statusKey = resolveStatusKey(item);
  const isCriticalStatus = statusKey === 'remarcar' || statusKey === 'pendente' || statusKey === 'recusado';
  return isCriticalStatus && !item?.confirmationHandledAt;
};

export const isConfirmationWithinPeriod = (item, period, now = new Date()) => {
  if (period === 'all') return true;

  const bounds = getPeriodBounds(period, now);
  const relevantDate = getConfirmationRelevantDate(item);

  if (!bounds || !relevantDate) return false;
  return relevantDate >= bounds.start && relevantDate < bounds.end;
};

export const getQueuePriority = (item) => {
  const statusKey = resolveStatusKey(item);

  if (statusKey === 'in-progress') return 0;
  if (statusKey === 'remarcar') return 1;
  if (statusKey === 'recusado') return 2;
  if (statusKey === 'pendente') return 3;
  if (statusKey === 'chegou') return 4;
  if (statusKey === 'waiting') return 4;
  if (statusKey === 'agendado') return 5;
  if (statusKey === 'confirmado') return 5;
  return 5;
};

export const isQueueActionable = (item) => {
  const statusKey = resolveStatusKey(item);

  if (statusKey === 'done') return false;
  if (statusKey === 'in-progress') return true;
  if (statusKey === 'recusado' || statusKey === 'remarcar') return false;
  return true;
};
