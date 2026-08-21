import { ImageResponse } from 'next/og';
import { DIMENSIONS, THEMES, DAYS, MONTHS } from '../../../lib/constants.js';
import { fetchEvents, selectEvents } from '../../../lib/calendar.js';
import { EventRow } from '../../../components/EventRow.jsx';

export const dynamic = 'force-dynamic';

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

    // Détection de la configuration (Google API ou URL iCal)
    const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL;
    
    const isGoogleApiConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN &&
      !process.env.GOOGLE_REFRESH_TOKEN.includes('votre-refresh-token')
    );

    const isIcalConfigured = Boolean(
      icalUrl &&
      !icalUrl.includes('VOTRE_IDENTIFIANT') &&
      !icalUrl.includes('VOTRE_URL_ICAL_ICI') &&
      (icalUrl.startsWith('http://') || icalUrl.startsWith('https://'))
    );

    const isConfigured = isGoogleApiConfigured || isIcalConfigured;

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
