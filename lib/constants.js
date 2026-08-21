// ====================================================================
// CONSTANTES & PALETTES DE THÈMES
// ====================================================================

export const DIMENSIONS = { width: 1206, height: 2622 };

export const THEMES = {
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

export const DAYS = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const COLOR_MAP = {
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

export const EMOJI_COLOR_MAP = [
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
