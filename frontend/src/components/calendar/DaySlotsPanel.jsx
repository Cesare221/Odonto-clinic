import { useMemo } from 'react';
import { CalendarRange, Clock, Plus } from 'lucide-react';
import { CLINIC_HOURS } from '../../constants';
import Button from '../ui/Button';

function formatHour(decimalHour) {
  const hour = Math.floor(Number(decimalHour));
  const minute = Number(decimalHour) % 1 === 0.5 ? '30' : '00';
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function getSlots() {
  const step = CLINIC_HOURS.slotDuration / 60;
  const totalSlots = (CLINIC_HOURS.end - CLINIC_HOURS.start) / step;
  return Array.from({ length: totalSlots }, (_, i) => CLINIC_HOURS.start + (i * step));
}

function buildTimelineRows(appointments, slots) {
  const step = CLINIC_HOURS.slotDuration / 60;

  return slots.reduce((rows, slot) => {
    const appointment = appointments.find((item) => {
      const start = Number(item.start);
      const end = start + Number(item.duration);
      return slot >= start && slot < end;
    });

    const previousRow = rows[rows.length - 1];

    if (!appointment) {
      if (previousRow && previousRow.kind === 'open' && Math.abs(previousRow.end - slot) < 0.001) {
        previousRow.end = slot + step;
        previousRow.slots += 1;
      } else {
        rows.push({
          id: `open-${slot}`,
          kind: 'open',
          start: slot,
          end: slot + step,
          slots: 1,
        });
      }

      return rows;
    }

    if (previousRow && previousRow.kind === 'appointment' && previousRow.appointment === appointment) {
      previousRow.end = slot + step;
      previousRow.slots += 1;
      return rows;
    }

    rows.push({
      id: appointment.id || appointment._id || `appt-${slot}`,
      kind: 'appointment',
      start: Number(appointment.start),
      end: Number(appointment.start) + Number(appointment.duration),
      slots: Math.max(1, Math.round(Number(appointment.duration) / step)),
      appointment,
    });
    return rows;
  }, []);
}

const DaySlotsPanel = ({
  selectedDate,
  appointments,
  openSlots = 0,
  occupiedSlots = 0,
  totalSlots = 0,
  onCreateAtSlot,
  onSelectAppointment,
  getConfirmationStatusUi,
}) => {
  const slots = useMemo(() => getSlots(), []);
  const timelineRows = useMemo(() => buildTimelineRows(appointments, slots), [appointments, slots]);

  return (
    <div className="flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:rounded-[28px]">
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Operação do dia</h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-slate-900 px-3 py-1.5 text-white">{appointments.length} consultas</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">{openSlots} slots livres</span>
            <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-700">{occupiedSlots}/{totalSlots} ocupados</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-slate-50/40 p-3 sm:p-4">
        {timelineRows.map((row) => {
          if (row.kind === 'open') {
            return (
              <div key={row.id} className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-3 sm:p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CalendarRange size={16} />
                      <p className="text-sm font-semibold">
                        Janela livre de {formatHour(row.start)} até {formatHour(row.end)}
                      </p>
                    </div>
                  </div>
                  <Button className="w-full sm:w-auto" variant="secondary" size="sm" icon={Plus} onClick={() => onCreateAtSlot(row.start)}>
                    Agendar aqui
                  </Button>
                </div>
              </div>
            );
          }

          const appointment = row.appointment;
          const confirmationStatus = getConfirmationStatusUi
            ? getConfirmationStatusUi(appointment?.statusConfirmacao)
            : { label: 'Pendente', classes: 'bg-slate-100 text-slate-700 border-slate-200' };

          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelectAppointment?.(appointment)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 sm:p-4"
              aria-label={`Abrir detalhes da consulta ${appointment.title} às ${formatHour(appointment.start)}`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock size={15} className="text-slate-400" />
                    <p className="text-sm font-semibold">
                      {formatHour(row.start)} até {formatHour(row.end)}
                    </p>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                      Ocupado
                    </span>
                  </div>
                  <p className="mt-2 truncate text-base font-semibold text-slate-900">{appointment.title}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${confirmationStatus.classes}`}>
                    {confirmationStatus.label}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Início {formatHour(appointment.start)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {!timelineRows.length && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            Nenhum slot encontrado para este dia.
          </div>
        )}
      </div>
    </div>
  );
};

export default DaySlotsPanel;
