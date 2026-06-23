import { CalendarClock, CheckCircle2, Clock3, MoveRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { getOperationalNextAction, getOperationalStatusMeta, getOperationalToneClasses } from '../../utils/operationalStatus';

const OperationalAgendaPanel = ({
  upcomingAppointments,
  highlightedConfirmations,
  onOpenCalendar,
}) => {
  return (
    <Card variant="default" className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--copy-muted)]">
            Agenda resumida
          </p>
          <h3 className="mt-2 text-xl font-bold text-[var(--copy-strong)]">
            Próximos movimentos do dia
          </h3>
        </div>

        <Button className="w-full sm:w-auto" type="button" variant="outline" size="sm" onClick={onOpenCalendar}>
          Ver agenda
        </Button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          {upcomingAppointments.length === 0 ? (
            <div className="page-muted-panel rounded-2xl border border-dashed px-5 py-10 text-center">
              <p className="text-base font-semibold text-[var(--copy-strong)]">
                Nenhum agendamento futuro no recorte atual
              </p>
            </div>
          ) : (
            upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="page-muted-panel rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[var(--copy-strong)]">
                      {appointment.patientName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--copy-body)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={14} />
                        {appointment.timeLabel}
                      </span>
                      <span className="text-[var(--copy-muted)]">/</span>
                      <span>{appointment.typeLabel}</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${appointment.statusTone.badge}`}>
                    {appointment.statusMeta.shortLabel}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-[var(--copy-body)]">
                  {appointment.procedureLabel}
                </p>

                <div className="mt-3 rounded-xl border border-[var(--border-soft)] bg-white/80 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copy-muted)]">
                    Próximo passo
                  </p>
                  <p className="mt-1 text-sm text-[var(--copy-body)]">
                    {appointment.nextAction}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="page-shell-panel rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--surface-panel-strong)] text-[var(--color-primary-700)]">
              <CalendarClock size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--copy-strong)]">
                Confirmações importantes
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {highlightedConfirmations.length === 0 ? (
              <div className="page-muted-panel rounded-2xl border border-dashed px-4 py-5 text-sm text-[var(--copy-body)]">
                Nenhuma confirmação crítica no momento.
              </div>
            ) : (
              highlightedConfirmations.map((appointment) => {
                const meta = getOperationalStatusMeta(appointment);
                const tone = getOperationalToneClasses(appointment);

                return (
                  <div key={appointment.id} className={`rounded-2xl border p-4 ${tone.panel}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--copy-strong)]">
                          {appointment.patientName}
                        </p>
                        <p className="mt-1 text-sm text-[var(--copy-body)]">
                          {appointment.dateLabel} às {appointment.timeLabel}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[var(--copy-body)]">
                      {getOperationalNextAction(appointment)}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--copy-muted)]">
                      <CheckCircle2 size={14} />
                      {appointment.confirmationHandledAt ? 'Solicitação tratada' : 'Solicitação aberta'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Button type="button" variant="secondary" size="sm" className="mt-4 w-full" icon={MoveRight} onClick={onOpenCalendar}>
            Abrir e ajustar agenda
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default OperationalAgendaPanel;
