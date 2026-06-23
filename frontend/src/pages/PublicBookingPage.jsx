import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  addMonths,
  buildPublicBookingPayload,
  buildRescheduleMonthCalendarDays,
  formatRescheduleDateLabel,
  formatRescheduleMonthLabel,
  formatRescheduleTimeLabel,
  getMonthStart,
  groupRescheduleOptionsByDay,
} from './appointmentConfirmationPage.helpers';
import { createPublicBooking, fetchPublicBookingAvailability } from '../services/publicBookingService';
import { maskCPF, maskPhone } from '../utils/masks';

const CALENDAR_WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const APPOINTMENT_TYPE_OPTIONS = [
  { value: 'eval', label: 'Avaliacao inicial' },
  { value: 'routine', label: 'Consulta de rotina' },
  { value: 'surgery', label: 'Cirurgia' },
  { value: 'ortho', label: 'Ortodontia' },
  { value: 'aesthetic', label: 'Estetica' },
  { value: 'emergency', label: 'Urgencia' },
];

const initialFormState = {
  patientName: '',
  cpf: '',
  phone: '',
  email: '',
  doctorId: '',
  type: 'eval',
  procedure: '',
  note: '',
};

const FeedbackBanner = ({ tone = 'neutral', title, message }) => {
  const toneClasses = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    neutral: 'border-slate-200 bg-slate-50 text-slate-800',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses[tone] || toneClasses.neutral}`}>
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      {message ? <p className="mt-1 text-sm leading-6">{message}</p> : null}
    </div>
  );
};

const LoadingCalendarSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={`weekday-${index}`} className="h-5 animate-pulse rounded bg-slate-200/80" />
      ))}
    </div>
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }, (_, index) => (
        <div key={`day-${index}`} className="h-16 animate-pulse rounded-2xl bg-slate-200/80" />
      ))}
    </div>
  </div>
);

export default function PublicBookingPage() {
  const [form, setForm] = useState(initialFormState);
  const [slotGroups, setSlotGroups] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(new Date()));
  const [availabilityState, setAvailabilityState] = useState({
    status: 'loading',
    message: '',
    doctorName: '',
    doctors: [],
  });
  const [result, setResult] = useState({ type: 'idle', title: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDayGroup = useMemo(
    () => slotGroups.find((group) => group.dateKey === selectedDateKey) || null,
    [slotGroups, selectedDateKey]
  );
  const selectedSlot = useMemo(
    () => selectedDayGroup?.slots.find((slot) => slot.id === selectedSlotId) || null,
    [selectedDayGroup, selectedSlotId]
  );
  const calendarDays = useMemo(
    () => buildRescheduleMonthCalendarDays(slotGroups, { monthDate: visibleMonth }),
    [slotGroups, visibleMonth]
  );
  const visibleMonthLabel = useMemo(
    () => formatRescheduleMonthLabel(visibleMonth),
    [visibleMonth]
  );
  const isCurrentMonthVisible = useMemo(() => (
    getMonthStart(visibleMonth).getTime() === getMonthStart(new Date()).getTime()
  ), [visibleMonth]);
  const leadingEmptyDays = useMemo(() => {
    if (calendarDays.length === 0) return 0;
    return calendarDays[0].weekdayIndex;
  }, [calendarDays]);

  const loadAvailability = useCallback(async (doctorIdOverride = null) => {
    setAvailabilityState((current) => ({
      ...current,
      status: 'loading',
      message: '',
    }));

    try {
      const effectiveDoctorId = doctorIdOverride ?? form.doctorId;
      const payload = await fetchPublicBookingAvailability(
        effectiveDoctorId ? { doctorId: effectiveDoctorId } : {}
      );
      const groupedOptions = groupRescheduleOptionsByDay(payload?.slots || []);
      const doctorOptions = payload?.doctors || [];
      const resolvedDoctorId = String(payload?.doctor?.id || '');

      setSlotGroups(groupedOptions);
      setForm((current) => ({
        ...current,
        doctorId: doctorOptions.some((doctor) => String(doctor.id) === String(current.doctorId))
          ? current.doctorId
          : resolvedDoctorId,
      }));
      setSelectedDateKey((currentDateKey) => (
        groupedOptions.some((group) => group.dateKey === currentDateKey)
          ? currentDateKey
          : ''
      ));
      setSelectedSlotId((currentSlotId) => (
        groupedOptions.some((group) => group.slots.some((slot) => slot.id === currentSlotId))
          ? currentSlotId
          : ''
      ));
      setAvailabilityState({
        status: groupedOptions.length > 0 ? 'ready' : 'empty',
        message: groupedOptions.length > 0
          ? ''
          : 'No momento, nao ha horarios livres para agendamento online. Atualize a agenda ou fale com a clinica.',
        doctorName: payload?.doctor?.name || '',
        doctors: doctorOptions,
      });
    } catch (error) {
      setSlotGroups([]);
      setSelectedDateKey('');
      setSelectedSlotId('');
      setAvailabilityState({
        status: 'error',
        message: error?.response?.data?.message || 'Nao foi possivel carregar a agenda online agora.',
        doctorName: '',
        doctors: [],
      });
    }
  }, [form.doctorId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAvailability();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAvailability]);

  const handleMonthChange = (monthDelta) => {
    setVisibleMonth((currentMonth) => addMonths(currentMonth, monthDelta));
    setSelectedDateKey('');
    setSelectedSlotId('');
  };

  const handleFieldChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleDoctorChange = async (doctorId) => {
    setSelectedDateKey('');
    setSelectedSlotId('');
    setResult({ type: 'idle', title: '', message: '' });
    setForm((current) => ({
      ...current,
      doctorId,
    }));
    await loadAvailability(doctorId);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedSlot) {
      setResult({
        type: 'error',
        title: 'Selecione um horario',
        message: 'Escolha um dia e um horario disponiveis para concluir o agendamento.',
      });
      return;
    }

    setIsSubmitting(true);
    setResult({ type: 'idle', title: '', message: '' });

    try {
      const payload = buildPublicBookingPayload({ form, selectedSlot });
      const booking = await createPublicBooking(payload);

      setResult({
        type: 'success',
        title: 'Agendamento confirmado',
        message: `${booking?.patient?.name || form.patientName} ficou agendado para ${formatRescheduleDateLabel(booking?.start || selectedSlot.start)} as ${formatRescheduleTimeLabel(booking?.start || selectedSlot.start, booking?.end || selectedSlot.end)}.`,
      });
      setForm((current) => ({
        ...initialFormState,
        doctorId: current.doctorId,
      }));
      await loadAvailability(form.doctorId);
    } catch (error) {
      setResult({
        type: 'error',
        title: 'Nao foi possivel concluir o agendamento',
        message: error?.response?.data?.message || 'Tente novamente em alguns instantes.',
      });

      if (error?.response?.status === 409) {
        await loadAvailability(form.doctorId);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPageLocked = isSubmitting || result.type === 'success';

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_40%,_#ffffff_100%)] px-3 py-4 sm:px-5 sm:py-8 lg:px-8">
      <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Area interna
              </Link>
              <button
                type="button"
                onClick={() => {
                  void loadAvailability(form.doctorId);
                }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} className={availabilityState.status === 'loading' ? 'animate-spin' : ''} />
                Atualizar agenda
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 sm:text-sm">
                Agendamento online
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Escolha o dentista e marque sem depender da recepcao
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                A agenda mostra apenas horarios realmente disponiveis. Depois de preencher os dados, o agendamento entra direto no sistema.
              </p>
            </div>

            {result.type !== 'idle' ? (
              <FeedbackBanner
                tone={result.type === 'success' ? 'success' : 'error'}
                title={result.title}
                message={result.message}
              />
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div>
                <label htmlFor="booking-doctor" className="block text-sm font-semibold text-slate-900">
                  Dentista
                </label>
                <select
                  id="booking-doctor"
                  required
                  disabled={isPageLocked || availabilityState.doctors.length === 0}
                  value={form.doctorId}
                  onChange={(event) => {
                    void handleDoctorChange(event.target.value);
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="" disabled>Selecione um dentista</option>
                  {availabilityState.doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
                {availabilityState.doctorName ? (
                  <p className="mt-2 text-xs font-medium text-sky-700">
                    Agenda exibida para {availabilityState.doctorName}.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="booking-name" className="block text-sm font-semibold text-slate-900">
                    Nome completo
                  </label>
                  <input
                    id="booking-name"
                    required
                    disabled={isPageLocked}
                    value={form.patientName}
                    onChange={(event) => handleFieldChange('patientName', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="Nome do paciente"
                  />
                </div>
                <div>
                  <label htmlFor="booking-cpf" className="block text-sm font-semibold text-slate-900">
                    CPF
                  </label>
                  <input
                    id="booking-cpf"
                    required
                    disabled={isPageLocked}
                    value={form.cpf}
                    onChange={(event) => handleFieldChange('cpf', maskCPF(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="booking-phone" className="block text-sm font-semibold text-slate-900">
                    Telefone
                  </label>
                  <input
                    id="booking-phone"
                    required
                    disabled={isPageLocked}
                    value={form.phone}
                    onChange={(event) => handleFieldChange('phone', maskPhone(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label htmlFor="booking-email" className="block text-sm font-semibold text-slate-900">
                    E-mail
                  </label>
                  <input
                    id="booking-email"
                    type="email"
                    disabled={isPageLocked}
                    value={form.email}
                    onChange={(event) => handleFieldChange('email', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="voce@email.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="booking-type" className="block text-sm font-semibold text-slate-900">
                    Tipo de consulta
                  </label>
                  <select
                    id="booking-type"
                    disabled={isPageLocked}
                    value={form.type}
                    onChange={(event) => handleFieldChange('type', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="booking-procedure" className="block text-sm font-semibold text-slate-900">
                    Procedimento ou motivo
                  </label>
                  <input
                    id="booking-procedure"
                    disabled={isPageLocked}
                    value={form.procedure}
                    onChange={(event) => handleFieldChange('procedure', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="Ex.: avaliacao, limpeza, dor"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="booking-note" className="block text-sm font-semibold text-slate-900">
                  Observacoes
                </label>
                <textarea
                  id="booking-note"
                  rows={4}
                  disabled={isPageLocked}
                  value={form.note}
                  onChange={(event) => handleFieldChange('note', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="Ex.: dor localizada, retorno, preferencia de atendimento."
                />
              </div>

              {selectedSlot ? (
                <FeedbackBanner
                  tone="info"
                  title="Horario selecionado"
                  message={`${formatRescheduleDateLabel(selectedSlot.start)} as ${formatRescheduleTimeLabel(selectedSlot.start, selectedSlot.end)}.`}
                />
              ) : (
                <FeedbackBanner
                  tone="neutral"
                  title="Escolha um horario na agenda"
                  message="Selecione primeiro um dia disponivel e depois o horario desejado."
                />
              )}

              <button
                type="submit"
                disabled={isPageLocked || !selectedSlot || !form.doctorId || availabilityState.status !== 'ready'}
                className="inline-flex min-h-[3.2rem] w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <CheckCircle2 size={18} />
                {isSubmitting ? 'Confirmando agendamento...' : 'Confirmar agendamento'}
              </button>
            </form>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-950/[0.02] p-4 sm:p-5 lg:p-6">
            <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <CalendarDays size={20} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-950">Agenda publica</p>
                <p className="mt-1 text-sm text-slate-500">
                  Horarios livres para os proximos meses.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {availabilityState.status === 'loading' ? <LoadingCalendarSkeleton /> : null}

              {availabilityState.status === 'error' ? (
                <FeedbackBanner
                  tone="error"
                  title="Agenda indisponivel no momento"
                  message={availabilityState.message}
                />
              ) : null}

              {availabilityState.status === 'empty' ? (
                <FeedbackBanner
                  tone="neutral"
                  title="Sem horarios online agora"
                  message={availabilityState.message}
                />
              ) : null}

              {availabilityState.status === 'ready' ? (
                <>
                  <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                    <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2">
                      <button
                        type="button"
                        disabled={isPageLocked || isCurrentMonthVisible}
                        onClick={() => handleMonthChange(-1)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
                      >
                        ‹ Anterior
                      </button>
                      <p className="min-w-0 truncate px-1 text-center text-sm font-semibold capitalize text-slate-950 sm:text-base">
                        {visibleMonthLabel}
                      </p>
                      <button
                        type="button"
                        disabled={isPageLocked}
                        onClick={() => handleMonthChange(1)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
                      >
                        Proximo ›
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {CALENDAR_WEEKDAY_LABELS.map((weekday) => (
                        <span
                          key={weekday}
                          className="text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 sm:text-[11px] sm:tracking-[0.14em]"
                        >
                          {weekday}
                        </span>
                      ))}
                    </div>

                    <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
                      {Array.from({ length: leadingEmptyDays }, (_, index) => (
                        <div
                          key={`empty-${index}`}
                          className="h-14 rounded-xl border border-transparent sm:h-[4.75rem] sm:rounded-2xl"
                          aria-hidden="true"
                        />
                      ))}

                      {calendarDays.map((day) => {
                        const isSelected = day.dateKey === selectedDateKey;

                        return (
                          <button
                            key={day.dateKey}
                            type="button"
                            disabled={!day.isAvailable || isPageLocked}
                            onClick={() => {
                              setSelectedDateKey(day.dateKey);
                              setSelectedSlotId('');
                            }}
                            className={`flex h-14 min-w-0 flex-col items-center justify-center rounded-xl border px-0.5 text-center transition sm:h-[4.75rem] sm:rounded-2xl sm:px-1.5 ${
                              isSelected
                                ? 'border-sky-500 bg-sky-50 text-sky-950 shadow-[0_12px_24px_rgba(14,116,144,0.12)]'
                                : day.isAvailable
                                  ? 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                                  : 'border-slate-100 bg-slate-50/80 text-slate-300'
                            } disabled:cursor-not-allowed`}
                          >
                            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] sm:block">
                              {day.weekdayShort}
                            </span>
                            <span className="text-base font-semibold sm:mt-1 sm:text-lg">
                              {day.dayNumber}
                            </span>
                            <span className="mt-0.5 max-w-full truncate text-[9px] uppercase tracking-[0.05em] sm:mt-1 sm:text-[10px] sm:tracking-[0.1em]">
                              {day.isAvailable ? `${day.slotCount} vaga${day.slotCount > 1 ? 's' : ''}` : day.monthShort}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDayGroup ? (
                    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div>
                          <p className="text-sm font-semibold capitalize text-slate-900">
                            {selectedDayGroup.label}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                            Horarios disponiveis
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {selectedDayGroup.slots.map((slot) => {
                          const isSelected = slot.id === selectedSlotId;

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              aria-pressed={isSelected}
                              disabled={isPageLocked}
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={`rounded-2xl border px-4 py-3 text-left transition ${
                                isSelected
                                  ? 'border-sky-500 bg-sky-50 text-sky-950 shadow-[0_10px_30px_rgba(14,116,144,0.15)]'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              <span className="block text-sm font-semibold">{slot.timeLabel}</span>
                              <span className="mt-1 block text-xs text-slate-500">
                                {isSelected ? 'Selecionado para concluir' : 'Clique para selecionar'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ) : (
                    <FeedbackBanner
                      tone="neutral"
                      title="Escolha um dia disponivel"
                      message="Ao selecionar um dia com vagas, os horarios daquele dia aparecem aqui."
                    />
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
