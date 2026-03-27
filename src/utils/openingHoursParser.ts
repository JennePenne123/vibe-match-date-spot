/**
 * Minimal parser for opening_hours display strings like:
 * "Mo-Fr 07:30-19:30; Sa 09:30-19:30; PH,Su 10:00-19:30"
 * "Tu-Sa 17:00-23:00"
 */

const DAY_MAP: Record<string, number> = {
  mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6, su: 0,
};

const DAY_ABBR = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

function expandDayRange(token: string): number[] {
  token = token.toLowerCase().replace(/ph,?/g, '').trim();
  if (!token) return [];

  // Single day
  if (DAY_MAP[token] !== undefined) return [DAY_MAP[token]];

  // Range like Mo-Fr
  const rangeParts = token.split('-');
  if (rangeParts.length === 2) {
    const start = DAY_MAP[rangeParts[0]];
    const end = DAY_MAP[rangeParts[1]];
    if (start === undefined || end === undefined) return [];
    const days: number[] = [];
    let current = start;
    for (let i = 0; i < 7; i++) {
      days.push(current);
      if (current === end) break;
      current = (current + 1) % 7;
    }
    return days;
  }

  // Comma-separated like "Sa,Su"
  return token.split(',').map(d => DAY_MAP[d.trim()]).filter(d => d !== undefined);
}

export function isVenueOpenNow(openingHours: any): boolean | null {
  if (!openingHours) return null;

  const display = typeof openingHours === 'string' ? openingHours : openingHours?.display;
  if (!display || typeof display !== 'string') return null;

  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Parse segments separated by ";"
  const segments = display.split(';').map(s => s.trim());

  for (const segment of segments) {
    // Match pattern: "DaySpec HH:MM-HH:MM"
    const match = segment.match(/^([A-Za-z,\-\s]+)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (!match) continue;

    const dayTokens = match[1].split(',').map(t => t.trim());
    const days: number[] = [];
    for (const t of dayTokens) {
      days.push(...expandDayRange(t));
    }

    if (!days.includes(currentDay)) continue;

    const [openH, openM] = match[2].split(':').map(Number);
    const [closeH, closeM] = match[3].split(':').map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;

    // Handle overnight hours (e.g., 18:00-02:00)
    if (closeMin <= openMin) {
      if (currentMinutes >= openMin || currentMinutes <= closeMin) return true;
    } else {
      if (currentMinutes >= openMin && currentMinutes <= closeMin) return true;
    }
  }

  return false;
}
