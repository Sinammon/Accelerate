// The two brand palettes and their semantic roles are shared by Tailwind and UI.
export const primary = { 50: '#EFF7FF', 100: '#DCEFFF', 200: '#B9DFFF', 300: '#85C5FF', 400: '#4BA9FF', 500: '#168BFF', 600: '#0872E6', 700: '#0759B8', 800: '#0A438B', 900: '#102F61', 950: '#081B3C' };
export const secondary = { 50: '#F0F5FA', 100: '#DAE6F1', 200: '#B5CADE', 300: '#89ACC9', 400: '#5989B2', 500: '#386C98', 600: '#285478', 700: '#1A3C59', 800: '#102C47', 900: '#081D33', 950: '#041222' };
export const neutral = { white: '#FFFFFF', 50: '#F8FBFD', 100: '#F0F6FA', 200: '#E3EBF1', 300: '#CBD7E0', 400: '#94A8B8', 500: '#64798C', 600: '#46596C', 700: '#304255', 800: '#1D2D3C', 900: '#111D29', 950: '#07111B', black: '#000000' };

export const semanticColors = {
  light: {
    background: neutral[50], surface: neutral.white, 'surface-raised': neutral[100], 'surface-hover': primary[50],
    border: neutral[500], 'border-subtle': neutral[200], text: secondary[950], 'text-secondary': neutral[600],
    action: primary[700], accent: primary[700], ink: neutral.white,
    warning: secondary[700], 'warning-surface': neutral[100], error: primary[800], 'error-surface': primary[50], success: primary[700], 'success-surface': primary[50],
    'hero-field': primary[50], 'preview-field': neutral[100], 'support-blue': primary[300], 'support-purple': primary[700], muted: neutral[500], 'photo-mat': neutral[100],
  },
  dark: {
    background: secondary[950], surface: secondary[900], 'surface-raised': secondary[800], 'surface-hover': secondary[700],
    border: secondary[400], 'border-subtle': secondary[700], text: neutral[50], 'text-secondary': neutral[300],
    action: primary[400], accent: primary[300], ink: secondary[950],
    warning: neutral[200], 'warning-surface': secondary[800], error: primary[200], 'error-surface': secondary[800], success: primary[300], 'success-surface': secondary[800],
    'hero-field': secondary[900], 'preview-field': secondary[900], 'support-blue': primary[400], 'support-purple': primary[300], muted: neutral[400], 'photo-mat': secondary[800],
  },
};
export default { primary, secondary, neutral };
