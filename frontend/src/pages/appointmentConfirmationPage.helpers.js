const DEFAULT_LOCALE = 'pt-BR';
const WEEKDAY_INDEX_BY_ENGLISH_LABEL = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const buildFormatter = (options, locale = DEFAULT_LOCALE, timeZone) => (
  new Intl.DateTimeFormat(locale, timeZone ? { ...options, timeZone } : options)
);

const normalizeDateAtMidday = (value) => {
  const date = new Date(value);
  date.setHours(12, 0, 0, 0);
  return date;
};

const addDays = (date, days) => {
  const nextDate = normalizeDateAtMidday(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

export const getMonthStart = (value = new Date()) => {
  const date = normalizeDateAtMidday(value);
  date.setDate(1);
  return date;
};

export const addMonths = (value, months) => {
  const date = getMonthStart(value);
  date.setMonth(date.getMonth() + months);
  return date;
};

export const formatRescheduleMonthLabel = (
  value,
  { locale = DEFAULT_LOCALE, timeZone } = {}
) => buildFormatter(
  {
    month: 'long',
    year: 'numeric',
  },
  locale,
  timeZone
).format(value);

const getDateParts = (date, timeZone) => {
  const formatter = buildFormatter(
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    DEFAULT_LOCALE,
    timeZone
  );

  const parts = formatter.formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value || '00';
  const month = parts.find((part) => part.type === 'month')?.value || '00';
  const year = parts.find((part) => part.type === 'year')?.value || '0000';

  return { day, month, year };
};

const toDateKey = (date, timeZone) => {
  const { day, month, year } = getDateParts(date, timeZone);
  return `${year}-${month}-${day}`;
};

const getWeekdayIndex = (date, timeZone) => {
  const weekdayLabel = buildFormatter(
    { weekday: 'short' },
    'en-US',
    timeZone
  ).format(date);

  return WEEKDAY_INDEX_BY_ENGLISH_LABEL[weekdayLabel] ?? date.getDay();
};

export const formatRescheduleDateLabel = (slotStart, { locale = DEFAULT_LOCALE, timeZone } = {}) => {
  const date = new Date(slotStart);

  return buildFormatter(
    {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
    locale,
    timeZone
  ).format(date);
};

export const formatRescheduleTimeLabel = (
  slotStart,
  slotEnd,
  { locale = DEFAULT_LOCALE, timeZone } = {}
) => {
  const startDate = new Date(slotStart);
  const endDate = new Date(slotEnd);
  const timeFormatter = buildFormatter(
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    locale,
    timeZone
  );

  return `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
};

export const groupRescheduleOptionsByDay = (
  options = [],
  { locale = DEFAULT_LOCALE, timeZone } = {}
) => {
  const groupedMap = new Map();

  const sortedOptions = [...options].sort((left, right) => (
    new Date(left.start).getTime() - new Date(right.start).getTime()
  ));

  sortedOptions.forEach((option) => {
    if (!option?.start || !option?.end) {
      return;
    }

    const dateKey = toDateKey(new Date(option.start), timeZone);
    const currentGroup = groupedMap.get(dateKey) || {
      dateKey,
      label: formatRescheduleDateLabel(option.start, { locale, timeZone }),
      slots: [],
    };

    currentGroup.slots.push({
      ...option,
      id: `${option.start}__${option.end}`,
      timeLabel: formatRescheduleTimeLabel(option.start, option.end, { locale, timeZone }),
    });

    groupedMap.set(dateKey, currentGroup);
  });

  return Array.from(groupedMap.values());
};

export const buildRescheduleCalendarDays = (
  groupedOptions = [],
  {
    locale = DEFAULT_LOCALE,
    timeZone,
    daysToShow = 30,
    startDate = new Date(),
  } = {}
) => {
  const groupedOptionsMap = new Map(
    groupedOptions.map((group) => [group.dateKey, group])
  );
  const firstCalendarDate = normalizeDateAtMidday(startDate);
  const dayFormatter = buildFormatter(
    { weekday: 'short' },
    locale,
    timeZone
  );
  const monthFormatter = buildFormatter(
    { month: 'short' },
    locale,
    timeZone
  );

  return Array.from({ length: daysToShow }, (_, index) => {
    const currentDate = addDays(firstCalendarDate, index);
    const dateKey = toDateKey(currentDate, timeZone);
    const matchingGroup = groupedOptionsMap.get(dateKey);
    const { day } = getDateParts(currentDate, timeZone);

    return {
      dateKey,
      dayNumber: day,
      weekdayShort: dayFormatter.format(currentDate).replace('.', ''),
      monthShort: monthFormatter.format(currentDate).replace('.', ''),
      fullLabel: formatRescheduleDateLabel(currentDate.toISOString(), { locale, timeZone }),
      weekdayIndex: getWeekdayIndex(currentDate, timeZone),
      isAvailable: Boolean(matchingGroup?.slots?.length),
      slotCount: matchingGroup?.slots?.length || 0,
    };
  });
};

export const buildRescheduleMonthCalendarDays = (
  groupedOptions = [],
  {
    locale = DEFAULT_LOCALE,
    timeZone,
    monthDate = new Date(),
  } = {}
) => {
  const monthStart = getMonthStart(monthDate);
  const nextMonthStart = addMonths(monthStart, 1);
  const daysInMonth = Math.round(
    (nextMonthStart.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000)
  );

  return buildRescheduleCalendarDays(groupedOptions, {
    locale,
    timeZone,
    daysToShow: daysInMonth,
    startDate: monthStart,
  });
};

export const buildPublicConfirmationPayload = ({
  action,
  note = '',
  selectedSlot,
}) => {
  const normalizedPayload = {
    action,
    note: typeof note === 'string' ? note.trim() : '',
  };

  if (action !== 'remarcar') {
    return normalizedPayload;
  }

  return {
    ...normalizedPayload,
    requestedStart: selectedSlot?.start || '',
    requestedEnd: selectedSlot?.end || '',
  };
};

export const buildPublicBookingPayload = ({
  form,
  selectedSlot,
}) => ({
  patientName: String(form?.patientName || '').trim(),
  cpf: String(form?.cpf || '').trim(),
  phone: String(form?.phone || '').trim(),
  email: String(form?.email || '').trim(),
  doctorId: String(form?.doctorId || '').trim(),
  type: form?.type || 'eval',
  procedure: String(form?.procedure || '').trim(),
  note: String(form?.note || '').trim(),
  requestedStart: selectedSlot?.start || '',
  requestedEnd: selectedSlot?.end || '',
});
