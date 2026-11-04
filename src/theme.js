export const THEME_STORAGE_KEY = 'accelerate:theme';
export const THEMES = { light: 'light', dark: 'dark' };

export function storedTheme() {
  try { const value = window.localStorage.getItem(THEME_STORAGE_KEY); return Object.values(THEMES).includes(value) ? value : null; } catch { return null; }
}
export const systemTheme = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? THEMES.dark : THEMES.light;
export const initialTheme = () => storedTheme() || systemTheme();
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle(THEMES.dark, theme === THEMES.dark);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
