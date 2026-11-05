import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

test('configuration editor saves market and mileage, rejects incomplete corrections, resets and ignores superseded enrichment', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true });
  const globals = { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, SVGElement: dom.window.SVGElement, getComputedStyle: dom.window.getComputedStyle.bind(dom.window), requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window), IS_REACT_ACT_ENVIRONMENT: true };
  const saved = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  dom.window.matchMedia = query => ({ matches: query.includes('prefers-reduced-motion'), addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.scrollTo = () => {};
  dom.window.Element.prototype.scrollIntoView = () => {};
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const root = createRoot(document.getElementById('root'));
  const originalFetch = globalThis.fetch;
  let releaseOld;
  let oldSignal;
  let catalogCalls = 0;
  let imports = 0;
  const epa = { version: 'synthetic-editor', columns: ['id', 'year', 'make', 'model', 'displ', 'cylinders', 'trany', 'drive', 'fuelType1', 'VClass', 'comb08'], rows: [
    ['1', '2018', 'Honda', 'Accord', '1.5', '4', 'Automatic (AV-S7)', 'Front-Wheel Drive', 'Regular Gasoline', 'Large Cars', '33'],
    ['2', '2018', 'Honda', 'Accord', '2', '4', 'Automatic (S10)', 'Front-Wheel Drive', 'Regular Gasoline', 'Large Cars', '27'],
  ] };
  const nrcan = { columns: ['year', 'make', 'model', 'displacement', 'cylinders', 'transmission', 'fuel', 'combined'], rows: [[2018, 'Honda', 'Accord', 1.5, 4, 'AV', 'X', 7], [2018, 'Honda', 'Accord', 2, 4, 'AS10', 'X', 8]] };
  globalThis.fetch = async (url, options = {}) => {
    if (url === '/api/import') { imports++; return Response.json({ vehicle: { legacyItemId: '111111111111', year: 2018, make: 'Honda', model: 'Accord', location: { country: 'CA' }, mileage: { raw: '154865' }, images: [], itemSpecifics: [] } }); }
    if (String(url).startsWith('/data/fuel/')) return Response.json(nrcan);
    if (String(url).startsWith('/data/catalog/')) {
      if (++catalogCalls === 1) { oldSignal = options.signal; return new Promise(resolve => { releaseOld = () => resolve(Response.json(epa)); }); }
      return Response.json(epa);
    }
    return Response.json({ modelSpecs: { status: 'not-configured', fields: {}, reason: 'Synthetic provider unavailable.' } });
  };
  const change = async (selector, value) => React.act(async () => {
    const input = document.querySelector(selector);
    assert.ok(input, selector);
    const select = input.tagName === 'SELECT';
    Object.getOwnPropertyDescriptor(select ? dom.window.HTMLSelectElement.prototype : dom.window.HTMLInputElement.prototype, 'value').set.call(input, String(value));
    input.dispatchEvent(new dom.window.Event(select ? 'change' : 'input', { bubbles: true }));
  });
  const submit = async selector => React.act(async () => {
    document.querySelector(selector).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 40));
  });
  try {
    const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
    await React.act(async () => root.render(React.createElement(App)));
    await change('#listing-url', 'https://www.ebay.ca/itm/111111111111');
    await submit('form');
    assert.ok(releaseOld);
    await React.act(async () => document.querySelector('.view-details').click());
    assert.equal(document.querySelector('#reference-market-111111111111').selectedOptions[0].textContent, 'Automatic · CA');
    assert.equal(document.querySelector('#mileage-111111111111').value, '154865');
    assert.equal(document.querySelector('#mileage-unit-111111111111').value, '');
    await change('#reference-market-111111111111', 'US');
    await change('#mileage-111111111111', '50000');
    await submit('.vehicle-details-editor form');
    assert.match(document.querySelector('.vehicle-details-editor [role="alert"]').textContent, /choose km or miles/);
    assert.equal(oldSignal.aborted, false, 'invalid corrections do not cancel the active import');
    await change('#mileage-unit-111111111111', 'mi');
    await submit('.vehicle-details-editor form');
    assert.equal(oldSignal.aborted, true, 'saving aborts enrichment for the superseded vehicle');
    assert.equal(document.querySelector('#reference-market-111111111111').value, 'US');
    assert.ok([...document.querySelector('#configuration-111111111111').options].slice(1).every(option => option.textContent.startsWith('US reference')));
    assert.match(document.querySelector('.car-card').textContent, /50000 mi · User-entered/);
    assert.match(document.querySelector('.mileage-evidence').textContent, /Original imported mileage evidence.*154865/s);
    await React.act(async () => { releaseOld(); await new Promise(resolve => setTimeout(resolve, 40)); });
    assert.equal(document.querySelector('#reference-market-111111111111').value, 'US');
    assert.match(document.querySelector('.car-card').textContent, /50000 mi · User-entered/);
    await change('#configuration-111111111111', 'epa:1');
    await change('#edit-111111111111-horsepower', '192');
    assert.equal(document.querySelector('#configuration-111111111111').value, 'epa:1', 'compatible corrections keep selection');
    await submit('.vehicle-details-editor form');
    await change('#edit-111111111111-displacement', '2');
    assert.equal(document.querySelector('#configuration-111111111111').value, '', 'incompatible corrections clear selection');
    await change('#reference-market-111111111111', 'CA');
    assert.ok([...document.querySelector('#configuration-111111111111').options].slice(1).every(option => option.textContent.startsWith('CA reference')));
    await React.act(async () => {
      [...document.querySelectorAll('.vehicle-details-editor button')].find(button => button.textContent === 'Reset to original import').click();
      await new Promise(resolve => setTimeout(resolve, 40));
    });
    assert.equal(document.querySelector('#reference-market-111111111111').value, '');
    assert.equal(document.querySelector('#mileage-111111111111').value, '154865');
    assert.match(document.querySelector('.car-card').textContent, /154865 km \(assumed\)/);
    assert.equal(document.querySelector('.mileage-evidence'), null);
    assert.equal(imports, 1);
  } finally {
    releaseOld?.();
    await React.act(async () => root.unmount());
    await vite.close();
    dom.window.close();
    globalThis.fetch = originalFetch;
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
});
