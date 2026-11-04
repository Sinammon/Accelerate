import plugin from 'tailwindcss/plugin';
import { primary, secondary, neutral, semanticColors } from './src/data/config/colors.js';

const properties = values => Object.fromEntries(Object.entries(values).map(([key, value]) => [`--${key}`, value]));
const fontFamily = { sans: ['Satoshi', 'sans-serif'], display: ['Clash Grotesk', 'sans-serif'] };
const paletteProperties = Object.fromEntries(Object.entries({ primary, secondary, neutral }).flatMap(([palette, colors]) => Object.entries(colors).map(([shade, value]) => [`--color-${palette}-${shade}`, value])));

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: { primary, secondary, neutral, canvas: 'var(--background)', panel: 'var(--surface)', 'panel-raised': 'var(--surface-raised)', content: 'var(--text)', subdued: 'var(--text-secondary)', divider: 'var(--border-subtle)' },
      fontFamily,
    },
  },
  plugins: [plugin(({ addBase }) => addBase({ ':root': { ...paletteProperties, '--font-sans': fontFamily.sans.join(', '), '--font-display': fontFamily.display.join(', '), ...properties(semanticColors.light) }, ':root.dark': properties(semanticColors.dark) }))],
};
