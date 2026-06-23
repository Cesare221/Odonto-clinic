import React, { useMemo, useState } from 'react';
import { Plus, Clock, Calendar as CalendarIcon, Trash2, CheckCircle2, CircleDashed, Stethoscope, ExternalLink } from 'lucide-react';
import { DAYS_OF_WEEK, CLINIC_HOURS } from '../../constants';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import MonthlyCalendar from './MonthlyCalendar';
import DaySlotsPanel from './DaySlotsPanel';
import AgendaSummaryRail from './AgendaSummaryRail';
import { computeWeeklyAppointmentLayout } from './calendarLayout.helpers.js';
import { generateConfirmationLink } from '../../services/appointmentsService';
import { resolveWhatsAppDestination, WHATSAPP_HOMOLOGATION_FALLBACK_PHONE } from '../../utils/whatsapp';
import { getOperationalNextAction, getOperationalStatusMeta, getOperationalToneClasses } from '../../utils/operationalStatus';
import { getAppointmentProcedureLabel } from '../../utils/appointmentDisplay';
import { toast } from 'sonner';

const procedureStyleMap = {
  eval: { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd', label: 'Avaliação' },
  routine: { bg: '#ccfbf1', text: '#0d9488', border: '#99f6e4', label: 'Rotina' },
  surgery: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5', label: 'Cirurgia' },
  ortho: { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd', label: 'Ortodontia' },
  aesthetic: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d', label: 'Estética' },
  emergency: { bg: '#fee2e2', text: '#dc2626', border: '#ef4444', label: 'Emergência' },
};

const ACTION_REQUIRED_STATUSES = ['pendente', 'remarcar', 'recusado'];
const WEEK_SLOT_HEIGHT_PX = 40;
const WEEK_APPOINTMENT_VERTICAL_INSET_PX = 2;

function isActionRequired(appointment) {
  return ACTION_REQUIRED_STATUSES.includes(appointment?.statusConfirmacao);
}

function getWeekDates(referenceDate) {
  const baseDate = referenceDate || new Date();
  const day = baseDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diff);

  return DAYS_OF_WEEK.slice(0, 5).map((d, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return { ...d, dateObj: date, dateStr: date.toLocaleDateString('pt-BR') };
  });
}

function isToday(dateObj) {
  const today = new Date();
  return dateObj.getDate() === today.getDate()
    && dateObj.getMonth() === today.getMonth()
    && dateObj.getFullYear() === today.getFullYear();
}

function isSameLocalDate(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function getDayIdFromDate(dateObj) {
  const jsDay = dateObj.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function toLocalDateKey(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayIdFromDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return getDayIdFromDate(parsedDate);
}

function formatHour(decimalHour) {
  const hour = Math.floor(Number(decimalHour));
  const minute = Number(decimalHour) % 1 === 0.5 ? '30' : '00';
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function getSlotStep() {
  return CLINIC_HOURS.slotDuration / 60;
}

function getBookableSlots() {
  const step = getSlotStep();
  const totalSlots = (CLINIC_HOURS.end - CLINIC_HOURS.start) / step;
  return Array.from({ length: totalSlots }, (_, index) => CLINIC_HOURS.start + (index * step));
}

function getHourLabels() {
  return Array.from(
    { length: CLINIC_HOURS.end - CLINIC_HOURS.start },
    (_, index) => CLINIC_HOURS.start + index
  );
}

function getOccupiedSlotsCount(appointments) {
  const step = getSlotStep();

  return appointments.reduce((total, appointment) => {
    const duration = Number(appointment.duration) || 0;
    return total + Math.max(1, Math.round(duration / step));
  }, 0);
}

function getFreeWindows(appointments) {
  const slots = getBookableSlots();
  const step = getSlotStep();

  return slots.reduce((windows, slot) => {
    const isOccupied = appointments.some((appointment) => {
      const start = Number(appointment.start);
      const end = start + Number(appointment.duration);
      return slot >= start && slot < end;
    });

    if (isOccupied) {
      return windows;
    }

    const lastWindow = windows[windows.length - 1];
    if (lastWindow && Math.abs(lastWindow.end - slot) < 0.001) {
      lastWindow.end = slot + step;
      lastWindow.slots += 1;
      return windows;
    }

    windows.push({
      start: slot,
      end: slot + step,
      slots: 1,
    });
    return windows;
  }, []);
}

function getWindowDurationLabel(window) {
  if (!window) {
    return '';
  }

  const totalMinutes = window.slots * CLINIC_HOURS.slotDuration;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) {
    return `${hours}h${String(minutes).padStart(2, '0')}`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${minutes}min`;
}

function isValidObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

function getDateFromKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getClampedDateInMonth(referenceDate, monthDate) {
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const day = Math.min(referenceDate.getDate(), daysInMonth);
  return new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
}

function hasConflict(appointments, start, duration) {
  const nextStart = Number(start);
  const nextEnd = nextStart + Number(duration);

  return appointments.some((appointment) => {
    const currentStart = Number(appointment.start);
    const currentEnd = currentStart + Number(appointment.duration);
    return nextStart < currentEnd && nextEnd > currentStart;
  });
}

const CalendarView = ({ appointments, patients = [], onAddAppointment, onDeleteAppointment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [isSendingConfirmation, setIsSendingConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState('semanal');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [newAppt, setNewAppt] = useState({
    title: '',
    patientId: '',
    day: 1,
    start: 9,
    duration: 1,
    type: 'routine',
    appointmentDate: null,
  });

  const weekDays = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const patientOptions = useMemo(
    () => (patients || []).map((patient) => ({
      id: String(patient?._id || patient?.id),
      name: patient?.name || 'Paciente',
      phone: patient?.phone || '',
    })),
    [patients]
  );

  const hours = useMemo(() => getHourLabels(), []);
  const bookableSlots = useMemo(() => getBookableSlots(), []);

  const defaultHourForNewAppointment = (() => {
    const currentHour = new Date().getHours();
    return currentHour >= CLINIC_HOURS.start && currentHour < CLINIC_HOURS.end
      ? currentHour
      : CLINIC_HOURS.start;
  })();

  const doesAppointmentMatchDate = (appointment, dateObj) => {
    const dateKey = toLocalDateKey(dateObj);

    if (appointment.appointmentDate) {
      return appointment.appointmentDate === dateKey;
    }

    if (appointment.date) {
      const legacyDate = new Date(appointment.date);
      return !Number.isNaN(legacyDate.getTime()) && isSameLocalDate(legacyDate, dateObj);
    }

    return Number(appointment.day) === getDayIdFromDate(dateObj);
  };

  const dayAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => doesAppointmentMatchDate(appointment, selectedDate))
      .sort((a, b) => Number(a.start) - Number(b.start));
  }, [appointments, selectedDate]);
  const totalBookableSlots = bookableSlots.length;
  const occupiedSlots = useMemo(() => getOccupiedSlotsCount(dayAppointments), [dayAppointments]);
  const openSlots = Math.max(totalBookableSlots - occupiedSlots, 0);
  const pendingCount = dayAppointments.filter(isActionRequired).length;
  const confirmedCount = dayAppointments.filter((appointment) => appointment.statusConfirmacao === 'confirmado').length;
  const freeWindows = useMemo(() => getFreeWindows(dayAppointments), [dayAppointments]);
  const nextOpenWindow = freeWindows
    .slice()
    .sort((a, b) => b.slots - a.slots || a.start - b.start)[0];

  const openCreateModal = (day, hour, appointmentDate = null) => {
    if (!patientOptions.length) {
      toast.info('Cadastre pelo menos um paciente antes de criar um agendamento.');
      return;
    }

    setSelectedAppt(null);
    setNewAppt({
      title: '',
      patientId: patientOptions[0]?.id || '',
      day: day || 1,
      start: hour ?? 9,
      duration: 1,
      type: 'routine',
      appointmentDate,
    });
    setIsModalOpen(true);
  };

  const openCreateModalForDate = (dateObj, hour) => {
    openCreateModal(getDayIdFromDate(dateObj), hour, toLocalDateKey(dateObj));
  };

  const handleNewApptDayChange = (dayValue) => {
    const numericDay = Number(dayValue);
    const matchedWeekDay = weekDays.find((day) => day.id === numericDay);

    setNewAppt((current) => ({
      ...current,
      day: numericDay,
      appointmentDate: matchedWeekDay ? toLocalDateKey(matchedWeekDay.dateObj) : current.appointmentDate,
    }));
  };

  const handleSelectDate = (dateObj) => {
    setSelectedDate(dateObj);
    setCurrentMonth(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1));
    setActiveTab('semanal'); // Muda automaticamente para a visualização semanal
  };

  const handleMonthChange = (monthDate) => {
    setCurrentMonth(monthDate);
    setSelectedDate((currentSelectedDate) => getClampedDateInMonth(currentSelectedDate, monthDate));
  };

  const handleCellClick = (dayId, hour, appointmentDate = null) => {
    openCreateModal(dayId, hour, appointmentDate);
  };

  const handleQuickCreate = (slot) => {
    openCreateModalForDate(selectedDate, slot ?? defaultHourForNewAppointment);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const selectedPatient = patientOptions.find((patient) => patient.id === String(newAppt.patientId));
    if (!selectedPatient) {
      toast.error('Selecione um paciente válido para criar o agendamento.');
      return;
    }

    const style = procedureStyleMap[newAppt.type] || procedureStyleMap.routine;
    const normalizedAppointmentDate = newAppt.appointmentDate || undefined;
    const dayFromAppointmentDate = normalizedAppointmentDate
      ? getDayIdFromDateKey(normalizedAppointmentDate)
      : null;
    const targetDate = normalizedAppointmentDate
      ? getDateFromKey(normalizedAppointmentDate)
      : weekDays.find((day) => day.id === Number(newAppt.day))?.dateObj;
    const targetAppointments = targetDate
      ? appointments.filter((appointment) => doesAppointmentMatchDate(appointment, targetDate))
      : appointments.filter((appointment) => Number(appointment.day) === Number(newAppt.day));

    const explicitTitle = String(newAppt.title || '').trim();
    const title = explicitTitle || `${style.label} - ${selectedPatient.name}`;

    if (hasConflict(targetAppointments, Number(newAppt.start), Number(newAppt.duration))) {
      toast.error(`Já existe uma consulta ocupando esse horário em ${normalizedAppointmentDate || 'dia selecionado'}.`);
      return;
    }

    const result = await onAddAppointment({
      ...newAppt,
      title,
      patientId: selectedPatient.id,
      day: dayFromAppointmentDate ?? Number(newAppt.day),
      start: Number(newAppt.start),
      duration: Number(newAppt.duration),
      appointmentDate: normalizedAppointmentDate,
      patientPhone: selectedPatient.phone,
      color: style,
      procedure: style.label,
    });

    if (!result?.success) {
      return;
    }

    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedAppt) return;

    const result = await onDeleteAppointment(selectedAppt.id);
    if (result?.success) {
      setSelectedAppt(null);
    }
  };

  const sendConfirmationWhatsApp = async (appointment) => {
    if (isSendingConfirmation) return;
    setIsSendingConfirmation(true);

    const phoneRaw = appointment?.patient?.phone || appointment?.patientPhone || '';
    const { phone, usingFallbackPhone } = resolveWhatsAppDestination(
      phoneRaw,
      WHATSAPP_HOMOLOGATION_FALLBACK_PHONE
    );

    const appointmentId = appointment?._id || appointment?.id;
    if (!isValidObjectId(String(appointmentId || ''))) {
      toast.error('Este agendamento ainda está local e não possui ID do servidor para gerar link.');
      toast.info('Para gerar o link de confirmação, o agendamento precisa ser salvo no backend.');
      setIsSendingConfirmation(false);
      return;
    }

    try {
      const response = await generateConfirmationLink(appointmentId);
      const confirmationUrl = response?.url;

      if (!confirmationUrl) {
        toast.error('Não foi possível gerar o link de confirmação.');
        return;
      }

      const dateText = appointment.appointmentDate
        ? new Date(`${appointment.appointmentDate}T00:00:00`).toLocaleDateString('pt-BR')
        : selectedDate.toLocaleDateString('pt-BR');
      const timeText = formatHour(appointment.start);
      const patientName = appointment?.patient?.name || appointment?.title || 'paciente';
      const procedure = getAppointmentProcedureLabel(appointment);
      const message = [
        `Olá, ${patientName}.`,
        'Aqui é da CliniDent.',
        `Procedimento: ${procedure}.`,
        `Data: ${dateText} às ${timeText}.`,
        `Use este link para confirmar sua presença ou solicitar a remarcação: ${confirmationUrl}`,
      ].join(' ');

      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(confirmationUrl);
          toast.success('Link de confirmação copiado.');
        } catch {
          // Clipboard can fail on insecure contexts; ignore silently.
        }
      }

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      if (usingFallbackPhone) {
        toast.info('Paciente sem telefone. Envio realizado para o número de homologação 62982623408.');
      }
      toast.success('WhatsApp aberto com a mensagem de confirmação.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Falha ao enviar confirmação por WhatsApp.');
    } finally {
      setIsSendingConfirmation(false);
    }
  };

  const getConfirmationStatusUi = (status) => {
    if (status === 'confirmado') {
      return { label: 'Confirmado', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (status === 'recusado') {
      return { label: 'Cancelado', classes: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (status === 'remarcar') {
      return { label: 'Remarcação solicitada', classes: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'Pendente', classes: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const selectedOperationalMeta = selectedAppt ? getOperationalStatusMeta(selectedAppt) : null;
  const selectedOperationalTone = selectedAppt ? getOperationalToneClasses(selectedAppt) : null;
  const selectedNextAction = selectedAppt?.nextAction || (selectedAppt ? getOperationalNextAction(selectedAppt) : '');
  const selectedPatientName = selectedAppt?.patient?.name || selectedAppt?.title || 'Paciente';
  const selectedProcedureLabel = getAppointmentProcedureLabel(selectedAppt);

  return (
    <>
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(241,247,255,0.98))] shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:rounded-[30px]">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.72),_rgba(255,255,255,0.96)_42%,_rgba(244,249,255,1)_100%)] px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
              <h2 className="flex items-center gap-3 text-xl font-bold text-slate-800 sm:text-2xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 shadow-sm">
                  <CalendarIcon size={20} className="text-primary-600" />
                </div>
                Agenda
              </h2>
              <a
                href="/agendamento"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100 hover:border-primary-300"
              >
                <ExternalLink size={16} />
                Link de Agendamento Público
              </a>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Stethoscope size={15} />
                    <span className="text-xs font-semibold uppercase tracking-wide">Dia selecionado</span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{dayAppointments.length}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Confirmadas</span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{confirmedCount}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CircleDashed size={15} className="text-amber-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Pendências</span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{pendingCount}</p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 self-start sm:w-auto sm:flex-row sm:items-center xl:self-auto">
                <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setActiveTab('mensal')}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'mensal' ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('semanal')}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'semanal' ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Semanal
                  </button>
                </div>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (activeTab === 'mensal') {
                      openCreateModalForDate(selectedDate, defaultHourForNewAppointment);
                      return;
                    }

                    const selectedWeekDay = weekDays.find((d) => isSameLocalDate(d.dateObj, selectedDate));
                    const todayWeekDay = weekDays.find((d) => isToday(d.dateObj));
                    const targetDay = selectedWeekDay || todayWeekDay || weekDays[0];
                    openCreateModal(targetDay.id, defaultHourForNewAppointment, toLocalDateKey(targetDay.dateObj));
                  }}
                  variant="primary"
                  icon={Plus}
                >
                  Nova Consulta
                </Button>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'mensal' ? (
          <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto bg-slate-50/60 p-3 sm:gap-5 sm:p-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)] 2xl:grid-cols-[minmax(0,1.9fr)_minmax(360px,0.9fr)]">
            <div className="space-y-4 sm:space-y-5">
              <MonthlyCalendar
                appointments={appointments}
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
              <DaySlotsPanel
                selectedDate={selectedDate}
                appointments={dayAppointments}
                openSlots={openSlots}
                occupiedSlots={occupiedSlots}
                totalSlots={totalBookableSlots}
                onCreateAtSlot={(slot) => openCreateModalForDate(selectedDate, slot)}
                onSelectAppointment={setSelectedAppt}
                getConfirmationStatusUi={getConfirmationStatusUi}
              />
            </div>
            <AgendaSummaryRail
              selectedDate={selectedDate}
              appointments={dayAppointments}
              pendingCount={pendingCount}
              confirmedCount={confirmedCount}
              openSlots={openSlots}
              occupiedSlots={occupiedSlots}
              totalSlots={totalBookableSlots}
              nextOpenWindow={nextOpenWindow ? { ...nextOpenWindow, durationLabel: getWindowDurationLabel(nextOpenWindow) } : null}
              onQuickCreate={handleQuickCreate}
            />
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto bg-slate-50/60 p-3 sm:gap-5 sm:p-5 2xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,0.95fr)]">
            <div className="space-y-3 lg:hidden">
              <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Escolha o dia da semana
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {weekDays.map((day) => {
                    const dayAppointmentsInWeek = appointments
                      .filter((app) => doesAppointmentMatchDate(app, day.dateObj))
                      .sort((a, b) => Number(a.start) - Number(b.start));
                    const isSelectedDay = isSameLocalDate(day.dateObj, selectedDate);
                    const pendingForDay = dayAppointmentsInWeek.filter(isActionRequired).length;

                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleSelectDate(day.dateObj)}
                        className={`rounded-2xl border p-3 text-left transition-colors ${
                          isSelectedDay
                            ? 'border-primary-300 bg-primary-50 text-primary-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-sm font-semibold">{day.name}</span>
                        <span className="mt-1 block text-xs text-slate-500">{day.dateStr}</span>
                        <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {dayAppointmentsInWeek.length} agend.
                        </span>
                        {pendingForDay > 0 && (
                          <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            {pendingForDay} acao
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:block">
              <div className="flex min-w-[980px]">
                <div className="sticky left-0 z-20 w-20 flex-shrink-0 border-r border-slate-200 bg-white">
                  <div className="h-[88px] border-b border-slate-200 bg-slate-50/70"></div>
                  {hours.map((hour) => (
                    <div key={hour} className="relative h-20 border-b border-slate-100">
                      <span className="absolute -top-3 right-3 text-xs font-medium text-slate-400">
                        {`${hour}:00`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid flex-1 grid-cols-5">
                  {weekDays.map((day) => {
                    const dayAppointmentsInWeek = appointments
                      .filter((app) => doesAppointmentMatchDate(app, day.dateObj))
                      .sort((a, b) => Number(a.start) - Number(b.start));
                    const isSelectedDay = isSameLocalDate(day.dateObj, selectedDate);
                    const pendingForDay = dayAppointmentsInWeek.filter(isActionRequired).length;

                    return (
                      <div
                        key={day.id}
                        className={`border-r border-slate-200 last:border-r-0 ${isSelectedDay ? 'bg-primary-50/30' : 'bg-white'}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectDate(day.dateObj)}
                          className={`sticky top-0 z-10 flex h-[88px] w-full flex-col items-start justify-center border-b border-slate-200 px-4 text-left transition-colors ${isSelectedDay ? 'bg-white' : 'bg-gradient-to-b from-slate-50 to-white hover:bg-slate-50'}`}
                        >
                          <span className="text-sm font-semibold text-slate-700">{day.name}</span>
                          <span className={`mt-1 text-xs font-medium ${isToday(day.dateObj) ? 'text-primary-600' : 'text-slate-400'}`}>
                            {day.dateStr}
                          </span>
                          <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold">
                            <span className={`rounded-full px-2.5 py-1 ${dayAppointmentsInWeek.length ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {dayAppointmentsInWeek.length} agend.
                            </span>
                            {pendingForDay > 0 && (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                                {pendingForDay} ação
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="relative">
                          {hours.map((hour) => (
                            <React.Fragment key={hour}>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectDate(day.dateObj);
                                  handleCellClick(day.id, hour, toLocalDateKey(day.dateObj));
                                }}
                                className="h-10 w-full cursor-pointer border-b border-slate-100 transition-colors hover:bg-primary-50/60 focus:outline-none focus-visible:bg-primary-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-300"
                                aria-label={`Agendar em ${day.name} as ${formatHour(hour)}`}
                              ></button>
                              {hour + 0.5 <= CLINIC_HOURS.end && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectDate(day.dateObj);
                                    handleCellClick(day.id, hour + 0.5, toLocalDateKey(day.dateObj));
                                  }}
                                  className="h-10 w-full cursor-pointer border-b border-dashed border-slate-200 transition-colors hover:bg-primary-50/60 focus:outline-none focus-visible:bg-primary-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-300"
                                  aria-label={`Agendar em ${day.name} as ${formatHour(hour + 0.5)}`}
                                ></button>
                              )}
                            </React.Fragment>
                          ))}

                          {dayAppointmentsInWeek.map((appointment) => {
                            const { topOffsetPx, heightPx } = computeWeeklyAppointmentLayout({
                              appointment,
                              clinicStartHour: CLINIC_HOURS.start,
                              slotDurationMinutes: CLINIC_HOURS.slotDuration,
                              slotHeightPx: WEEK_SLOT_HEIGHT_PX,
                              verticalInsetPx: WEEK_APPOINTMENT_VERTICAL_INSET_PX,
                            });
                            const style = appointment.color || procedureStyleMap.routine;
                            const confirmationUi = getConfirmationStatusUi(appointment.statusConfirmacao);

                            return (
                              <button
                                type="button"
                                key={appointment.id || appointment._id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleSelectDate(day.dateObj);
                                  setSelectedAppt(appointment);
                                }}
                                className="absolute left-2 right-2 overflow-hidden rounded-2xl border p-3 text-left shadow-[0_14px_34px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                                style={{
                                  top: `${topOffsetPx}px`,
                                  height: `${heightPx}px`,
                                  zIndex: 10,
                                  background: `linear-gradient(180deg, ${style.bg}, #ffffff)`,
                                  color: style.text,
                                  borderColor: style.border,
                                  boxShadow: `inset 0 0 0 1px ${style.border}`,
                                }}
                                aria-label={`Abrir consulta ${appointment.title} em ${day.name} as ${formatHour(appointment.start)}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-bold" style={{ color: style.text }}>{appointment.title}</p>
                                    <p className="mt-1 truncate text-[11px] opacity-80" style={{ color: style.text }}>
                                      {getAppointmentProcedureLabel(appointment)}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold" style={{ color: style.text }}>
                                    {formatHour(appointment.start)}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <p className="flex items-center gap-1 text-[10px] opacity-80" style={{ color: style.text }}>
                                    <Clock size={10} /> {appointment.duration}h
                                  </p>
                                  <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${confirmationUi.classes}`}>
                                    {confirmationUi.label}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <AgendaSummaryRail
                selectedDate={selectedDate}
                appointments={dayAppointments}
                pendingCount={pendingCount}
                confirmedCount={confirmedCount}
                openSlots={openSlots}
                occupiedSlots={occupiedSlots}
                totalSlots={totalBookableSlots}
                nextOpenWindow={nextOpenWindow ? { ...nextOpenWindow, durationLabel: getWindowDurationLabel(nextOpenWindow) } : null}
                onQuickCreate={handleQuickCreate}
              />
              <DaySlotsPanel
                selectedDate={selectedDate}
                appointments={dayAppointments}
                openSlots={openSlots}
                occupiedSlots={occupiedSlots}
                totalSlots={totalBookableSlots}
                onCreateAtSlot={(slot) => openCreateModalForDate(selectedDate, slot)}
                onSelectAppointment={setSelectedAppt}
                getConfirmationStatusUi={getConfirmationStatusUi}
              />
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar consulta" size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <Select
            label="Paciente"
            value={newAppt.patientId}
            required
            onChange={(event) => setNewAppt({ ...newAppt, patientId: event.target.value })}
          >
            <option value="" disabled>Selecione um paciente</option>
            {patientOptions.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}{patient.phone ? ` - ${patient.phone}` : ''}
              </option>
            ))}
          </Select>

          <Input
            label="Descrição (opcional)"
            placeholder="Ex.: retorno de avaliação"
            value={newAppt.title}
            onChange={(event) => setNewAppt({ ...newAppt, title: event.target.value })}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Dia da semana"
              value={newAppt.day}
              onChange={(event) => handleNewApptDayChange(event.target.value)}
            >
              {weekDays.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.name} - {day.dateStr}
                </option>
              ))}
            </Select>
            <Select
              label="Horário"
              value={newAppt.start}
              onChange={(event) => setNewAppt({ ...newAppt, start: event.target.value })}
            >
              {bookableSlots.map((slot) => (
                <option key={slot} value={slot}>{formatHour(slot)}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Duração"
              value={newAppt.duration}
              onChange={(event) => setNewAppt({ ...newAppt, duration: event.target.value })}
            >
              <option value={0.5}>30 minutos</option>
              <option value={1}>1 hora</option>
              <option value={1.5}>1h 30min</option>
              <option value={2}>2 horas</option>
            </Select>
            <Select
              label="Tipo de procedimento"
              value={newAppt.type}
              onChange={(event) => setNewAppt({ ...newAppt, type: event.target.value })}
            >
              <option value="eval">Avaliação</option>
              <option value="routine">Rotina</option>
              <option value="surgery">Cirurgia</option>
              <option value="ortho">Ortodontia</option>
              <option value="aesthetic">Estética</option>
              <option value="emergency">Emergência</option>
            </Select>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar na Agenda
            </Button>
          </div>
        </form>
      </Modal>

      {selectedAppt && (
        <Modal isOpen={!!selectedAppt} onClose={() => setSelectedAppt(null)} title={selectedPatientName} size="md">
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Consulta programada</p>
              <p className="text-base font-semibold text-slate-800">{selectedProcedureLabel}</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <CalendarIcon size={20} className="text-primary-600" />
              <span className="font-medium text-slate-700">
                {selectedAppt.appointmentDate
                  ? new Date(`${selectedAppt.appointmentDate}T00:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                  : `${weekDays.find((day) => day.id === selectedAppt.day)?.name} - ${weekDays.find((day) => day.id === selectedAppt.day)?.dateStr}`}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <Clock size={20} className="text-primary-600" />
              <span className="font-medium text-slate-700">
                Início às {formatHour(selectedAppt.start)} - Duração: {selectedAppt.duration}h
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Status da confirmação</p>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getConfirmationStatusUi(selectedAppt?.statusConfirmacao).classes}`}>
                {getConfirmationStatusUi(selectedAppt?.statusConfirmacao).label}
              </span>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${selectedOperationalTone?.panel || 'border-slate-200 bg-slate-50'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Próximo passo operacional</p>
                {selectedOperationalMeta && (
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${selectedOperationalTone.badge}`}>
                    {selectedAppt?.operationalLabel || selectedOperationalMeta.label}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {selectedNextAction}
              </p>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => sendConfirmationWhatsApp(selectedAppt)}
                loading={isSendingConfirmation}
                disabled={isSendingConfirmation}
              >
                Enviar confirmação por WhatsApp
              </Button>
              <Button variant="danger" onClick={handleDelete} icon={Trash2}>
                Cancelar Agendamento
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default CalendarView;



