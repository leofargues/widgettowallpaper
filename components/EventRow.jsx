import { hexToRgba } from '../lib/color-utils.js';

// ====================================================================
// COMPOSANT LIGNE D'ÉVÉNEMENT
// ====================================================================

export function EventRow({ title, time, theme, isExpanded, color, isDark }) {
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
