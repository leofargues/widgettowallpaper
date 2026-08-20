import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';

// ====================================================================
// 1. CONSTANTES & PALETTES DE THÈMES
// ====================================================================
const DIMENSIONS = { width: 1206, height: 2622 };

const THEMES = {
  light: {
    background: '#E5E5EA',
    cardBackground: '#FFFFFF',
    cardShadow: '0 24px 60px rgba(0, 0, 0, 0.12)',
    dayNumber: '#FF2D2D',
    dayName: '#000000',
    monthName: '#8E8E93',
    eventBackground: 'rgba(0, 246, 255, 0.09)',
    pillColor: '#00F6FF',
    eventTitle: '#000000',
    eventTime: '#8E8E93',
    footer: '#000000',
  },
  dark: {
    background: '#000000',
    cardBackground: '#1C1C1E',
    cardShadow: '0 24px 60px rgba(0, 0, 0, 0.60)',
    dayNumber: '#FF453A',
    dayName: '#FFFFFF',
    monthName: '#8E8E93',
    eventBackground: 'rgba(0, 246, 255, 0.15)',
    pillColor: '#00F6FF',
    eventTitle: '#FFFFFF',
    eventTime: '#8E8E93',
    footer: '#FFFFFF',
  },
};

const DAYS = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// ====================================================================
// 2. UTILITAIRES ICAL & DATES (PARIS TIMEZONE)
// ====================================================================
const formatParisYMD = (date = new Date()) =>
  new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(date);

const formatParisTime = (date) =>
  new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

function unfoldIcal(content) {
  return content.replace(/\r?\n[ \t]/g, '');
}

function cleanIcalText(text) {
  if (!text) return '';
  return text
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, ' ')
    .trim();
}

function getParisTimestamp(ymd, hour = 0, min = 0, sec = 0) {
  const tempDate = new Date(`${ymd}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    timeZoneName: 'shortOffset',
  }).formatToParts(tempDate);
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+2';
  const offset = tzPart.replace('GMT', '').replace('UTC', '') || '+02:00';
  const isoOffset = offset.includes(':') ? offset : `${offset}:00`;
  const normalized = isoOffset.startsWith('+') || isoOffset.startsWith('-') ? isoOffset : `+${isoOffset}`;

  return new Date(`${ymd}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}${normalized}`).getTime();
}

function parseIcalEvent(block, todayParisYMD) {
  if (/STATUS:CANCELLED/i.test(block)) return null;

  const summaryMatch = block.match(/SUMMARY:(.*)/);
  const summary = summaryMatch ? cleanIcalText(summaryMatch[1]) : 'Sans titre';

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
      };
    }
  }

  return null;
}

async function fetchEvents(icalUrl) {
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

function selectEvents(allEvents, maxCount = 3) {
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

// ====================================================================
// 3. COMPOSANT LIGNE D'ÉVÉNEMENT (FACTORISÉ)
// ====================================================================
function EventRow({ title, time, theme }) {
  return (
    <div
      style={{
        display: 'flex',
        background: theme.eventBackground,
        borderRadius: '32px',
        padding: '28px 36px',
        alignItems: 'center',
        gap: '28px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '14px',
          height: '76px',
          backgroundColor: theme.pillColor,
          borderRadius: '20px',
          flexShrink: 0,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          paddingRight: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: theme.eventTitle,
            fontSize: '48px',
            fontWeight: 600,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            color: theme.eventTime,
            fontSize: '38px',
            fontWeight: 500,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// 4. HANDLER DE REQUÊTE
// ====================================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const themeName = searchParams.get('theme') || 'light';
    const theme = THEMES[themeName] || THEMES.light;

    const now = new Date();
    const dayNumber = parseInt(now.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric' }), 10) || now.getDate();
    const monthIndex = (parseInt(now.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', month: 'numeric' }), 10) - 1) || now.getMonth();
    const dayIndex = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getDay();

    const dayName = DAYS[dayIndex !== undefined ? dayIndex : now.getDay()];
    const monthName = MONTHS[monthIndex !== undefined ? monthIndex : now.getMonth()];

    // Récupération des événements
    const allEvents = await fetchEvents(process.env.GOOGLE_CALENDAR_ICAL_URL);
    const displayedEvents = selectEvents(allEvents, 3);
    const totalCount = allEvents.length;

    const footerText =
      totalCount === 0
        ? '0 événement aujourd’hui'
        : totalCount === 1
        ? '1 événement aujourd’hui'
        : `${totalCount} événements aujourd’hui`;

    return new ImageResponse(
      (
        <div
          style={{
            width: `${DIMENSIONS.width}px`,
            height: `${DIMENSIONS.height}px`,
            position: 'relative',
            display: 'flex',
            backgroundColor: theme.background,
            overflow: 'hidden',
          }}
        >
          {/* Carte principale */}
          <div
            style={{
              position: 'absolute',
              left: '42px',
              top: '682px',
              width: '1122px',
              backgroundColor: theme.cardBackground,
              boxShadow: theme.cardShadow,
              borderRadius: '76px',
              padding: '64px 56px 56px 56px',
              display: 'flex',
              flexDirection: 'column',
              gap: '52px',
            }}
          >
            {/* Header Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  color: theme.dayNumber,
                  fontSize: '168px',
                  fontWeight: 700,
                  lineHeight: 0.9,
                  letterSpacing: '-4px',
                }}
              >
                {dayNumber}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                <div
                  style={{
                    display: 'flex',
                    color: theme.dayName,
                    fontSize: '64px',
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: '1px',
                  }}
                >
                  {dayName}
                </div>
                <div
                  style={{
                    display: 'flex',
                    color: theme.monthName,
                    fontSize: '44px',
                    fontWeight: 500,
                    lineHeight: 1.1,
                  }}
                >
                  {monthName}
                </div>
              </div>
            </div>

            {/* Liste des événements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {displayedEvents.length > 0 ? (
                displayedEvents.map((ev, idx) => (
                  <EventRow key={idx} title={ev.title} time={ev.time} theme={theme} />
                ))
              ) : (
                <EventRow title="Aucun événement" time="Journée libre" theme={theme} />
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                color: theme.footer,
                fontSize: '46px',
                fontWeight: 600,
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              {footerText}
            </div>
          </div>
        </div>
      ),
      {
        width: DIMENSIONS.width,
        height: DIMENSIONS.height,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Wallpaper API error:', err);
    return new Response('Erreur de génération', { status: 500 });
  }
}
