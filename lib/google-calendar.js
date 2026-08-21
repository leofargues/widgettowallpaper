// ====================================================================
// MODULE GOOGLE CALENDAR API (v3)
// ====================================================================

import { getValidAccessToken } from './google-auth.js';
import { formatParisTime, formatParisYMD } from './calendar.js';
import { GOOGLE_EVENT_COLORS } from './constants.js';
import { extractEventColor } from './color-utils.js';

/**
 * Récupère la couleur de fond d'un agenda donné depuis Google Calendar.
 */
async function getCalendarBackgroundColor(token, calendarId) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(calendarId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.backgroundColor) {
        return data.backgroundColor;
      }
    }
  } catch (e) {
    console.warn(`Impossible de récupérer la couleur de l'agenda ${calendarId}:`, e);
  }
  return '#039BE5'; // Bleu Google par défaut
}

/**
 * Récupère les événements du jour pour un agenda spécifique.
 */
async function fetchEventsForSingleCalendar(token, calendarId, timeMin, timeMax) {
  const calendarColor = await getCalendarBackgroundColor(token, calendarId);

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    timeZone: 'Europe/Paris',
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`Google API Error for calendar ${calendarId}: ${res.status} ${res.statusText} - ${errorBody}`);
    return [];
  }

  const data = await res.json();
  const events = [];

  for (const item of data.items || []) {
    if (item.status === 'cancelled') continue;
    
    const isAllDay = !item.start.dateTime;
    const title = item.summary || 'Sans titre';
    
    // Résolution de couleur :
    // 1. Couleur spécifique de l'événement (item.colorId défini dans Google Agenda)
    // 2. Couleur de fond de l'agenda (Google Calendar backgroundColor)
    // 3. Fallback heuristique tag/emoji si présent
    let color = calendarColor;
    if (item.colorId && GOOGLE_EVENT_COLORS[String(item.colorId)]) {
      color = GOOGLE_EVENT_COLORS[String(item.colorId)];
    } else {
      const extracted = extractEventColor('', title);
      if (extracted !== '#00F6FF') {
        color = extracted;
      }
    }

    let startTimestamp, endTimestamp, timeStr;

    if (isAllDay) {
      startTimestamp = 0;
      endTimestamp = Infinity;
      timeStr = 'Journée entière';
    } else {
      const startDate = new Date(item.start.dateTime);
      const endDate = new Date(item.end.dateTime);
      
      startTimestamp = startDate.getTime();
      endTimestamp = endDate.getTime();
      timeStr = `${formatParisTime(startDate)} - ${formatParisTime(endDate)}`;
    }

    events.push({
      title: title.replace(/^\[[#a-zA-Z0-9]+\]\s*/, ''),
      time: timeStr,
      isAllDay: isAllDay,
      startTimestamp: startTimestamp,
      endTimestamp: endTimestamp,
      color: color,
    });
  }

  return events;
}

/**
 * Récupère les événements du jour depuis l'API Google Calendar (supporte un ou plusieurs agendas).
 */
export async function fetchGoogleCalendarEvents() {
  try {
    const token = await getValidAccessToken();
    const rawCalendarIds = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const calendarIds = rawCalendarIds.split(',').map((id) => id.trim()).filter(Boolean);
    
    // Déterminer le début et la fin de la journée à Paris au format ISO 8601 (RFC3339)
    const todayYMD = formatParisYMD();
    
    const tempDate = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Paris',
      timeZoneName: 'longOffset',
    }).formatToParts(tempDate);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+02:00';
    let offset = tzPart.replace('GMT', '').replace('UTC', '').trim();
    if (!offset) offset = '+02:00';

    const timeMin = new Date(`${todayYMD}T00:00:00${offset}`).toISOString();
    const timeMax = new Date(`${todayYMD}T23:59:59${offset}`).toISOString();

    // Récupérer les événements de tous les agendas configurés
    const results = await Promise.all(
      calendarIds.map((id) => fetchEventsForSingleCalendar(token, id, timeMin, timeMax))
    );

    const allEvents = results.flat();
    return allEvents;
  } catch (err) {
    console.error('fetchGoogleCalendarEvents error:', err);
    return [];
  }
}
