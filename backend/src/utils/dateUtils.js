export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
};

export const isWeekend = (date, weekendDays = [0, 6]) => {
  return weekendDays.includes(new Date(date).getDay());
};

export const getWorkingDaysInMonth = (year, month, weekendDays = [0, 6], holidayDates = []) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const workingDates = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const cur = new Date(year, month - 1, d);
    const dateStr = formatDate(cur);
    if (!isWeekend(cur, weekendDays) && !holidayDates.includes(dateStr)) {
      workingDates.push(dateStr);
    }
  }

  return { count: workingDates.length, workingDates };
};

export const getWorkingDaysBetween = (startStr, endStr, weekendDays = [0, 6], holidayDates = []) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const workingDates = [];
  const cur = new Date(start);

  while (cur <= end) {
    const dateStr = formatDate(cur);
    if (!isWeekend(cur, weekendDays) && !holidayDates.includes(dateStr)) {
      workingDates.push(dateStr);
    }
    cur.setDate(cur.getDate() + 1);
  }

  return { count: workingDates.length, workingDates };
};

export const isLateArrival = (checkInDate, officeStart = '09:00', graceMins = 15) => {
  const [h, m] = officeStart.split(':').map(Number);
  const cutoff = new Date(checkInDate);
  cutoff.setHours(h, m + graceMins, 0, 0);
  return new Date(checkInDate).getTime() > cutoff.getTime();
};

export const calculateMinutes = (start, end) => {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
};
