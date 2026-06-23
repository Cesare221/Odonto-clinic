// =============================================================================
// CONSTANTS/THEME.JS - Sistema de Design - Variaveis Centralizadas
// Exporta configuracoes de cor, espacamento, tipografia e sombra
// =============================================================================

export const colors = {
  // Forest green (cor primaria)
  primary: {
    50: '#f2f7f4',
    100: '#dce9e1',
    200: '#bed4c7',
    300: '#96b6a6',
    400: '#6b9583',
    500: '#4f7a68',
    600: '#3d6555',
    700: '#315246',
    800: '#29433a',
    900: '#213730',
    950: '#11211d',
  },
  // Warm sand / neutros
  slate: {
    50: '#fbf8f2',
    100: '#f5efe4',
    200: '#eadfcd',
    300: '#d9c8ae',
    400: '#bea888',
    500: '#9c8265',
    600: '#7c6651',
    700: '#645243',
    800: '#54463b',
    900: '#473b33',
    950: '#241c18',
  },
  // Muted gold / supportive highlight
  secondary: {
    50: '#fcf8ec',
    100: '#f6edd0',
    200: '#efdeac',
    300: '#e5c87a',
    400: '#d7ae4f',
    500: '#c48f32',
    600: '#a57228',
    700: '#855821',
    800: '#704820',
    900: '#603d1e',
    950: '#37210f',
  },
  accent: {
    50: '#f5f8f6',
    100: '#e3eee8',
    200: '#c9ddd3',
    300: '#a5c4b4',
    400: '#7ea691',
    500: '#618772',
    600: '#4b6d5b',
    700: '#3c584a',
    800: '#32473d',
    900: '#2b3c34',
    950: '#151f1a',
  },
  // Semantica / Feedback
  success: {
    100: '#e4f5ea',
    200: '#c5e7d0',
    500: '#3f8a5f',
    600: '#2f724c',
    700: '#275c3f',
  },
  warning: {
    100: '#fbf1d8',
    500: '#c79235',
    600: '#ac7625',
    700: '#87591e',
  },
  error: {
    100: '#fae3e2',
    500: '#c65d52',
    600: '#ad453b',
    700: '#8c352e',
  },
  info: {
    100: '#dfeff4',
    500: '#4f8296',
    600: '#3d697d',
    700: '#315465',
  },
  // Tipos de Procedimentos (Odonto)
  procedure: {
    eval: { color: '#3d697d', bg: '#dfeff4', border: '#b7d1db' },
    routine: { color: '#3d6555', bg: '#e3eee8', border: '#bdd2c7' },
    surgery: { color: '#ad453b', bg: '#fae3e2', border: '#e8b6b1' },
    ortho: { color: '#5f648c', bg: '#e8e8f5', border: '#c9c9e7' },
    aesthetic: { color: '#a57228', bg: '#fbf1d8', border: '#e7cb95' },
    emergency: { color: '#8c352e', bg: '#f7d8d4', border: '#df9d95' },
  },
  // Status Dente
  tooth: {
    saudavel: { label: 'Saudavel', color: '#618772', bg: '#f5f8f6', border: '#c9ddd3' },
    carie: { label: 'Carie', color: '#ad453b', bg: '#fae3e2', border: '#e8b6b1' },
    restaurado: { label: 'Restaurado', color: '#3d697d', bg: '#dfeff4', border: '#b7d1db' },
    extraido: { label: 'Extraido', color: '#fbf8f2', bg: '#645243', border: '#54463b' },
    canal: { label: 'Trat. Canal', color: '#5f648c', bg: '#e8e8f5', border: '#c9c9e7' },
    implante: { label: 'Implante', color: '#3d6555', bg: '#e3eee8', border: '#bdd2c7' },
  },
};

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
};

export const shadows = {
  sm: '0 1px 2px rgb(17 33 29 / 0.06), 0 1px 3px rgb(17 33 29 / 0.04)',
  md: '0 12px 30px -20px rgb(17 33 29 / 0.24), 0 8px 18px -14px rgb(17 33 29 / 0.16)',
  lg: '0 22px 44px -24px rgb(17 33 29 / 0.28), 0 14px 30px -20px rgb(17 33 29 / 0.18)',
  xl: '0 32px 60px -28px rgb(17 33 29 / 0.3), 0 22px 42px -24px rgb(17 33 29 / 0.2)',
  glow: (color) => `0 10px 24px -12px ${color}45`,
};

export const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
};

export const transitions = {
  fast: 'all 150ms ease-in-out',
  default: 'all 250ms ease-in-out',
  slow: 'all 400ms ease-in-out',
  bounce: 'all 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const fontFamily = {
  sans: "'Figtree', 'Noto Sans', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

export const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
};

export const zIndex = {
  dropdown: 1000,
  modal: 5000,
  tooltip: 6000,
  toast: 7000,
};

// Utilitarios de classe (para uso em className)
export const getStatusColor = (status) => colors.procedure[status] || colors.primary;
export const getToothStatus = (id) => colors.tooth[id] || colors.tooth.saudavel;
