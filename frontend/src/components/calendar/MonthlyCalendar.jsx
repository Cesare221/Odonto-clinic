import { useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const ACTION_REQUIRED_STATUSES = ['pendente', 'remarcar', 'recusado'];

function isActionRequired(appointment) {
  return ACTION_REQUIRED_STATUSES.includes(appointment?.statusConfirmacao);
}

function getMonthStart(dateObj) {
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
}

function getMonthGrid(referenceDate) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function formatMonthLabel(dateObj) {
  return dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function toLocalDateKey(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayIdFromDate(dateObj) {
  const jsDay = dateObj.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function isSameLocalDate(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function getDayMetrics(appointments, dateObj) {
  const dateKey = toLocalDateKey(dateObj);
  const dayId = getDayIdFromDate(dateObj);

  const appointmentsForDate = appointments.filter((appointment) => {
    if (appointment.appointmentDate) {
      return appointment.appointmentDate === dateKey;
    }

    if (appointment.date) {
      const legacyDate = new Date(appointment.date);
      return !Number.isNaN(legacyDate.getTime()) && isSameLocalDate(legacyDate, dateObj);
    }

    return Number(appointment.day) === dayId;
  });

  const confirmedCount = appointmentsForDate.filter((appointment) => appointment.statusConfirmacao === 'confirmado').length;
  const pendingCount = appointmentsForDate.filter(isActionRequired).length;

  return {
    count: appointmentsForDate.length,
    confirmedCount,
    pendingCount,
    firstAppointment: appointmentsForDate
      .slice()
      .sort((a, b) => Number(a.start) - Number(b.start))[0] || null,
  };
}

function getDensityLabel(count) {
  if (count >= 6) {
    return 'Alta';
  }
  if (count >= 3) {
    return 'Média';
  }
  if (count >= 1) {
    return 'Leve';
  }
  return 'Livre';
}

const MonthlyCalendar = ({ appointments, selectedDate, onSelectDate, currentMonth, onMonthChange }) => {
  const monthIndex = currentMonth.getMonth();
  const monthDays = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);
  const dayMetricsByDate = useMemo(() => {
    return monthDays.reduce((acc, dateObj) => {
      acc[toLocalDateKey(dateObj)] = getDayMetrics(appointments, dateObj);
      return acc;
    }, {});
  }, [appointments, monthDays]);

  const handlePrevMonth = () => {
    onMonthChange(getMonthStart(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)));
  };

  const handleNextMonth = () => {
    onMonthChange(getMonthStart(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)));
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:rounded-[28px]">
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] px-3 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold capitalize text-slate-900 sm:text-xl">{formatMonthLabel(currentMonth)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="Mês anterior"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="Próximo mês"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
        {WEEK_LABELS.map((label) => (
          <div key={label} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:py-3 sm:text-xs">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthDays.map((dateObj) => {
          const dateKey = toLocalDateKey(dateObj);
          const metrics = dayMetricsByDate[dateKey] || { count: 0, confirmedCount: 0, pendingCount: 0, firstAppointment: null };
          const isSelected = isSameLocalDate(dateObj, selectedDate);
          const isFromCurrentMonth = dateObj.getMonth() === monthIndex;
          const densityLabel = getDensityLabel(metrics.count);

          return (
            <button
              key={dateObj.toISOString()}
              type="button"
              onClick={() => onSelectDate(dateObj)}
              className={`min-h-[76px] border-b border-r border-slate-100 p-1.5 text-left transition-all hover:bg-primary-50/40 sm:min-h-[120px] sm:p-3 ${isSelected ? 'bg-primary-50 ring-1 ring-inset ring-primary-300 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.16)]' : 'bg-white'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-sm font-semibold ${isFromCurrentMonth ? 'text-slate-800' : 'text-slate-300'}`}>
                  {dateObj.getDate()}
                </span>
                <span className={`hidden rounded-full px-2 py-1 text-[10px] font-semibold sm:inline-flex ${metrics.count ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {densityLabel}
                </span>
              </div>

              <div className="mt-2 space-y-1.5 sm:mt-4 sm:space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{metrics.count}</span>
                  <span className="hidden sm:inline">{metrics.count === 1 ? 'consulta' : 'consultas'}</span>
                </div>

                {metrics.count > 0 ? (
                  <>
                    <div className="hidden flex-wrap gap-1.5 sm:flex">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        {metrics.confirmedCount} conf.
                      </span>
                      {metrics.pendingCount > 0 && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                          {metrics.pendingCount} ação
                        </span>
                      )}
                    </div>
                    <p className="hidden text-xs leading-5 text-slate-500 sm:line-clamp-2">
                      Início às {metrics.firstAppointment ? `${String(Math.floor(Number(metrics.firstAppointment.start))).padStart(2, '0')}:${Number(metrics.firstAppointment.start) % 1 === 0.5 ? '30' : '00'}` : '--:--'}
                    </p>
                  </>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyCalendar;
