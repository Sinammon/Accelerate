import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme, initialTheme, storedTheme, systemTheme, THEMES, THEME_STORAGE_KEY } from './theme.js';

const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const systemChanged = () => { if (!storedTheme()) setTheme(systemTheme()); };
    const storageChanged = event => { if (event.key === THEME_STORAGE_KEY || event.key === null) setTheme(initialTheme()); };
    media?.addEventListener?.('change', systemChanged);
    window.addEventListener('storage', storageChanged);
    return () => { media?.removeEventListener?.('change', systemChanged); window.removeEventListener('storage', storageChanged); };
  }, []);
  function toggleTheme() {
    const next = theme === THEMES.dark ? THEMES.light : THEMES.dark;
    try { window.localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
    applyTheme(next); setTheme(next);
  }
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
