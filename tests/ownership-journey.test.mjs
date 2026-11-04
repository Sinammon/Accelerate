import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

async function setup(url = 'http://localhost') {
  const dom = new JSDOM('<div id="root"></div>', { url, pretendToBeVisual: true });
  const saved = new Map();
  const globals = { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, SVGElement: dom.window.SVGElement,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window), requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window), IS_REACT_ACT_ENVIRONMENT: true };
  for (const [key, value] of Object.entries(globals)) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  dom.window.matchMedia = query => ({ matches: query.includes('prefers-reduced-motion'), media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.scrollTo = () => {};
  dom.window.Element.prototype.scrollIntoView = () => {};
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const root = createRoot(document.getElementById('root'));
  const change = async (selector, value) => React.act(async () => {
    const input = typeof selector === 'string' ? document.querySelector(selector) : selector;
    assert.ok(input, `Missing input ${selector}`);
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, String(value));
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  const go = async page => React.act(async () => {
    window.location.hash = page;
    window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
    await new Promise(resolve => setTimeout(resolve, 15));
  });
  return { React, dom, vite, root, change, go, async close() {
    await React.act(async () => root.unmount()); await vite.close(); dom.window.close();
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  } };
}

test('calculator compares four cars, validates edits, preserves sources and separates cash savings from salary guidance', async () => {
  const ctx = await setup();
  try {
    const { React, vite, root, change } = ctx;
    const { default: Calculator } = await vite.ssrLoadModule('/src/OwnershipCalculator.jsx');
    const { createOwnershipState } = await vite.ssrLoadModule('/src/ownership-calculator.js');
    const { DEFAULT_SCENARIO } = await vite.ssrLoadModule('/shared/experience.js');
    const cars = Array.from({ length: 4 }, (_, i) => ({ legacyItemId: `car-${i}`, year: '2018', make: 'Example', model: `Contender ${i + 1}`, priceCAD: { value: String(20000 + i * 1000), currency: 'CAD' }, enrichment: { fuel: { status: 'matched', combined: 6, source: 'https://example.test/energy' } } }));
    cars[2] = { ...cars[2], description: 'Fuel type: Electric.', enrichment: { catalog: { candidates: [{ market: 'CA', energy: { value: 20, unit: 'kWh/100 km' } }] } } };
    cars[3] = { ...cars[3], enrichment: { catalog: { candidates: [{ market: 'CA', powertrain: 'Plug-in Hybrid', energy: { value: 8, unit: 'L/100 km', secondaryFuel: 'Electricity', kwhPer100Km: 20 } }] } } };
    let updateCars, currentState, currentScenario;
    function Harness() {
      const [state, setState] = React.useState(createOwnershipState);
      const [scenario, setScenario] = React.useState(DEFAULT_SCENARIO);
      const [vehicles, setCars] = React.useState(cars);
      updateCars = setCars; currentState = state; currentScenario = scenario;
      return React.createElement(Calculator, { cars: vehicles, state, setState, scenario, setScenario });
    }
    await React.act(async () => root.render(React.createElement(Harness)));
    const field = name => `[data-field="${name}"]`;
    assert.equal(document.querySelectorAll('table').length, 2);
    for (const table of document.querySelectorAll('table')) assert.equal(table.querySelectorAll('thead th').length, 5);
    assert.equal(document.querySelector('.ownership-method button[aria-pressed="true"]').textContent, 'Cash');
    assert.equal(document.querySelectorAll('.ownership-results > li').length, 4);
    assert.match(document.querySelector('.ownership-results').textContent, /Gross salary for comfortable running costs.*\$49,981\/year/s);
    assert.match(document.querySelector('.ownership-table').textContent, /\$23,100/);
    assert.match(document.body.textContent, /Ontario average—not a quote for this vehicle.*June 2026.*FSRA/s);
    assert.ok(document.querySelector('a[href="https://example.test/energy"]'));
    const energyAmounts = () => [...document.querySelectorAll('table')[1].querySelectorAll('tbody tr:first-child .ownership-amount')].map(el => el.textContent);
    assert.deepEqual(energyAmounts(), ['$1,530', '$1,530', '$450', '$1,245']);
    await change(field('pricePerKwh'), '0.20');
    assert.deepEqual(energyAmounts(), ['$1,530', '$1,530', '$600', '$1,320']);
    await change(field('electricShare'), '100');
    assert.deepEqual(energyAmounts(), ['$1,530', '$1,530', '$600', '$600']);
    for (const input of document.querySelectorAll('input')) {
      assert.ok(document.querySelector(`label[for="${input.id}"]`));
      if (input.closest('td')) assert.match(document.querySelector(`label[for="${input.id}"]`).textContent, /Contender/);
    }
    assert.ok([...document.querySelectorAll('[role="region"]')].every(region => region.tabIndex === 0 && document.getElementById(region.getAttribute('aria-labelledby'))));
    await change(field('salary'), '100000');
    assert.match(document.querySelector('.ownership-result-status').textContent, /Comfortable running costs/);
    const assessed = document.querySelector('.ownership-results').textContent;
    await change(field('savingsMonths'), '12');
    assert.equal(document.querySelector('.ownership-results').textContent, assessed, 'savings goal never inflates running assessment');
    assert.match(document.querySelector('.ownership-savings').textContent, /\$1,925/);
    await change(field('insuranceAnnual'), '');
    assert.equal(document.querySelector(field('insuranceAnnual')).getAttribute('aria-invalid'), 'true');
    assert.equal(document.querySelector('.ownership-result-status').textContent, 'Complete the estimates to assess this car');
    assert.equal(document.querySelectorAll('.ownership-results > li')[1].querySelector('.ownership-result-status').textContent, 'Comfortable running costs', 'one invalid car does not block others');
    await change(field('insuranceAnnual'), '3000');
    await change(field('energyOverride'), '1200');
    await change(field('annualKm'), '10000');
    assert.equal(currentScenario.annualKm, 10000);
    await change(field('annualKm'), '');
    assert.match(document.querySelector('.ownership-result-status').textContent, /Complete/);
    await change(field('annualKm'), '1.5');
    assert.equal(document.querySelector(field('annualKm')).getAttribute('aria-invalid'), 'true');
    assert.match(document.querySelector('.ownership-result-status').textContent, /Complete/, 'invalid whole-number drafts never supply a calculation');
    await change(field('annualKm'), '12000');
    await change(field('purchasePrice'), '25000');
    await change(field('taxOverride'), '100');
    await React.act(async () => updateCars(cars.map(car => ({ ...car, enrichment: { fuel: { status: 'matched', combined: 9 } } }))));
    assert.equal(document.querySelector(field('insuranceAnnual')).value, '3000');
    assert.equal(document.querySelector(field('purchasePrice')).value, '25000');
    assert.equal(document.querySelector(field('energyOverride')).value, '1200');
    assert.equal(currentState.vehicles['car-0'].taxOverride, '100');
    await React.act(async () => document.querySelectorAll('.ownership-method button')[1].click());
    assert.equal(document.querySelector('.ownership-savings'), null);
    assert.match(document.querySelector('.ownership-table').textContent, /Monthly loan payment.*Total loan interest.*Total purchase repayment/s);
    await change(field('downPayment'), '999999');
    assert.match(document.querySelector(field('downPayment')).nextElementSibling.textContent, /cannot exceed/);
    assert.match(document.querySelector('.ownership-result-status').textContent, /Complete/);
    await change(field('downPayment'), '1000');
    await change(field('apr'), '0');
    await change(field('stretchedPercent'), '15');
    assert.match(document.querySelector('.ownership-result-status').textContent, /Complete/);
    assert.equal(document.querySelector(field('stretchedPercent')).getAttribute('aria-invalid'), 'true');
    await change(field('stretchedPercent'), '20');
    await change(field('salary'), '0');
    assert.equal(document.querySelector(field('salary')).getAttribute('aria-invalid'), 'true');
    assert.match(document.querySelector('.ownership-result-status').textContent, /Enter your salary/);
    assert.doesNotMatch(document.body.textContent, /NaN|Infinity/);
    assert.equal(window.localStorage.length, 0);
    await React.act(async () => updateCars([]));
    assert.equal(document.querySelectorAll('table').length, 0);
    assert.match(document.querySelector('.empty-state').textContent, /Add cars/);
  } finally { await ctx.close(); }
});

test('ownership journey preserves private inputs, cleans removed cars, resets on clearing and survives empty direct entry', async () => {
  const ctx = await setup('http://localhost/#ownership');
  const originalFetch = globalThis.fetch;
  try {
    const { React, vite, root, change, go } = ctx;
    const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
    const requests = [];
    globalThis.fetch = async (url, options = {}) => {
      requests.push({ url: String(url), body: options.body });
      if (url === '/api/import') {
        const id = JSON.parse(options.body).url.match(/(\d+)$/)[1];
        return new Response(JSON.stringify({ vehicle: { legacyItemId: id, year: '2018', make: 'Example', model: `Car ${id}`, priceCAD: { value: '20000', currency: 'CAD' }, images: [], itemSpecifics: [] } }), { headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 503 });
    };
    await React.act(async () => root.render(React.createElement(App)));
    assert.match(document.querySelector('.empty-state').textContent, /Add cars/);
    assert.equal(document.querySelector('h1'), document.activeElement);
    await go('decide');
    assert.equal(document.querySelector('.ownership-cta'), null);
    const add = async id => {
      await go('import');
      await change('#listing-url', `https://www.ebay.ca/itm/${id}`);
      await React.act(async () => {
        document.querySelector('form').dispatchEvent(new ctx.dom.window.Event('submit', { bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 25));
      });
      assert.equal(window.location.hash, '#compare', document.querySelector('#import-error')?.textContent);
    };
    await add('111111111111');
    await add('222222222222');
    await add('333333333333');
    await go('decide');
    for (const mode of document.querySelectorAll('.mode-card')) {
      await React.act(async () => mode.click());
      assert.equal(document.querySelector('.ownership-cta a').getAttribute('href'), '#ownership');
    }
    await React.act(async () => {
      document.querySelector('.ownership-cta a').click();
      await new Promise(resolve => setTimeout(resolve, 30));
    });
    assert.equal(window.location.hash, '#ownership');
    assert.equal(document.activeElement, document.querySelector('h1'));
    assert.equal(document.querySelector('.workflow [aria-current="step"]').getAttribute('href'), '#decide');
    assert.equal(document.querySelectorAll('table').length, 2);
    await change('[data-field="salary"]', '120000');
    await change('[data-field="insuranceAnnual"]', '999');
    await go('decide');
    await go('ownership');
    assert.equal(document.querySelector('[data-field="salary"]').value, '120000');
    assert.equal(document.querySelector('[data-field="insuranceAnnual"]').value, '999');
    await change('[data-field="annualKm"]', '10000');
    await go('compare');
    assert.equal(document.querySelectorAll('.car-card').length, 3);
    assert.equal(document.querySelector('.scenario-panel input').value, '10000', 'shared driving assumptions survive navigation');
    await React.act(async () => document.querySelector('.remove-button').click());
    await go('ownership');
    assert.equal(document.querySelector('[data-field="insuranceAnnual"]').value, '2218');
    assert.equal(document.querySelectorAll('.ownership-results > li').length, 2);
    await add('111111111111');
    await go('ownership');
    assert.equal([...document.querySelectorAll('[data-field="insuranceAnnual"]')].at(-1).value, '2218', 'removed IDs do not regain discarded overrides when re-imported');
    assert.equal(document.querySelector('[data-field="salary"]').value, '120000');
    assert.doesNotMatch(JSON.stringify(requests), /salary|takeHomePercent|insuranceAnnual|maintenancePerKm/, 'financial inputs never enter network requests');
    await go('compare');
    await React.act(async () => {
      document.querySelector('.comparison-options').open = true;
      document.querySelector('[data-action="clear-comparison"]').click();
    });
    await React.act(async () => document.querySelector('.nav-demo').click());
    await go('ownership');
    assert.equal(document.querySelector('[data-field="salary"]').value, '');
    assert.equal(document.querySelector('[data-field="insuranceAnnual"]').value, '2218', 're-imported removed IDs do not regain old overrides');
    assert.equal(document.querySelector('.ownership-method button[aria-pressed="true"]').textContent, 'Cash');
    assert.ok([...Array(window.localStorage.length)].every((_, i) => !/salary|ownership/.test(window.localStorage.key(i))));
  } finally { globalThis.fetch = originalFetch; await ctx.close(); }
});
