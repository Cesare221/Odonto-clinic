import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, MoveRight, RefreshCcw, XCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import OperationalHero from './OperationalHero';
import OperationalQueuePanel from './OperationalQueuePanel';
import OperationalAgendaPanel from './OperationalAgendaPanel';
import {
  getOperationalNextAction,
  getOperationalStatusMeta,
  getOperationalToneClasses,
  getQueuePriority,
  isConfirmationWithinPeriod,
  isOperationalConfirmationOpen,
} from '../../utils/operationalStatus';
import { getAppointmentProcedureLabel as resolveAppointmentProcedureLabel } from '../../utils/appointmentDisplay';

const CONFIRMATION_STATUS_OPTIONS = ['all', 'remarcar', 'pendente', 'confirmado', 'recusado'];
const CONFIRMATION_PERIOD_OPTIONS = ['all', 'today', 'week', 'month'];
const APPOINTMENT_TYPE_LABELS = {
  eval: 'Avaliação inicial',
  routine: 'Limpeza e profilaxia',
  surgery: 'Cirurgia oral',
  ortho: 'Ortodontia',
  aesthetic: 'Estética dental',
  emergency: 'Emergência odontológica',
};

const getStartNumber = (value) => {
  const start = Number(value);
  return Number.isNaN(start) ? Number.POSITIVE_INFINITY : start;
};

const looksBrokenText = (value = '') => {
  const text = String(value || '').trim();
  if (!text) return false;
  return /�|Ã|Â/.test(text) || /\b\w*\?\w*\b/.test(text);
};

const getPatientName = (appointment) => {
  if (appointment?.patient?.name) return appointment.patient.name;
  if (appointment?.patient) return appointment.patient;
  if (appointment?.title) return appointment.title;
  return 'Paciente';
};

const getAppointmentTypeLabel = (appointment) => {
  const mappedTypeLabel = APPOINTMENT_TYPE_LABELS[appointment?.type];
  const explicitTypeLabel = appointment?.typeLabel;

  if (explicitTypeLabel && !looksBrokenText(explicitTypeLabel)) {
    return explicitTypeLabel;
  }

  if (mappedTypeLabel) {
    return mappedTypeLabel;
  }

  if (appointment?.type && !looksBrokenText(appointment.type)) {
    return appointment.type;
  }

  return appointment?.title || 'Consulta';
};

const getAppointmentProcedureLabel = (appointment) => {
  const explicitProcedure = String(appointment?.procedure || '').trim();
  if (explicitProcedure && !looksBrokenText(explicitProcedure)) {
    return explicitProcedure;
  }

  const mappedTypeLabel = APPOINTMENT_TYPE_LABELS[appointment?.type];
  if (mappedTypeLabel) {
    return mappedTypeLabel;
  }

  const confirmationNote = String(appointment?.confirmacaoObservacao || '').trim();
  if (confirmationNote && !looksBrokenText(confirmationNote)) {
    return confirmationNote;
  }

  return 'Sem observações complementares.';
};

const formatDateLabel = (rawDate) => {
  if (!rawDate) return '-';
  const parsed = new Date(`${rawDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('pt-BR');
};

const formatTimeLabel = (value) => {
  const start = Number(value);
  if (Number.isNaN(start)) return '--:--';
  const hour = Math.floor(start);
  const minute = start % 1 === 0.5 ? '30' : '00';
  return `${String(hour).padStart(2, '0')}:${minute}`;
};

const formatIsoSlotLabel = (start, end) => {
  if (!start || !end) return '';
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '';
  }

  return `${startDate.toLocaleDateString('pt-BR')} de ${startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} a ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const getSourceDate = (appointment) => {
  if (!appointment?.appointmentDate) return null;
  const parsed = new Date(`${appointment.appointmentDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getAppointmentTimestamp = (appointment) => {
  const date = getSourceDate(appointment);
  if (!date) return Number.POSITIVE_INFINITY;
  const start = getStartNumber(appointment?.start);
  if (!Number.isFinite(start)) return date.getTime();
  return date.getTime() + Math.floor(start * 60 * 60 * 1000);
};

const getConfirmationIcon = (status) => {
  if (status === 'confirmado') return CheckCircle2;
  if (status === 'recusado') return XCircle;
  return RefreshCcw;
};

const DashboardView = ({
  queue,
  revenue,
  onStartAttendance,
  hideRevenue = false,
  readOnlyQueue = false,
  appointments = [],
  onOpenCalendar,
  onlyConfirmations = false,
  onMarkConfirmationHandled,
  onReviewRescheduleRequest,
}) => {
  const [confirmationFilter, setConfirmationFilter] = useState('all');
  const [confirmationPeriodFilter, setConfirmationPeriodFilter] = useState('all');

  const dashboardAccessDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const queueSorted = useMemo(() => {
    return [...queue].sort((left, right) => {
      const priorityDiff = getQueuePriority(left) - getQueuePriority(right);
      if (priorityDiff !== 0) return priorityDiff;
      return String(left.time || '').localeCompare(String(right.time || ''));
    });
  }, [queue]);

  const confirmationItems = useMemo(() => {
    return appointments
      .map((appointment) => ({
        ...appointment,
        statusConfirmacao: appointment?.statusConfirmacao || 'pendente',
        confirmationHandledAt: appointment?.confirmationHandledAt || null,
        patientName: getPatientName(appointment),
        dateLabel: formatDateLabel(appointment?.appointmentDate),
        timeLabel: formatTimeLabel(appointment?.start),
        operationalLabel: appointment?.operationalLabel || getOperationalStatusMeta(appointment).label,
        nextAction: appointment?.nextAction || getOperationalNextAction(appointment),
      }))
      .filter((appointment) => ['remarcar', 'pendente', 'confirmado', 'recusado'].includes(appointment.statusConfirmacao))
      .sort((left, right) => {
        const leftPriority = getQueuePriority(left);
        const rightPriority = getQueuePriority(right);
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;

        const leftUpdate = left?.confirmationUpdatedAt ? new Date(left.confirmationUpdatedAt).getTime() : 0;
        const rightUpdate = right?.confirmationUpdatedAt ? new Date(right.confirmationUpdatedAt).getTime() : 0;
        if (leftUpdate !== rightUpdate) return rightUpdate - leftUpdate;

        return getAppointmentTimestamp(left) - getAppointmentTimestamp(right);
      });
  }, [appointments]);

  const confirmationFeed = useMemo(() => {
    const now = new Date();

    return confirmationItems
      .filter((appointment) => {
        if (confirmationFilter === 'all') return true;
        return appointment.statusConfirmacao === confirmationFilter;
      })
      .filter((appointment) => isConfirmationWithinPeriod(appointment, confirmationPeriodFilter, now));
  }, [confirmationFilter, confirmationItems, confirmationPeriodFilter]);

  const confirmationTotals = useMemo(() => {
    return confirmationItems.reduce((acc, appointment) => {
      acc[appointment.statusConfirmacao] += 1;
      return acc;
    }, { remarcar: 0, pendente: 0, confirmado: 0, recusado: 0 });
  }, [confirmationItems]);

  const highlightedConfirmations = useMemo(() => {
    return confirmationItems.filter((appointment) => isOperationalConfirmationOpen(appointment)).slice(0, 4);
  }, [confirmationItems]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .map((appointment) => ({
        ...appointment,
        patientName: getPatientName(appointment),
        timeLabel: formatTimeLabel(appointment?.start),
        typeLabel: getAppointmentTypeLabel(appointment),
        procedureLabel: getAppointmentProcedureLabel(appointment),
        statusMeta: getOperationalStatusMeta(appointment),
        statusTone: getOperationalToneClasses(appointment),
        operationalLabel: appointment?.operationalLabel || getOperationalStatusMeta(appointment).label,
        nextAction: appointment?.nextAction || getOperationalNextAction(appointment),
      }))
      .filter((appointment) => {
        const date = getSourceDate(appointment);
        if (!date) return false;
        if (appointment?.attendanceStatus === 'done') return false;
        return getAppointmentTimestamp(appointment) >= now.getTime();
      })
      .sort((left, right) => getAppointmentTimestamp(left) - getAppointmentTimestamp(right))
      .slice(0, 5);
  }, [appointments]);

  const operationalSummary = useMemo(() => {
    const activeCount = queue.filter((item) => item.status === 'in-progress').length;
    const waitingCount = queue.filter((item) => item.status === 'waiting').length;
    const criticalCount = confirmationItems.filter((appointment) => isOperationalConfirmationOpen(appointment)).length;
    const upcomingCount = upcomingAppointments.length;

    let health = 'stable';
    if (activeCount > 0 || criticalCount >= 3 || waitingCount >= 4) {
      health = 'critical';
    } else if (criticalCount > 0 || waitingCount >= 2 || activeCount === 1) {
      health = 'attention';
    }

    const topQueueItem = queueSorted[0];
    const topConfirmation = confirmationItems.find((appointment) => isOperationalConfirmationOpen(appointment));

    let nextActionTitle = 'Revise a agenda antes do próximo bloco clínico.';
    let nextActionDescription = 'Use a janela atual para alinhar a fila, confirmar presenças e preparar a sala com antecedência.';

    if (topQueueItem) {
      nextActionTitle = `${topQueueItem.patient} é o foco mais imediato.`;
      nextActionDescription = topQueueItem.nextAction || getOperationalNextAction(topQueueItem);
    } else if (topConfirmation) {
      nextActionTitle = `${topConfirmation.patientName} precisa de retorno de agenda.`;
      nextActionDescription = topConfirmation.nextAction || getOperationalNextAction(topConfirmation);
    }

    return {
      health,
      accessDate: dashboardAccessDate,
      revenueLabel: `R$ ${Number(revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      nextActionTitle,
      nextActionDescription,
      metrics: {
        active: activeCount,
        waiting: waitingCount,
        confirmations: criticalCount,
        upcoming: upcomingCount,
      },
    };
  }, [confirmationItems, dashboardAccessDate, queue, queueSorted, revenue, upcomingAppointments]);

  const handleTreatConfirmation = async (appointmentId, currentHandledAt) => {
    if (!onMarkConfirmationHandled) return;
    await onMarkConfirmationHandled(appointmentId, !currentHandledAt);
  };

  const handleRescheduleDecision = async (appointmentId, decision) => {
    if (!onReviewRescheduleRequest) return;
    await onReviewRescheduleRequest(appointmentId, decision);
  };

  return (
    <div className="mx-auto flex min-w-0 max-w-7xl flex-col gap-5 xl:max-w-[88rem]">
      {!onlyConfirmations && (
        <>
          <OperationalHero
            summary={operationalSummary}
            hideRevenue={hideRevenue}
            onOpenCalendar={onOpenCalendar}
          />

          <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <OperationalQueuePanel
              queue={queueSorted}
              readOnlyQueue={readOnlyQueue}
              onStartAttendance={onStartAttendance}
            />
            <OperationalAgendaPanel
              upcomingAppointments={upcomingAppointments}
              highlightedConfirmations={highlightedConfirmations}
              onOpenCalendar={onOpenCalendar}
            />
          </div>
        </>
      )}

      <Card variant="bordered" className="overflow-hidden p-0">
        <div className="border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(246,239,226,0.85),rgba(255,252,247,0.98))] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--copy-muted)]">
                Confirmações
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
                {confirmationTotals.remarcar} remarcar
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
                {confirmationTotals.pendente} pendente
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">
                {confirmationTotals.confirmado} confirmado
              </span>
              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-900">
                {confirmationTotals.recusado} recusado
              </span>
              <Button className="w-full sm:w-auto" type="button" variant="secondary" size="sm" icon={CalendarDays} onClick={onOpenCalendar}>
                Abrir agenda
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {CONFIRMATION_STATUS_OPTIONS.map((status) => {
              const active = confirmationFilter === status;
              const labelMap = {
                all: 'Todos',
                remarcar: 'Remarcar',
                pendente: 'Pendentes',
                confirmado: 'Confirmados',
                recusado: 'Recusados',
              };

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setConfirmationFilter(status)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-[var(--border-soft)] bg-white text-[var(--copy-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {labelMap[status]}
                </button>
              );
            })}

            <div className="mx-1 hidden h-6 w-px bg-[var(--border-soft)] md:block" />

            {CONFIRMATION_PERIOD_OPTIONS.map((period) => {
              const active = confirmationPeriodFilter === period;
              const labelMap = {
                all: 'Todo período',
                today: 'Hoje',
                week: 'Semana',
                month: 'Mês',
              };

              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => setConfirmationPeriodFilter(period)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-[var(--color-primary-700)] bg-[var(--color-primary-700)] text-white'
                      : 'border-[var(--border-soft)] bg-white text-[var(--copy-muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {labelMap[period]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {confirmationFeed.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-panel-soft)] px-5 py-10 text-center">
              <p className="text-base font-semibold text-[var(--copy-strong)]">
                Nenhum retorno dentro deste recorte
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {confirmationFeed.map((appointment) => {
                const meta = getOperationalStatusMeta(appointment);
                const tone = getOperationalToneClasses(appointment);
                const Icon = getConfirmationIcon(appointment.statusConfirmacao);
                const hasPendingPreReserve = appointment.statusConfirmacao === 'remarcar'
                  && appointment?.rescheduleRequest?.requestStatus === 'pending_review';
                const requestedSlotLabel = formatIsoSlotLabel(
                  appointment?.rescheduleRequest?.requestedStart,
                  appointment?.rescheduleRequest?.requestedEnd
                );

                return (
                  <div key={appointment.id} className={`rounded-2xl border p-4 shadow-[var(--shadow-sm)] ${tone.panel}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                            <Icon size={13} />
                            {meta.label}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-[var(--copy-muted)]">
                            <Clock3 size={13} />
                            {appointment.dateLabel} às {appointment.timeLabel}
                          </span>
                        </div>

                        <div>
                          <p className="text-base font-semibold text-[var(--copy-strong)]">
                            {appointment.patientName}
                          </p>
                          <p className="mt-1 text-sm text-[var(--copy-body)]">
                            {resolveAppointmentProcedureLabel(appointment)}
                          </p>
                        </div>

                        {appointment.confirmacaoObservacao && appointment.confirmacaoObservacao !== resolveAppointmentProcedureLabel(appointment) && (
                          <p className="text-sm leading-6 text-[var(--copy-body)]">
                            {appointment.confirmacaoObservacao}
                          </p>
                        )}

                        {hasPendingPreReserve && requestedSlotLabel && (
                          <div className="rounded-2xl border border-sky-200/60 bg-sky-50/80 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                              Horário pré-reservado pelo paciente
                            </p>
                            <p className="mt-1 text-sm font-medium text-sky-950">
                              {requestedSlotLabel}
                            </p>
                            <p className="mt-1 text-xs text-sky-800/80">
                              Ao aprovar, o sistema remarca esta mesma consulta automaticamente para este horário.
                            </p>
                          </div>
                        )}

                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--copy-muted)]">
                          Próximo passo
                        </p>
                        <p className="text-sm leading-6 text-[var(--copy-body)]">
                          {appointment.nextAction}
                        </p>

                        <p className="text-xs font-medium text-[var(--copy-muted)]">
                          {appointment.confirmationHandledAt
                            ? `Solicitação tratada em ${new Date(appointment.confirmationHandledAt).toLocaleString('pt-BR')}`
                            : 'Solicitação aberta para tratamento'}
                        </p>
                      </div>

                      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                        <Button className="w-full sm:w-auto" type="button" variant="secondary" size="sm" onClick={onOpenCalendar}>
                          Abrir consulta
                        </Button>
                        {hasPendingPreReserve && (
                          <>
                            <Button
                              className="w-full sm:w-auto"
                              type="button"
                              variant="success"
                              size="sm"
                              onClick={() => handleRescheduleDecision(appointment.id, 'approved')}
                              disabled={!onReviewRescheduleRequest}
                            >
                              Confirmar e remarcar
                            </Button>
                            <Button
                              className="w-full sm:w-auto"
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRescheduleDecision(appointment.id, 'released')}
                              disabled={!onReviewRescheduleRequest}
                            >
                              Liberar pré-reserva
                            </Button>
                          </>
                        )}
                        {(
                          appointment.statusConfirmacao === 'remarcar'
                          || appointment.statusConfirmacao === 'pendente'
                          || appointment.statusConfirmacao === 'recusado'
                        ) && (
                          <Button
                            className="w-full sm:w-auto"
                            type="button"
                            variant={
                              appointment.confirmationHandledAt
                                ? 'secondary'
                                : appointment.statusConfirmacao === 'recusado'
                                  ? 'danger'
                                  : 'warning'
                            }
                            size="sm"
                            icon={MoveRight}
                            onClick={() => handleTreatConfirmation(appointment.id, appointment.confirmationHandledAt)}
                            disabled={!onMarkConfirmationHandled}
                          >
                            {appointment.confirmationHandledAt
                              ? 'Voltar para pendente'
                              : appointment.statusConfirmacao === 'recusado'
                                ? 'Marcar cancelamento tratado'
                                : 'Marcar como tratado'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardView;




