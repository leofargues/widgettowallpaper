import { extractEventColor } from './color-utils.js';
import { fetchGoogleCalendarEvents } from './google-calendar.js';

// ====================================================================
// UTILITAIRES DE DATE (FUSEAU HORAIRE PARIS)
// ====================================================================

export const formatParisYMD = (date = new Date()) =>
  new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(date);

export const formatParisTime = (date) =>
  new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

export function getParisTimestamp(ymd, hour = 0, min = 0, sec = 0) {
  const tempDate = new Date(`${ymd}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    timeZoneName: 'longOffset',
  }).formatToParts(tempDate);
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+02:00';
  let offset = tzPart.replace('GMT', '').replace('UTC', '').trim();
  if (!offset) offset = '+02:00';

  return new Date(`${ymd}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}${offset}`).getTime();
}

// ====================================================================
// UTILITAIRES DE PARSING ICAL
// ====================================================================

export function unfoldIcal(content) {
  return content.replace(/\r?\n[ \t]/g, '');
}

export function cleanIcalText(text) {
  if (!text) return '';
  return text
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, ' ')
    .trim();
}

export function parseIcalEvent(block, todayParisYMD) {
  if (/STATUS:CANCELLED/i.test(block)) return null;

  const summaryMatch = block.match(/SUMMARY:(.*)/);
  const rawSummary = summaryMatch ? cleanIcalText(summaryMatch[1]) : 'Sans titre';
  const color = extractEventColor(block, rawSummary);
  const summary = rawSummary.replace(/^\[[#a-zA-Z0-9]+\]\s*/, '');

  const startMatch = block.match(/DTSTART(?:;[^:]+)?:([^\r\n]+)/);
  if (!startMatch) return null;

  const endMatch = block.match(/DTEND(?:;[^:]+)?:([^\r\n]+)/);
  const rawStart = startMatch[1].trim();
  const rawEnd = endMatch ? endMatch[1].trim() : rawStart;

  // Journée entière (YYYYMMDD)
  if (/^\d{8}$/.test(rawStart)) {
    const startYMD = `${rawStart.slice(0, 4)}-${rawStart.slice(4, 6)}-${rawStart.slice(6, 8)}`;
    const endYMD = /^\d{8}$/.test(rawEnd)
      ? `${rawEnd.slice(0, 4)}-${rawEnd.slice(4, 6)}-${rawEnd.slice(6, 8)}`
      : startYMD;

    if ((startYMD <= todayParisYMD && todayParisYMD < endYMD) || startYMD === todayParisYMD) {
      return {
        title: summary,
        time: 'Journée entière',
        isAllDay: true,
        startTimestamp: 0,
        endTimestamp: Infinity,
        color: color,
      };
    }
    return null;
  }

  // Heure UTC (YYYYMMDDTHHMMSSZ)
  const utcStart = rawStart.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (utcStart) {
    const [, y, m, d, h, min, s] = utcStart.map(Number);
    const startDate = new Date(Date.UTC(y, m - 1, d, h, min, s));

    let endDate = startDate;
    const utcEnd = rawEnd.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (utcEnd) {
      const [, ey, em, ed, eh, emin, es] = utcEnd.map(Number);
      endDate = new Date(Date.UTC(ey, em - 1, ed, eh, emin, es));
    }

    if (formatParisYMD(startDate) === todayParisYMD) {
      return {
        title: summary,
        time: `${formatParisTime(startDate)} - ${formatParisTime(endDate)}`,
        isAllDay: false,
        startTimestamp: startDate.getTime(),
        endTimestamp: endDate.getTime(),
        color: color,
      };
    }
    return null;
  }

  // Heure locale (YYYYMMDDTHHMMSS)
  const localStart = rawStart.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (localStart) {
    const [, y, m, d, h, min, s] = localStart.map(Number);
    const startYMD = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (startYMD === todayParisYMD) {
      let eh = h + 1, emin = min, es = s;
      const localEnd = rawEnd.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
      if (localEnd) {
        eh = Number(localEnd[4]);
        emin = Number(localEnd[5]);
        es = Number(localEnd[6]);
      }

      return {
        title: summary,
        time: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')} - ${String(eh).padStart(2, '0')}:${String(emin).padStart(2, '0')}`,
        isAllDay: false,
        startTimestamp: getParisTimestamp(startYMD, h, min, s),
        endTimestamp: getParisTimestamp(startYMD, eh, emin, es),
        color: color,
      };
    }
  }

  return null;
}

// ====================================================================
// RÉCUPÉRATION ET SÉLECTION DES ÉVÉNEMENTS
// ====================================================================

export async function fetchIcalEvents(icalUrl) {
  if (!icalUrl || icalUrl.includes('VOTRE_URL_ICAL_ICI')) return [];

  try {
    const res = await fetch(icalUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      cache: 'no-store',
    });


    if (!res.ok) return [];

    const raw = await res.text();
    const content = unfoldIcal(raw);
    const matches = content.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
    const todayYMD = formatParisYMD();

    const events = [];
    for (const block of matches) {
      const ev = parseIcalEvent(block, todayYMD);
      if (ev) events.push(ev);
    }
    return events;
  } catch (err) {
    console.error('iCal fetch error:', err);
    return [];
  }
}

export async function fetchEvents(icalUrl) {
  // Mode Google API OAuth (Prioritaire)
  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    !process.env.GOOGLE_REFRESH_TOKEN.includes('votre-refresh-token')
  ) {
    return fetchGoogleCalendarEvents();
  }

  // Mode legacy iCal (Fallback)
  return fetchIcalEvents(icalUrl);
}

export function selectEvents(allEvents, maxCount = 3) {
  if (allEvents.length === 0) return [];

  const now = Date.now();
  const allDay = allEvents.filter((e) => e.isAllDay);
  const timed = allEvents.filter((e) => !e.isAllDay).sort((a, b) => a.startTimestamp - b.startTimestamp);

  const activeOrUpcoming = timed.filter((e) => e.endTimestamp > now);
  const past = timed.filter((e) => e.endTimestamp <= now);

  const selected = [...allDay];
  const slotsRemaining = Math.max(0, maxCount - selected.length);

  if (slotsRemaining > 0) {
    if (activeOrUpcoming.length >= slotsRemaining) {
      selected.push(...activeOrUpcoming.slice(0, slotsRemaining));
    } else {
      selected.push(...activeOrUpcoming);
      const needed = maxCount - selected.length;
      if (needed > 0 && past.length > 0) {
        selected.push(...past.slice(-needed));
      }
    }
  }

  return selected
    .sort((a, b) => (a.isAllDay ? -1 : b.isAllDay ? 1 : a.startTimestamp - b.startTimestamp))
    .slice(0, maxCount);
}
