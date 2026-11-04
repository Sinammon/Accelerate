import React from 'react';
import Icon from './Icons.jsx';
import { useTheme } from './ThemeProvider.jsx';

export default function ThemeSwitch({ overHero = false }: { overHero?: boolean }) {
  const context = useTheme();
  if (!context) return null;
  const dark = context.theme === 'dark';
  return <button type="button" className={`theme-switch size-11 shrink-0 rounded-full border p-0 transition-colors ${overHero ? 'border-white/20 bg-white/5 text-white hover:bg-white/15 focus-visible:outline-primary-400' : 'border-divider bg-transparent text-content hover:bg-panel-raised focus-visible:outline-primary-700 dark:border-secondary-700 dark:text-neutral-50 dark:focus-visible:outline-primary-400'}`} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} aria-pressed={dark} onClick={context.toggleTheme}><Icon name={dark ? 'sun' : 'moon'} size={18} /></button>;
}
