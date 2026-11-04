import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { semanticColors, primary, secondary, neutral } from '../src/data/config/colors.js';

test('shared blue/navy themes keep text, controls and states readable in both modes', () => {
  const luminance = hex => {
    const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return channels.reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  };
  const contrast = (a, b) => {
    const [low, high] = [luminance(a), luminance(b)].sort((a, b) => a - b);
    return (high + .05) / (low + .05);
  };
  for (const [mode, tokens] of Object.entries(semanticColors)) {
    for (const foreground of ['text', 'text-secondary', 'accent', 'success', 'warning', 'error']) {
      for (const background of ['background', 'surface', 'surface-raised', 'surface-hover', 'hero-field', 'preview-field']) assert.ok(contrast(tokens[foreground], tokens[background]) >= 4.5, `${mode}: ${foreground} on ${background}`);
    }
    for (const background of ['action', 'accent']) assert.ok(contrast(tokens.ink, tokens[background]) >= 4.5, `${mode}: button ink on ${background}`);
    for (const state of ['success', 'warning', 'error']) assert.ok(contrast(tokens[state], tokens[`${state}-surface`]) >= 4.5, `${mode}: ${state}`);
    assert.ok(contrast(tokens.border, tokens.background) >= 3, `${mode}: input boundary`);
  }
  assert.ok(contrast(neutral[200], secondary[950]) >= 4.5, 'hero supporting text');
  assert.ok(contrast(neutral.white, primary[600]) >= 4.5, 'composer submit action');
});

test('self-hosted variable fonts and their original license notices ship with the app', async () => {
  const [index, css] = await Promise.all([readFile('index.html', 'utf8'), readFile('public/fonts/fonts.css', 'utf8')]);
  assert.match(index, /rel="preload" href="\/fonts\/satoshi-variable\.woff2"/);
  for (const family of ['satoshi', 'clash-grotesk']) {
    const font = await readFile(`public/fonts/${family}-variable.woff2`);
    assert.equal(font.subarray(0, 4).toString(), 'wOF2');
    assert.match(css, new RegExp(`${family}-variable\\.woff2`));
    assert.match(await readFile(`public/fonts/${family}-license.txt`, 'utf8'), /Free Font Licen[cs]e/i);
  }
  assert.equal((css.match(/font-display: swap/g) || []).length, 2);
});
