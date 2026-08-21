import { COLOR_MAP, EMOJI_COLOR_MAP } from './constants.js';

// ====================================================================
// UTILITAIRES DE COULEURS
// ====================================================================

export function extractEventColor(block, summary) {
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

export function hexToRgba(hex, alpha = 0.10) {
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
