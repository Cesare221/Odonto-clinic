import { CalendarClock, CheckCircle2, Clock3, Plus } from 'lucide-react';
import Button from '../ui/Button';
import { getAppointmentProcedureLabel } from '../../utils/appointmentDisplay';

function formatDateLong(dateObj) {
  return dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatHour(decimalHour) {
  const hour = Math.floor(Number(decimalHour));
  const minute = Number(decimalHour) % 1 === 0.5 ? '30' : '00';
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function getLoadTone(occupancyRate) {
  if (occupancyRate >= 0.85) {
    return {
      label: 'Agenda intensa',
      classes: 'bg-rose-100 text-rose-700 border-rose-200',
    };
  }

  if (occupancyRate >= 0.5) {
    return {
      label: 'Fluxo equilibrado',
      classes: 'bg-amber-100 text-amber-700 border-amber-200',
    };
  }

  return {
    label: 'Boa margem para encaixe',
    classes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
}

const AgendaSummaryRail = ({
  selectedDate,
  appointments,
  pendingCount,
  confirmedCount,
  openSlots,
  occupiedSlots,
  totalSlots,
  nextOpenWindow,
  onQuickCreate,
}) => {
  const occupancyRate = totalSlots > 0 ? occupiedSlots / totalSlots : 0;
  const loadTone = getLoadTone(occupancyRate);

  return (
    <aside className="rounded-[24px] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(236,253,245,0.85),_rgba(255,255,255,0.96)_45%,_rgba(248,250,252,1)_100%)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Painel do dia</p>
          <h3 className="mt-2 text-xl font-semibold capitalize text-slate-900">{formatDateLong(selectedDate)}</h3>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Consultas</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{appointments.length}</p>
          <p className="mt-1 text-sm text-slate-500">ocupando {occupiedSlots} slots do dia</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Disponibilidade</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{openSlots}</p>
          <p className="mt-1 text-sm text-slate-500">slots livres para encaixe</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Capacidade operacional</p>
            <p className="mt-2 text-sm text-slate-600">
              {occupiedSlots} de {totalSlots} slots ocupados no expediente.
            </p>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${loadTone.classes}`}>
            {loadTone.label}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#14b8a6,#0f766e)]"
            style={{ width: `${Math.max(8, Math.min(100, occupancyRate * 100))}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <p className="text-sm font-semibold">Confirmações</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600 sm:gap-3">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              {confirmedCount} confirmadas
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
              {pendingCount} pendentes
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock3 size={16} className="text-sky-600" />
            <p className="text-sm font-semibold">Melhor janela livre</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {nextOpenWindow
              ? `${formatHour(nextOpenWindow.start)} até ${formatHour(nextOpenWindow.end)} com ${nextOpenWindow.durationLabel} livres.`
              : 'Sem janela livre relevante neste dia.'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <CalendarClock size={16} className="text-violet-600" />
            <p className="text-sm font-semibold">Próximos procedimentos</p>
          </div>
          {appointments.length ? (
            <div className="mt-3 space-y-3">
              {appointments.slice(0, 4).map((appointment) => (
                <div key={appointment.id || appointment._id} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">{getAppointmentProcedureLabel(appointment)}</p>
                    <span className="text-xs font-semibold text-slate-500">{formatHour(appointment.start)}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{appointment.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">Sem consultas.</p>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
        <p className="text-sm font-semibold text-emerald-900">Ação rápida</p>
        <Button
          variant="primary"
          size="sm"
          className="mt-4 w-full"
          icon={Plus}
          onClick={() => onQuickCreate?.(nextOpenWindow?.start)}
        >
          Encaixe rápido
        </Button>
      </div>
    </aside>
  );
};

export default AgendaSummaryRail;
