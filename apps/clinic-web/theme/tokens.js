/**
 * ORADENT clinic-web design tokens.
 *
 * Two layers, both driven by CSS custom properties so `html.dark` flips the whole UI:
 *  1. Semantic tokens (`bg-canvas`, `bg-card`, `text-fg`, `border-line`, `ring-focus`, ...)
 *     for layout chrome and shared components.
 *  2. Role-aware Tailwind palettes: `text-*`, `bg-*` and `border-*`/`ring-*` read separate
 *     variables, so legacy `bg-white` / `text-slate-900` / `bg-emerald-50` adapt in dark mode
 *     without breaking solid fills such as `bg-primary text-white`.
 */
const tw = require('tailwindcss/colors');

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const CHROMATIC = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
];

const DARK_CARD = '#121B2E';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const triple = (hex) => hexToRgb(hex).join(' ');

function mix(fg, bg, amount) {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  return a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount))).join(' ');
}

/** Semantic tokens — values are `r g b` triples for `rgb(var(--x) / <alpha-value>)`. */
const semantic = {
  light: {
    canvas: '#F5F7FB',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    popover: '#FFFFFF',
    sunken: '#F1F5F9',
    fg: '#0F172A',
    'fg-muted': '#64748B',
    'fg-subtle': '#94A3B8',
    line: '#E2E8F0',
    'line-strong': '#CBD5E1',
    hover: '#F1F5F9',
    pressed: '#E2E8F0',
    focus: '#6366F1',
    success: '#059669',
    'success-soft': '#ECFDF5',
    warning: '#D97706',
    'warning-soft': '#FFFBEB',
    danger: '#E11D48',
    'danger-soft': '#FFF1F2',
    overlay: '#0F172A',
    shadow: '#0F172A',
    sidebar: '#1E1B4B',
    'chart-grid': '#E2E8F0',
    'chart-cursor': '#A5B4FC',
  },
  dark: {
    canvas: '#0B1220',
    surface: '#0F1829',
    card: DARK_CARD,
    popover: '#172138',
    sunken: '#0E1626',
    fg: '#EDF1F6',
    'fg-muted': '#98A3B7',
    'fg-subtle': '#7C89A0',
    line: '#243049',
    'line-strong': '#34425E',
    hover: '#1B2640',
    pressed: '#24314D',
    focus: '#818CF8',
    success: '#34D399',
    'success-soft': mixHex('#10B981', DARK_CARD, 0.14),
    warning: '#FBBF24',
    'warning-soft': mixHex('#F59E0B', DARK_CARD, 0.14),
    danger: '#FB7185',
    'danger-soft': mixHex('#F43F5E', DARK_CARD, 0.14),
    overlay: '#020617',
    shadow: '#000000',
    sidebar: '#0A1122',
    'chart-grid': '#243049',
    'chart-cursor': '#6366F1',
  },
};

function mixHex(fg, bg, amount) {
  return (
    '#' +
    mix(fg, bg, amount)
      .split(' ')
      .map((v) => Number(v).toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Brand colours per role (light → dark). */
const brand = {
  primary: {
    DEFAULT: { light: '#4338CA', darkBg: '#5850EC', darkFg: '#8B95F9', darkLine: '#6D72F3' },
    muted: { light: '#EEF2FF', darkBg: mixHex('#6366F1', DARK_CARD, 0.16), darkFg: '#C7D2FE', darkLine: mixHex('#6366F1', DARK_CARD, 0.3) },
    pressed: { light: '#3730A3', darkBg: '#4338CA', darkFg: '#A5B4FC', darkLine: '#4F46E5' },
  },
  secondary: {
    DEFAULT: { light: '#0891B2', darkBg: '#0891B2', darkFg: '#22D3EE', darkLine: '#06B6D4' },
    muted: { light: '#ECFEFF', darkBg: mixHex('#06B6D4', DARK_CARD, 0.14), darkFg: '#A5F3FC', darkLine: mixHex('#06B6D4', DARK_CARD, 0.3) },
  },
};

/** Neutral scale per role in dark mode (light mode uses Tailwind slate as-is). */
const darkSlate = {
  bg: {
    50: '#0E1626', 100: '#1A2539', 200: '#222E45', 300: '#2E3B55', 400: '#475570',
    500: '#5D6B86', 600: '#75839C', 700: '#2A3650', 800: '#0A101C', 900: '#060B16', 950: '#03060D',
  },
  fg: {
    50: '#0F172A', 100: '#1E293B', 200: '#334155', 300: '#4F5D75', 400: '#7C89A0',
    500: '#94A0B4', 600: '#AAB4C5', 700: '#C2CAD7', 800: '#D9DFE8', 900: '#EDF1F6', 950: '#F8FAFC',
  },
  line: {
    50: '#182238', 100: '#1C2740', 200: '#253149', 300: '#34425E', 400: '#4A5875',
    500: '#64748B', 600: '#7A889E', 700: '#94A3B8', 800: '#CBD5E1', 900: '#E2E8F0', 950: '#F1F5F9',
  },
};

const FG_MIRROR = { 500: '400', 600: '400', 700: '300', 800: '200', 900: '100', 950: '50' };
const BG_TINT = { 50: 0.12, 100: 0.18, 200: 0.28, 300: 0.42 };
const LINE_TINT = { 50: 0.16, 100: 0.22, 200: 0.32, 300: 0.45 };

function darkChromatic(role, palette, shade) {
  if (role === 'fg') return triple(palette[FG_MIRROR[shade] ?? shade]);
  const tint = (role === 'bg' ? BG_TINT : LINE_TINT)[shade];
  return tint ? mix(palette['500'], DARK_CARD, tint) : triple(palette[shade]);
}

function buildVars() {
  const light = {};
  const dark = {};

  for (const [name, hex] of Object.entries(semantic.light)) light[`--${name}`] = triple(hex);
  for (const [name, hex] of Object.entries(semantic.dark)) dark[`--${name}`] = triple(hex);

  for (const role of ['bg', 'fg', 'line']) {
    for (const shade of SHADES) {
      light[`--${role}-slate-${shade}`] = triple(tw.slate[shade]);
      dark[`--${role}-slate-${shade}`] = triple(darkSlate[role][shade]);
      for (const color of CHROMATIC) {
        light[`--${role}-${color}-${shade}`] = triple(tw[color][shade]);
        dark[`--${role}-${color}-${shade}`] = darkChromatic(role, tw[color], shade);
      }
    }
    for (const [color, variants] of Object.entries(brand)) {
      for (const [variant, v] of Object.entries(variants)) {
        const darkValue = { bg: v.darkBg, fg: v.darkFg, line: v.darkLine }[role];
        light[`--${role}-${color}-${variant}`] = triple(v.light);
        dark[`--${role}-${color}-${variant}`] = triple(darkValue);
      }
    }
  }

  light['--bg-white'] = triple('#FFFFFF');
  dark['--bg-white'] = triple(DARK_CARD);

  return { light, dark };
}

const ref = (name) => `rgb(var(--${name}) / <alpha-value>)`;

function rolePalette(role) {
  const out = {};
  for (const color of ['slate', ...CHROMATIC]) {
    out[color] = Object.fromEntries(SHADES.map((s) => [s, ref(`${role}-${color}-${s}`)]));
  }
  for (const [color, variants] of Object.entries(brand)) {
    out[color] = Object.fromEntries(
      Object.keys(variants).map((variant) => [variant, ref(`${role}-${color}-${variant}`)]),
    );
  }
  return out;
}

/** Semantic colour utilities shared by every role. */
const semanticColors = {
  canvas: ref('canvas'),
  surface: ref('surface'),
  card: ref('card'),
  popover: ref('popover'),
  sunken: ref('sunken'),
  fg: { DEFAULT: ref('fg'), muted: ref('fg-muted'), subtle: ref('fg-subtle') },
  line: { DEFAULT: ref('line'), strong: ref('line-strong') },
  hover: ref('hover'),
  pressed: ref('pressed'),
  focus: ref('focus'),
  success: { DEFAULT: ref('success'), soft: ref('success-soft') },
  warning: { DEFAULT: ref('warning'), soft: ref('warning-soft') },
  danger: { DEFAULT: ref('danger'), soft: ref('danger-soft') },
  overlay: ref('overlay'),
};

module.exports = {
  buildVars,
  rolePalette,
  semanticColors,
  ref,
  brandStatic: {
    primary: { DEFAULT: brand.primary.DEFAULT.light, muted: brand.primary.muted.light, pressed: brand.primary.pressed.light },
    secondary: { DEFAULT: brand.secondary.DEFAULT.light, muted: brand.secondary.muted.light },
  },
};
