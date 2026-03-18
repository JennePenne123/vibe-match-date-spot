/**
 * Calendar export utilities – generates .ics files and provider-specific URLs.
 * Zero dependencies, fully client-side.
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  /** Duration in minutes – defaults to 120 */
  durationMinutes?: number;
}

// ── helpers ──────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** Format a Date as ICS UTC timestamp: 20260318T190000Z */
const toICSDate = (d: Date): string => {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
};

/** Format for Google Calendar: 20260318T190000Z/20260318T210000Z */
const toGoogleDateRange = (start: Date, end: Date) =>
  `${toICSDate(start)}/${toICSDate(end)}`;

const getEndDate = (evt: CalendarEvent): Date => {
  const end = new Date(evt.startDate);
  end.setMinutes(end.getMinutes() + (evt.durationMinutes ?? 120));
  return end;
};

// ── .ics file (Apple Calendar, Outlook desktop, any calendar app) ───

export const generateICSFile = (evt: CalendarEvent): string => {
  const end = getEndDate(evt);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DateApp//DateApp//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(evt.startDate)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${(evt.title || '').replace(/\n/g, '\\n')}`,
    evt.description ? `DESCRIPTION:${evt.description.replace(/\n/g, '\\n')}` : '',
    evt.location ? `LOCATION:${evt.location.replace(/\n/g, '\\n')}` : '',
    `UID:${crypto.randomUUID()}@dateapp`,
    `DTSTAMP:${toICSDate(new Date())}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
};

export const downloadICSFile = (evt: CalendarEvent) => {
  const ics = generateICSFile(evt);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${evt.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Google Calendar ─────────────────────────────────────────────────

export const getGoogleCalendarUrl = (evt: CalendarEvent): string => {
  const end = getEndDate(evt);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evt.title,
    dates: toGoogleDateRange(evt.startDate, end),
    ...(evt.location && { location: evt.location }),
    ...(evt.description && { details: evt.description }),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// ── Outlook Web ─────────────────────────────────────────────────────

export const getOutlookCalendarUrl = (evt: CalendarEvent): string => {
  const end = getEndDate(evt);
  const params = new URLSearchParams({
    rru: 'addevent',
    subject: evt.title,
    startdt: evt.startDate.toISOString(),
    enddt: end.toISOString(),
    ...(evt.location && { location: evt.location }),
    ...(evt.description && { body: evt.description }),
    path: '/calendar/action/compose',
  });
  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
};
