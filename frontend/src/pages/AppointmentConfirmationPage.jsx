import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  buildPublicConfirmationPayload,
  addMonths,
  buildRescheduleMonthCalendarDays,
  formatRescheduleDateLabel,
  formatRescheduleMonthLabel,
  formatRescheduleTimeLabel,
  getMonthStart,
  groupRescheduleOptionsByDay,
} from './appointmentConfirmationPage.helpers';
import {
  fetchPublicRescheduleOptions,
  submitPublicConfirmation,
} from '../services/confirmationsService';

const CALENDAR_WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const SUCCESS_CONTENT = {
  confirmado: {
    title: 'Presença confirmada',
    message: 'Sua presença foi confirmada.',
  },
  recusado: {
    title: 'Resposta registrada',
    message: 'Sua resposta foi registrada.',
  },
  remarcar: {
    title: 'Pré-reserva solicitada',
    message: 'Seu pedido de remarcação foi enviado.',
  },
};

const isLinkUnavailableError = (error) => {
  const status = error?.response?.status;
  return status === 400 || status === 404 || status === 409;
};

const getApiMessage = (error, fallbackMessage) => (
  error?.response?.data?.message || fallbackMessage
);

const getActionButtonLabel = (action, pendingAction) => {
  if (pendingAction !== action) {
    if (action === 'confirmado') return 'Confirmar presença';
    if (action === 'recusado') return 'Não poderei comparecer';
    return 'Solicitar remarcação';
  }

  if (action === 'confirmado') return 'Confirmando...';
  if (action === 'recusado') return 'Registrando...';
  return 'Reservando horário...';
};

const FeedbackBanner = ({ tone = 'neutral', title, message, action }) => {
  const toneClasses = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    neutral: 'border-slate-200 bg-slate-50 text-slate-800',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses[tone] || toneClasses.neutral}`}>
      {title && <p className="text-sm font-semibold">{title}</p>}
      {message && <p className="mt-1 text-sm leading-6">{message}</p>}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
};

const LoadingCalendarSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={`weekday-${index}`}
          className="h-5 animate-pulse rounded bg-slate-200/80"
        />
      ))}
    </div>
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }, (_, index) => (
        <div
          key={`day-${index}`}
          className="h-16 animate-pulse rounded-2xl bg-slate-200/80"
        />
      ))}
    </div>
  </div>
);

export default function AppointmentConfirmationPage() {
  const { token } = useParams();
  const [note, setNote] = useState('');
  const [slotGroups, setSlotGroups] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(new Date()));
  const [optionsState, setOptionsState] = useState({
    status: 'loading',
    message: '',
    isLinkUnavailable: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [result, setResult] = useState({ type: 'idle', title: '', message: '' });

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

  const handleMonthChange = (monthDelta) => {
    setVisibleMonth((currentMonth) => addMonths(currentMonth, monthDelta));
    setSelectedDateKey('');
    setSelectedSlotId('');
  };

  const loadRescheduleOptions = useCallback(async () => {
    if (!token) {
      setOptionsState({
        status: 'error',
        message: 'Link de confirmação inválido.',
        isLinkUnavailable: true,
      });
      setSlotGroups([]);
      setSelectedDateKey('');
      setSelectedSlotId('');
      return;
    }

    setOptionsState((currentState) => ({
      ...currentState,
      status: 'loading',
      message: '',
      isLinkUnavailable: false,
    }));

    try {
      const options = await fetchPublicRescheduleOptions(token);
      const groupedOptions = groupRescheduleOptionsByDay(options);

      setSlotGroups(groupedOptions);
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
      setOptionsState({
        status: groupedOptions.length > 0 ? 'ready' : 'empty',
        message: groupedOptions.length > 0
          ? ''
          : 'No momento, não há horários públicos livres para pré-reserva. Se necessário, entre em contato com a clínica.',
        isLinkUnavailable: false,
      });
    } catch (error) {
      setSlotGroups([]);
      setSelectedDateKey('');
      setSelectedSlotId('');
      setOptionsState({
        status: 'error',
        message: getApiMessage(
          error,
          'Não foi possível carregar os horários de remarcação neste momento. Tente atualizar novamente em instantes.'
        ),
        isLinkUnavailable: isLinkUnavailableError(error),
      });
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRescheduleOptions();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRescheduleOptions]);

  const handleSubmit = async (action) => {
    if (!token || isSubmitting || optionsState.isLinkUnavailable) {
      return;
    }

    if (action === 'remarcar' && !selectedSlot) {
      setResult({
        type: 'error',
        title: 'Selecione um horário',
        message: 'Escolha um dia e, em seguida, um horário disponível para solicitar a remarcação com pré-reserva.',
      });
      return;
    }

    setPendingAction(action);
    setIsSubmitting(true);
    setResult({ type: 'idle', title: '', message: '' });

    try {
      const payload = buildPublicConfirmationPayload({
        action,
        note,
        selectedSlot,
      });
      const response = await submitPublicConfirmation(token, payload);
      const persistedAction = response?.data?.statusConfirmacao || action;
      const persistedNote = response?.data?.confirmacaoObservacao || '';
      const successContent = SUCCESS_CONTENT[persistedAction] || {
        title: 'Resposta registrada',
        message: 'Sua resposta foi enviada com sucesso.',
      };

      const responseSlotStart = response?.data?.rescheduleRequest?.requestedStart || selectedSlot?.start;
      const responseSlotEnd = response?.data?.rescheduleRequest?.requestedEnd || selectedSlot?.end;
      const slotMessage = (
        persistedAction === 'remarcar'
        && responseSlotStart
        && responseSlotEnd
      )
        ? `Horário solicitado: ${formatRescheduleDateLabel(responseSlotStart)} às ${formatRescheduleTimeLabel(responseSlotStart, responseSlotEnd)}.`
        : '';
      const noteMessage = persistedNote
        ? `Observação enviada: "${persistedNote}".`
        : '';

      setResult({
        type: 'success',
        title: successContent.title,
        message: [successContent.message, slotMessage, noteMessage].filter(Boolean).join(' '),
      });
    } catch (error) {
      setResult({
        type: 'error',
        title: action === 'remarcar'
          ? 'Não foi possível concluir a pré-reserva'
          : 'Não foi possível registrar sua resposta',
        message: getApiMessage(error, 'Tivemos um problema ao registrar sua resposta. Tente novamente.'),
      });

      if (action === 'remarcar' && error?.response?.status === 409) {
        await loadRescheduleOptions();
      }
    } finally {
      setIsSubmitting(false);
      setPendingAction('');
    }
  };

  const isPageLocked = isSubmitting || result.type === 'success' || optionsState.isLinkUnavailable;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.12),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_48%,_#ffffff_100%)] px-2 py-3 sm:px-5 sm:py-8 lg:px-8">
      <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-[22px] border border-slate-200 bg-white/95 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:rounded-[28px] sm:p-6 lg:p-8">
        <div className="grid gap-5 lg:grid-cols-[0.92fr,1.08fr] lg:gap-6">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 sm:text-sm">
                Confirmação pública
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-[2rem]">
                Confirme sua consulta ou escolha outro dia
              </h1>
            </div>

            {result.type !== 'idle' ? (
              <FeedbackBanner
                tone={result.type === 'success' ? 'success' : 'error'}
                title={result.title}
                message={result.message}
              />
            ) : null}

            {optionsState.isLinkUnavailable ? (
              <FeedbackBanner
                tone="error"
                title="Este link não está mais disponível"
                message={optionsState.message}
              />
            ) : null}

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <p className="text-base font-semibold text-slate-900">Responder agora</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  disabled={isPageLocked}
                  onClick={() => handleSubmit('confirmado')}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {getActionButtonLabel('confirmado', pendingAction)}
                </button>
                <button
                  type="button"
                  disabled={isPageLocked}
                  onClick={() => handleSubmit('recusado')}
                  className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {getActionButtonLabel('recusado', pendingAction)}
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <label htmlFor="confirmation-note" className="block text-sm font-semibold text-slate-900">
                Mensagem opcional para a equipe
              </label>
              <textarea
                id="confirmation-note"
                rows={4}
                value={note}
                disabled={result.type === 'success'}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ex.: posso chegar alguns minutos antes, ou preciso de ajuda para ajustar o horário."
                className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-950/[0.02] p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-950">Quero remarcar</p>
              </div>
              <button
                type="button"
                onClick={loadRescheduleOptions}
                disabled={isSubmitting || optionsState.isLinkUnavailable}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Atualizar
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {selectedSlot ? (
                <FeedbackBanner
                  tone="info"
                  title="Horário selecionado"
                  message={`${formatRescheduleDateLabel(selectedSlot.start)} às ${formatRescheduleTimeLabel(selectedSlot.start, selectedSlot.end)}.`}
                />
              ) : null}

              {optionsState.status === 'loading' ? <LoadingCalendarSkeleton /> : null}

              {optionsState.status === 'error' && !optionsState.isLinkUnavailable ? (
                <FeedbackBanner
                  tone="error"
                  title="Não foi possível carregar os horários"
                  message={optionsState.message}
                />
              ) : null}

              {optionsState.status === 'empty' ? (
                <FeedbackBanner
                  tone="neutral"
                  title="Sem horários públicos no momento"
                  message={optionsState.message}
                />
              ) : null}

              {optionsState.status === 'ready' ? (
                <>
                  <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Selecione um dia</p>
                      </div>
                    </div>

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
                        Próximo ›
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
                              {day.isAvailable ? 'Livre' : day.monthShort}
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
                            Horários disponíveis
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
                                {isSelected ? 'Selecionado para enviar' : 'Clique para selecionar'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ) : (
                    <FeedbackBanner
                      tone="neutral"
                      title="Escolha um dia para continuar"
                    />
                  )}
                </>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Enviar pedido de remarcação</p>
              </div>
              <button
                type="button"
                disabled={isPageLocked || !selectedSlot || optionsState.status !== 'ready'}
                onClick={() => handleSubmit('remarcar')}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto sm:min-w-[220px]"
              >
                {getActionButtonLabel('remarcar', pendingAction)}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


