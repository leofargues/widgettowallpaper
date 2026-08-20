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
// 2. UTILITAIRES ICAL & DATES (PARIS TIMEZONE) & COULEURS
// ====================================================================
const COLOR_MAP = {
  red: '#FF453A',
  rouge: '#FF453A',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  jaune: '#FFD60A',
  green: '#30D158',
  vert: '#30D158',
  blue: '#0A84FF',
  bleu: '#0A84FF',
  purple: '#BF5AF2',
  violet: '#BF5AF2',
  pink: '#FF375F',
  rose: '#FF375F',
  cyan: '#00F6FF',
  turquoise: '#00F6FF',
  gray: '#8E8E93',
  gris: '#8E8E93',
  brown: '#AC8E68',
  marron: '#AC8E68',
};

const EMOJI_COLOR_MAP = [
  { regex: /^[🔴🛑]/u, color: '#FF453A' },
  { regex: /^[🟠🔶🟧]/u, color: '#FF9F0A' },
  { regex: /^[🟡⭐🟨]/u, color: '#FFD60A' },
  { regex: /^[🟢✅🟩]/u, color: '#30D158' },
  { regex: /^[🔵🔷🟦]/u, color: '#0A84FF' },
  { regex: /^[🟣🟪]/u, color: '#BF5AF2' },
  { regex: /^[🩵🐬💎]/u, color: '#00F6FF' },
  { regex: /^[🩷]/u, color: '#FF375F' },
  { regex: /^[🟤🟫]/u, color: '#AC8E68' },
  { regex: /^[⚫⬛]/u, color: '#8E8E93' },
];

function extractEventColor(block, summary) {
  // 1. Tag direct iCal (COLOR, X-APPLE-CALENDAR-COLOR, X-COLOR)
  const colorMatch = block.match(/(?:COLOR|X-APPLE-CALENDAR-COLOR|X-COLOR)(?:;[^:]+)?:([^\r\n]+)/i);
  if (colorMatch) {
    const rawVal = colorMatch[1].trim().toLowerCase();
    if (/^#[0-9a-f]{3,8}$/i.test(rawVal)) {
      return rawVal;
    }
    if (COLOR_MAP[rawVal]) {
      return COLOR_MAP[rawVal];
    }
  }

  // 2. Tag dans le titre [couleur] ou [#HEX]
  const titleTagMatch = summary.match(/^\[([#a-zA-Z0-9]+)\]/);
  if (titleTagMatch) {
    const tag = titleTagMatch[1].toLowerCase();
    if (/^#[0-9a-f]{3,8}$/i.test(tag)) return tag;
    if (COLOR_MAP[tag]) return COLOR_MAP[tag];
  }

  // 3. Emoji au début du titre
  for (const item of EMOJI_COLOR_MAP) {
    if (item.regex.test(summary)) {
      return item.color;
    }
  }

  return '#00F6FF'; // Cyan par défaut
}

function hexToRgba(hex, alpha = 0.10) {
  if (!hex) return `rgba(0, 246, 255, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  if (c.length === 6) {
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    return hex;
  }
  return `rgba(0, 246, 255, ${alpha})`;
}

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
function EventRow({ title, time, theme, isExpanded, color, isDark }) {
  const eventColor = color || theme.pillColor || '#00F6FF';
  const alpha = isDark ? 0.16 : 0.10;
  const eventBg = hexToRgba(eventColor, alpha);

  const padding = isExpanded ? '16px' : '28px 36px';
  const borderRadius = isExpanded ? '20px' : '32px';
  const gap = isExpanded ? '20px' : '28px';

  const pillWidth = isExpanded ? '18px' : '14px';
  const pillHeight = isExpanded ? '80px' : '76px';
  const pillRadius = isExpanded ? '20px' : '20px';

  const titleSize = isExpanded ? '32px' : '48px';
  const timeSize = isExpanded ? '24px' : '38px';
  const textGap = isExpanded ? '8px' : '6px';

  return (
    <div
      style={{
        display: 'flex',
        background: eventBg,
        borderRadius: borderRadius,
        padding: padding,
        alignItems: 'center',
        gap: gap,
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: pillWidth,
          height: pillHeight,
          backgroundColor: eventColor,
          borderRadius: pillRadius,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: textGap,
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
            fontSize: titleSize,
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
            fontSize: timeSize,
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
    const variant = searchParams.get('variant') || 'default';
    const isExpanded = variant === 'expanded';
    const theme = THEMES[themeName] || THEMES.light;

    const now = new Date();
    const dayNumber = parseInt(now.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric' }), 10) || now.getDate();
    const monthIndex = (parseInt(now.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', month: 'numeric' }), 10) - 1) || now.getMonth();
    const dayIndex = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' })).getDay();

    const dayName = DAYS[dayIndex !== undefined ? dayIndex : now.getDay()];
    const monthName = MONTHS[monthIndex !== undefined ? monthIndex : now.getMonth()];

    // Détection de la configuration et du domaine hôte
    const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL;
    const isConfigured = Boolean(
      icalUrl &&
      !icalUrl.includes('VOTRE_IDENTIFIANT') &&
      !icalUrl.includes('VOTRE_URL_ICAL_ICI') &&
      (icalUrl.startsWith('http://') || icalUrl.startsWith('https://'))
    );

    const host =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL ||
      'localhost:3000';

    let displayedEvents = [];
    let footerText = '';
    let column1Events = [];
    let column2Events = [];

    if (!isConfigured) {
      displayedEvents = [
        {
          title: '⚠️ Configuration requise',
          time: `${host}/setup.html`,
          isAllDay: false,
        },
      ];
      footerText = `Ouvrez ${host}/setup.html`;
      if (isExpanded) column1Events = [...displayedEvents];
    } else {
      const allEvents = await fetchEvents(icalUrl);
      const maxCount = isExpanded ? 8 : 3;
      displayedEvents = selectEvents(allEvents, maxCount);
      const totalCount = allEvents.length;

      footerText =
        totalCount === 0
          ? '0 événement aujourd’hui'
          : totalCount === 1
          ? '1 événement aujourd’hui'
          : `${totalCount} événements aujourd’hui`;

      if (isExpanded) {
        if (displayedEvents.length === 0) {
          column1Events.push({ title: 'Aucun événement', time: 'Journée libre' });
        } else {
          displayedEvents.forEach((ev, idx) => {
            if (idx % 2 === 0) column1Events.push(ev);
            else column2Events.push(ev);
          });
        }
      }
    }

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
              padding: isExpanded ? '80px 50px 50px 50px' : '64px 56px 56px 56px',
              display: 'flex',
              flexDirection: 'column',
              gap: isExpanded ? '70px' : '52px',
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
            {isExpanded ? (
              <div style={{ display: 'flex', width: '100%', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0, flexDirection: 'column', gap: '30px' }}>
                  {column1Events.map((ev, idx) => (
                    <EventRow key={`col1-${idx}`} title={ev.title} time={ev.time} theme={theme} isExpanded={true} color={ev.color} isDark={themeName === 'dark'} />
                  ))}
                </div>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0, flexDirection: 'column', gap: '30px' }}>
                  {column2Events.map((ev, idx) => (
                    <EventRow key={`col2-${idx}`} title={ev.title} time={ev.time} theme={theme} isExpanded={true} color={ev.color} isDark={themeName === 'dark'} />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {displayedEvents.length > 0 ? (
                  displayedEvents.map((ev, idx) => (
                    <EventRow key={idx} title={ev.title} time={ev.time} theme={theme} isExpanded={false} color={ev.color} isDark={themeName === 'dark'} />
                  ))
                ) : (
                  <EventRow title="Aucun événement" time="Journée libre" theme={theme} isExpanded={false} color={theme.pillColor} isDark={themeName === 'dark'} />
                )}
              </div>
            )}

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
