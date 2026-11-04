import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { THEME_STORAGE_KEY, initialTheme } from '../src/theme.js';

test('dashboard themes persist across the real import, comparison and decision workflow', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/dashboard', pretendToBeVisual: true });
  const previous = new Map(['window', 'document', 'HTMLElement', 'Element', 'SVGElement', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'IS_REACT_ACT_ENVIRONMENT', 'fetch'].map(key => [key, globalThis[key]]));
  for (const key of ['window', 'document', 'HTMLElement', 'Element', 'SVGElement']) globalThis[key] = dom.window[key];
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.matchMedia = query => ({ matches: query.includes('prefers-reduced-motion'), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  dom.window.scrollTo = () => {};
  dom.window.Element.prototype.scrollIntoView = () => {};
  dom.window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
  globalThis.fetch = async path => {
    if (String(path).startsWith('/data/')) return Response.json(JSON.parse(await readFile(`public${path}`, 'utf8')));
    throw new Error('The fictional demo must not require a live API');
  };
  const React = await import('react'), { createRoot } = await import('react-dom/client');
  const { act } = React;
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const root = createRoot(document.getElementById('root'));
  try {
    const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
    await act(async () => root.render(React.createElement(App)));
    assert.equal(window.location.pathname, '/dashboard');
    assert.equal(document.documentElement.dataset.theme, 'dark');
    assert.equal(document.querySelectorAll('[aria-label="What Accelerate offers"] > div').length, 4);
    assert.match(document.querySelector('h1').textContent, /Find the right car.*Without the guesswork/);
    const originalHero = document.querySelector('.dashboard-hero').innerHTML;
    await act(async () => document.querySelector('.theme-switch').click());
    assert.equal(document.documentElement.classList.contains('dark'), false);
    assert.equal(window.localStorage.getItem(THEME_STORAGE_KEY), 'light');
    assert.equal(document.querySelector('.dashboard-hero').innerHTML, originalHero, 'theme changes preserve geometry and product controls');
    await act(async () => [...document.querySelectorAll('.value-section button')].find(button => button.textContent.includes('Explore the comparison')).click());
    assert.equal(document.querySelector('.dashboard-preview').open, true);
    assert.equal(document.activeElement, document.querySelector('.dashboard-preview > summary'));
    await act(async () => {
      document.querySelector('.hero-composer .demo-entry button').click();
      await new Promise(resolve => setTimeout(resolve, 30));
    });
    const count = document.querySelectorAll('.car-card').length;
    assert.ok(count > 0);
    assert.equal(window.location.hash, '#compare');
    assert.match(document.querySelector('.comparison-table').textContent, /CAD\/year.*Ride quality.*Seat cushioning.*Seat heating/s);
    await act(async () => document.querySelector('.theme-switch').click());
    assert.equal(document.documentElement.dataset.theme, 'dark');
    assert.equal(document.querySelectorAll('.car-card').length, count);
    await act(async () => {
      window.location.hash = 'decide';
      window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    });
    assert.equal(document.querySelectorAll('.mode-card').length, 5);
    assert.match(document.querySelector('.vehicle-experience').textContent, /CAD\/year.*Ride quality.*Seat cushioning.*Seat heating.*Cabin quietness/s);
    assert.equal(document.documentElement.dataset.theme, 'dark');
    assert.equal(document.querySelectorAll('.ranking-row').length, count);
    await act(async () => {
      window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
      window.dispatchEvent(new window.StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'light' }));
    });
    assert.equal(document.documentElement.dataset.theme, 'light');
    assert.equal(document.querySelectorAll('.ranking-row').length, count);
  } finally {
    await act(async () => root.unmount());
    await vite.close(); dom.window.close();
    for (const [key, value] of previous) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});

test('theme selection recovers from blocked storage and follows the system when unset', () => {
  const previousWindow = globalThis.window;
  try {
    globalThis.window = { matchMedia: () => ({ matches: true }), get localStorage() { throw new Error('Storage blocked'); } };
    assert.equal(initialTheme(), 'dark');
    globalThis.window.matchMedia = () => ({ matches: false });
    assert.equal(initialTheme(), 'light');
  } finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; }
});

test('compiled dashboard lighting and base typography have declared shared tokens', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const result = await vite.transformRequest('/src/app.css?direct');
    const css = result.code;
    const declarations = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
    const references = [...css.matchAll(/var\((--(?:color-(?:primary|secondary|neutral)-[\w-]+|font-(?:sans|display)))/g)].map(match => match[1]);
    assert.ok(references.length > 0, 'the visual treatment uses shared tokens');
    assert.deepEqual([...new Set(references.filter(token => !declarations.has(token)))], [], 'undeclared tokens would disable lighting or font rules');
    assert.match(css, /--font-sans:\s*Satoshi/);
    assert.match(css, /--font-display:\s*Clash Grotesk/);
    assert.ok(!css.includes('@apply') && !css.includes('@config'), 'production style directives are expanded');
  } finally { await vite.close(); }
});
