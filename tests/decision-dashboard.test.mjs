import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { DISCRIMINATORS } from '../shared/model-specs.js';
import { comfortReferenceCars } from './fixtures/comfort-reference.mjs';
import { ratedCar } from './fixtures/scoring-fixtures.mjs';
import { vinMismatches } from '../src/vehicle-specs.js';

test('three-page journey preserves imports, supports all modes, removes and replaces cars, and handles unknown data', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.SVGElement = dom.window.SVGElement;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  // Use the accessible no-animation path for deterministic functional tests.
  dom.window.matchMedia = query => ({ matches: query.includes('prefers-reduced-motion'), media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  dom.window.Element.prototype.scrollIntoView = () => {};
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.scrollTo = () => {};
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { act } = React;
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const root = createRoot(document.getElementById('root'));
  const originalFetch = globalThis.fetch;
  try {
    const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
    await act(async () => root.render(React.createElement(App)));
    const menuButton = document.querySelector('.nav-menu-toggle');
    assert.equal(menuButton.getAttribute('aria-expanded'), 'false');
    await act(async () => menuButton.click());
    assert.equal(menuButton.getAttribute('aria-expanded'), 'true');
    assert.ok(document.querySelector('#primary-navigation.is-open'));
    await act(async () => menuButton.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(menuButton.getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, menuButton, 'Escape returns focus to the disclosure trigger');
    await act(async () => menuButton.click());
    await act(async () => { document.querySelector('#primary-navigation a').click(); await new Promise(resolve => setTimeout(resolve, 20)); });
    await act(async () => { document.querySelector('.nav-button').click(); await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.equal(menuButton.getAttribute('aria-expanded'), 'false', 'selecting navigation closes the mobile menu');
    assert.equal(document.querySelector('h1').textContent, 'Compare your eBay.ca shortlist');
    assert.equal(document.querySelector('.mode-grid'), null);
    assert.equal(document.querySelectorAll('.preview-vehicle').length, 4);
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 0);
    const clickPreview = async selector => act(async () => {
      document.querySelector(selector).click();
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    await clickPreview('.preview-advance');
    assert.match(document.querySelector('.showcase-comparison').textContent, /Civic.*Corolla.*Mazda3/);
    await clickPreview('.preview-advance');
    assert.equal(document.querySelector('.preview-match h3').textContent, '2018 Honda Civic');
    await clickPreview('.sample-priorities button:nth-child(2)');
    assert.equal(document.querySelector('.preview-match h3').textContent, '2017 Mazda3');
    await clickPreview('.preview-advance');
    assert.equal(document.activeElement.id, 'listing-url');
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 0, 'sample data never enters the real shortlist');
    const tab = async id => act(async () => document.getElementById(`compare-tab-${id}`).click());
    const showSource = async (index = 0) => {
      await tab('sources');
      await act(async () => {
        const select = document.querySelector('#evidence-vehicle');
        select.value = select.options[index].value;
        select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      });
    };
    const clearComparison = async () => act(async () => { document.querySelector('.comparison-options').open = true; document.querySelector('[data-action="clear-comparison"]').click(); });
    const change = async (selector, value) => {
      if (selector === '#listing-url' && !document.querySelector('#listing-url')) await act(async () => { document.querySelector('.nav-button').click(); await new Promise(resolve => setTimeout(resolve, 20)); });
      const input = document.querySelector(selector);
      await act(async () => {
        Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, String(value));
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
    };
    const go = async page => {
      await act(async () => {
        window.location.hash = page;
        window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
        await new Promise(resolve => setTimeout(resolve, 10));
      });
    };
    const submit = async () => {
      const beforeCount = document.querySelectorAll('[data-shortlist-id]').length;
      await act(async () => {
        document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      if (document.querySelectorAll('[data-shortlist-id]').length > beforeCount) {
        assert.equal(document.querySelector('#compare-tab-overview').getAttribute('aria-selected'), 'true', 'imports start with the essentials');
        assert.equal(document.querySelector('#comparison-import').hidden, true, 'successful import collapses the inline form');
      }
      if (document.querySelector('#compare-tab-specifications')) await tab('specifications');
    };
    const add = async (id, price, year, description = '', unit = 'km', raw = '100000') => {
      globalThis.fetch = async () => new Response(JSON.stringify({ vehicle: {
        legacyItemId: id, title: `SELLER HEADLINE ${id}`, make: 'Example', model: id.slice(0, 1), priceCAD: { value: String(price), currency: 'CAD' }, year: String(year),
        mileage: raw == null ? null : { raw, unit }, images: ['https://images.example.test/front.jpg', 'https://images.example.test/rear.jpg'], itemSpecifics: [], description, sourceUrl: `https://www.ebay.ca/itm/${id}`,
      } }), { headers: { 'Content-Type': 'application/json' } });
      await change('#listing-url', `https://www.ebay.ca/itm/${id}`);
      await submit();
    };
    await change('#listing-url', 'https://example.com/itm/111111111111');
    await submit();
    assert.match(document.querySelector('#import-error').textContent, /eBay.ca/);
    assert.notEqual(window.location.hash, '#compare');
    await add('111111111111', 10000, 2016, 'Odometer: 100000 kms. Heated seats.', null, null);
    assert.equal(window.location.hash, '#compare');
    assert.equal(document.querySelector('h1').textContent, 'Compare cars');
    assert.equal(document.querySelector('.vehicle-name').textContent, '2016 Example 1');
    assert.match(document.querySelector('tbody').textContent, /100000 km/);
    assert.doesNotMatch(document.querySelector('tbody').textContent, /Unit unknown|conflict/);
    await tab('sources');
    assert.equal(document.querySelector('.source-photo .vehicle-image img').getAttribute('src'), 'https://images.example.test/front.jpg');
    await act(async () => document.querySelector('.source-photo .photo-next').click());
    assert.equal(document.querySelector('.source-photo .vehicle-image img').getAttribute('src'), 'https://images.example.test/rear.jpg');
    await act(async () => document.querySelector('.source-photo .photo-next').click());
    assert.equal(document.querySelector('.source-photo .vehicle-image img').getAttribute('src'), 'https://images.example.test/front.jpg');
    await tab('specifications');
    assert.equal(document.querySelectorAll('table:first-of-type tbody tr').length >= 2, true);
    assert.equal(document.querySelectorAll('.table-scroll')[0].querySelectorAll('tbody tr').length, 9, 'fully unknown specification rows are omitted');
    assert.match(document.querySelector('.shared-gaps').textContent, /Transmission/);
    await tab('sources');
    assert.equal(document.querySelectorAll('.feature-evidence > div').length, 1, 'only explicit amenity claims appear');
    await tab('specifications');
    assert.equal(document.querySelector('.mode-grid'), null);
    await tab('overview');
    assert.match(document.querySelector('table').textContent, /Annual fuel \/ charging cost.*CAD\/year.*Comfort.*Ride.*Seats.*Practicality/s);
    await change('.scenario-panel input', '10000');
    const costText = () => document.querySelector('tbody tr:nth-child(3)').textContent;
    const validCost = costText();
    await change('.scenario-panel input', '');
    assert.equal(document.querySelector('.scenario-panel input').getAttribute('aria-invalid'), 'true');
    assert.equal(costText(), validCost);
    await go('decide');
    assert.equal(document.querySelector('.scenario-panel'), null);
    assert.ok(document.querySelectorAll('.decision-reasons > li').length <= 6);
    await go('compare');
    await tab('overview');
    assert.equal(document.querySelector('.scenario-panel input').value, '10000', 'last valid assumptions persist across routes');
    await change('.scenario-panel input', '15000');
    await go('compare');
    await tab('specifications');
    await add('222222222222', 20000, 2021, 'No heated seats.', null);
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 2);
    assert.match(document.querySelector('tbody').textContent, /km \(assumed\)/);
    assert.doesNotMatch(document.querySelectorAll('.car-card')[1].textContent, /Check mileage/);
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw new Error('Should not fetch duplicate'); };
    await change('#listing-url', 'https://www.ebay.ca/itm/111111111111');
    await submit();
    assert.equal(calls, 0);
    assert.match(document.querySelector('#import-error').textContent, /already/);
    await act(async () => {
      document.querySelector('#primary-navigation a[href="#decide"]').click();
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    assert.equal(document.querySelector('h1').textContent, 'Your recommendation');
    assert.equal(window.location.hash, '#decide');
    await act(async () => document.querySelector('.skip-link').click());
    assert.equal(window.location.hash, '#decide', 'skip navigation preserves the current stage');
    assert.equal(document.activeElement.id, 'main-content');
    assert.equal(document.querySelectorAll('input[type="range"]').length, 0);
    assert.equal(document.querySelectorAll('.mode-grid .mode-card').length, 5);
    assert.deepEqual([...document.querySelectorAll('.mode-grid .mode-card strong')].map(el => el.textContent), ['Best Value', 'Affordability', 'Comfort', 'Practicality', 'Performance']);
    assert.equal(document.querySelector('.more-mode-options'), null);
    assert.equal(document.querySelector('[data-mode="balanced"]'), null);
    assert.equal(document.querySelectorAll('.mode-card').length, 5);
    assert.ok(document.querySelector('.best-match'), 'unresearched listings receive provisional estimates');
    await act(async () => document.querySelector('.mode-card[data-mode="practical"]').click());
    assert.ok(document.querySelector('.best-match'));
    await act(async () => document.querySelector('.mode-card[data-mode="performance"]').click());
    assert.equal(document.querySelector('.decision-match').dataset.basis, 'guidance');
    assert.match(document.querySelector('.recommendation-badge').textContent, /More information needed/);
    await act(async () => document.querySelector('.mode-card[data-mode="comfort"]').click());
    assert.ok(document.querySelector('.best-match'), 'unresearched listings receive provisional estimates');
    assert.match(document.querySelector('.decision-reasons').textContent, /Ride quality.*Seat cushioning.*Cabin quietness.*Seat heating/s);
    await go('compare');
    await add('333333333333', 100, 2025, 'Engine problems. Coolant leak. Not running.');
    assert.match(document.querySelector('thead th:last-child .warning-details').textContent, /Engine concern.*Coolant leak/s, 'condition warnings remain visible while evidence sections are collapsed');
    await go('decide');
    await act(async () => document.querySelector('.mode-card[data-mode="cost"]').click());
    assert.equal(document.querySelector('.best-match h2').textContent, '2025 Example 3');
    assert.equal(document.querySelectorAll('.best-match [data-kind="warning"]').length, 1);
    assert.match(document.querySelector('.decision-warning-item').textContent, /Not running.*Engine concern.*Coolant leak/);
    assert.equal(document.querySelector('.decision-match .experience-comfort'), null);
    assert.match(document.querySelector('.decision-match-copy .decision-reasons').textContent, /Estimated annual fuel cost.*CAD\/year.*15,000 km\/year/s);
    assert.equal(document.querySelector('.decision-adjust-costs').getAttribute('href'), '#ownership');
    assert.match(document.querySelector('.decision-reasons').textContent, /Insurance.*Generic Ontario average/s);
    await act(async () => { document.querySelector('.decision-adjust-costs').click(); await new Promise(resolve => setTimeout(resolve, 25)); });
    assert.equal(window.location.hash, '#ownership');
    assert.equal(document.querySelector('#costs-tab-running').getAttribute('aria-selected'), 'true');
    await change('[data-field="annualKm"]', '10000');
    await go('decide');
    assert.match(document.querySelector('.decision-reasons').textContent, /10,000 km\/year/);
    await go('ownership');
    await change('[data-field="annualKm"]', '15000');
    await go('decide');
    await act(async () => document.querySelector('.mode-card[data-mode="value"]').click());
    assert.equal(document.querySelector('.ownership-costs'), null, 'ownership context appears under Affordability');
    assert.ok(document.querySelector('.best-match'));
    assert.equal(document.querySelector('.best-match h2').textContent, '2025 Example 3');
    await act(async () => document.querySelector('.mode-card[data-mode="practical"]').click());
    assert.equal(document.querySelector('.mode-card[data-mode="practical"]').getAttribute('aria-pressed'), 'true');
    await go('compare');
    await add('444444444444', 25000, 2023);
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 4);
    assert.equal(document.querySelector('.nav-button').disabled, true);
    assert.equal(document.querySelector('table thead').querySelectorAll('th').length, 5);
    await act(async () => document.querySelector('.remove-button').click());
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 3);
    assert.equal(document.querySelector('.nav-button').disabled, false);
    await add('555555555555', 15000, 2020);
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 4);
    assert.equal(document.querySelector('.vehicle-name').textContent, '2021 Example 2');
    await go('decide');
    assert.equal(document.querySelectorAll('.decision-match').length, 1);
    assert.match(document.querySelector('.decision-card-foot').textContent, /of 4 contenders/);
    assert.equal(document.querySelector('.mode-card[data-mode="practical"]').getAttribute('aria-pressed'), 'true');
    await go('compare');
    await clearComparison();
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 0);
    await go('decide');
    assert.match(document.querySelector('.result-banner').textContent, /shortlist comes first/);
    // Refresh clears the shortlist; only sanitized model specifications may persist.
    await act(async () => root.render(null));
    await act(async () => root.render(React.createElement(App)));
    assert.equal(document.querySelectorAll('.ranking-row').length, 0);
    // A late VIN response must not bring back a removed car or overwrite a replacement.
    await go('compare');
    let finishVin, importCount = 0;
    const pendingVin = new Promise(resolve => { finishVin = resolve; });
    globalThis.fetch = async input => {
      if (input === '/api/vehicle-data') return pendingVin;
      if (input === '/api/model-specs') return Response.json({ modelSpecs: { status: 'not-configured', fields: {} } });
      if (String(input).startsWith('/data/')) return Response.json({ columns: [], rows: [] });
      importCount++;
      return Response.json({ vehicle: { legacyItemId: '666666666666', year: importCount === 1 ? '2003' : '2020', make: 'Example', model: importCount === 1 ? 'Original' : 'Replacement', vin: importCount === 1 ? '1HGCM82633A004352' : null, images: [], itemSpecifics: [] } });
    };
    await change('#listing-url', 'https://www.ebay.ca/itm/666666666666');
    await submit();
    await tab('sources');
    assert.match(document.querySelector('.source-status').textContent, /Checking VIN/);
    await act(async () => document.querySelector('.remove-button').click());
    await change('#listing-url', 'https://www.ebay.ca/itm/666666666666');
    await submit();
    assert.equal(document.querySelector('.vehicle-name').textContent, '2020 Example Replacement');
    await act(async () => {
      finishVin(Response.json({ vin: { status: 'decoded', fields: { year: '2003', make: 'Example', model: 'Original' } } }));
      await new Promise(resolve => setTimeout(resolve, 40));
    });
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 1);
    assert.equal(document.querySelector('.vehicle-name').textContent, '2020 Example Replacement');
    // Research is nonblocking, fills Compare, and updates the selected decision mode.
    await clearComparison();
    const researchPending = [];
    let researchedImports = 0;
    const savedResponses = new Map();
    const researchField = (value, kind = 'value', model = 'Civic') => ({ kind, value: kind === 'value' ? value : null, minimum: 130, maximum: 180, alternatives: [], scope: { year: 2018, make: 'Honda', model }, sharedAcross: DISCRIMINATORS, evidence: [{ type: 'model-reference', source: 'Honda Canada', url: 'https://hondanews.ca/en-CA/specifications', quote: `${value} hp`, configuration: { year: 2018, make: 'Honda', model } }] });
    globalThis.fetch = async (input, init) => {
      if (String(input).startsWith('/data/')) return Response.json({ columns: [], rows: [] });
      if (input === '/api/model-specs') {
        const config = JSON.parse(init.body);
        if (['experience', 'ownership'].includes(config.domain)) return Response.json({ modelSpecs: { status: 'partial', fields: {} } });
        if (config.phase === 'research') return Response.json(savedResponses.get(config.model) || { modelSpecs: { status: 'unavailable', fields: {} } });
        return new Promise(resolve => researchPending.push({ signal: init.signal, resolve: async response => {
          const data = await response.json(); if (!init.signal.aborted) savedResponses.set(config.model, data); resolve(Response.json(data));
        } }));
      }
      if (input === '/api/vehicle-data') return Response.json({ vin: { status: 'decoded', fields: { year: '2018', make: 'Honda', model: 'CR-V', seats: 5 } } });
      researchedImports++;
      return Response.json({ vehicle: { legacyItemId: `${researchedImports}77777777777`, year: '2018', make: 'Honda', model: ['Civic', 'Accord', 'Fit', 'CR-V', 'Pilot'][researchedImports - 1], description: 'Odometer: 2k kms.', images: [], itemSpecifics: researchedImports === 4 ? [{ name: 'Seating capacity', value: '4' }] : [], vin: researchedImports === 4 ? '1HGCM82633A004352' : null } });
    };
    await change('#listing-url', 'https://www.ebay.ca/itm/177777777777');
    await submit();
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 1);
    await tab('sources');
    assert.match(document.querySelector('.source-status').textContent, /Looking up model/);
    await change('#listing-url', 'https://www.ebay.ca/itm/277777777777');
    await submit();
    await act(async () => {
      researchPending[0].resolve(Response.json({ modelSpecs: { status: 'matched', fields: { horsepower: researchField(158), torque: researchField(150, 'range') }, dimensionRatings: { rideQuality: { rating: 4, rationale: 'Synthetic reviewed ride assessment for this regression.', scope: { year: 2018, make: 'Honda', model: 'Civic' }, evidence: [{ source: 'Synthetic editorial fixture', url: 'https://reviews.example.test/fixture', quote: 'Synthetic ride evidence, not a real review.', editorial: true }] } }, searchSuggestions: '<div>Google Search</div>' } }));
      researchPending[1].resolve(Response.json({ modelSpecs: { status: 'matched', fields: { horsepower: researchField(132, 'value', 'Accord') } } }));
      await new Promise(resolve => setTimeout(resolve, 25));
    });
    assert.match(document.querySelector('table').textContent, /158.*Typical model spec/);
    assert.match(document.querySelector('table').textContent, /130–180.*excluded from scoring/);
    await tab('sources');
    assert.ok(document.querySelector('.spec-citation a[href="https://hondanews.ca/en-CA/specifications"]'));
    const attribution = document.querySelector('.search-attribution');
    assert.ok(attribution);
    assert.doesNotMatch(attribution.getAttribute('sandbox'), /allow-scripts|allow-same-origin/);
    await go('decide');
    await act(async () => document.querySelector('.mode-card[data-mode="performance"]').click());
    assert.equal(document.querySelector('.decision-match').dataset.basis, 'supported');
    assert.match(document.querySelector('.decision-reasons').textContent, /158 hp.*Typical model spec/);
    assert.equal(document.querySelector('.score-parts'), null);
    assert.ok(document.querySelectorAll('.decision-reasons > li').length <= 6);
    assert.equal(document.querySelector('.decision-key-facts'), null);
    // Retry research without reimporting; a failed retry preserves known specifications.
    await go('compare');
    await showSource();
    assert.match(document.querySelector('.vehicle-summary .research-control').textContent, /Research ready: 2 specifications/);
    assert.equal(document.querySelector('.vehicle-summary [data-action="model-research"]').textContent, 'Refresh research');
    await tab('overview');
    await act(async () => document.querySelector('.car-card .view-details').click());
    assert.equal(document.querySelector('#compare-tab-sources').getAttribute('aria-selected'), 'true', 'View details opens the correct evidence without another API request');
    assert.equal(document.activeElement, document.querySelector('.vehicle-summary'));
    assert.equal(document.querySelector('.vehicle-summary .model-research').open, true, 'View results opens dimension research even without broad notes');
    await act(async () => document.querySelector('.vehicle-summary [data-action="model-research"]').click());
    assert.equal(document.querySelector('.vehicle-summary [data-action="model-research"]').textContent, 'Restart research');
    await tab('specifications');
    assert.match(document.querySelector('table').textContent, /158/);
    await act(async () => {
      researchPending.at(-1).resolve(Response.json({ modelSpecs: { status: 'quota', fields: {}, reason: 'Free research quota reached.' } }));
      await new Promise(resolve => setTimeout(resolve, 15));
    });
    assert.match(document.querySelector('table').textContent, /158/);
    await showSource();
    assert.match(document.querySelector('.vehicle-summary').textContent, /Previous research is still available/);
    await tab('sources');
    assert.equal(document.querySelector('.source-status-grid .capability-details strong').textContent, '4 / 5', 'quota failure preserves previous dimension results');
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 2);
    assert.ok(window.localStorage.getItem('dilemma:model-specs:v1'));
    await act(async () => document.querySelector('[data-action="clear-saved-specs"]').click());
    assert.equal(window.localStorage.getItem('dilemma:model-specs:v1'), null);
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 2, 'clearing saved specs preserves the temporary shortlist');
    // A full shortlist must still search and retry its fourth car independently.
    for (const id of ['377777777777', '477777777777']) {
      await change('#listing-url', `https://www.ebay.ca/itm/${id}`);
      await submit();
    }
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 4);
    await showSource(3);
    const fourthCard = () => document.querySelector('.sources-workspace');
    const fourthAction = () => fourthCard().querySelector('[data-action="model-research"]');
    assert.match(fourthCard().textContent, /Seating capacity: listing 4; VIN record 5/);
    assert.equal(researchPending.length, 5, 'each import starts research, including the fourth');
    await act(async () => {
      researchPending.at(-1).resolve(Response.json({ modelSpecs: { status: 'unavailable', fields: {}, reason: 'Research service unavailable; retry.' } }));
      await new Promise(resolve => setTimeout(resolve, 15));
    });
    assert.equal(fourthAction().disabled, false, 'a full shortlist does not disable Retry');
    assert.equal(fourthAction().textContent, 'Retry research');
    await act(async () => fourthAction().click());
    assert.equal(researchPending.length, 6, 'Retry really sends a new search request');
    const abandonedFourth = researchPending.at(-1);
    assert.equal(fourthAction().disabled, false, 'pending research can be restarted if it gets stuck');
    assert.equal(fourthAction().textContent, 'Restart research');
    await act(async () => fourthAction().click());
    assert.equal(abandonedFourth.signal.aborted, true);
    assert.equal(researchPending.length, 7);
    assert.equal(researchPending[3].signal.aborted, false, 'restarting fourth-car research leaves the third car running');
    await act(async () => {
      researchPending.at(-1).resolve(Response.json({ modelSpecs: { status: 'matched', fields: { horsepower: researchField(158, 'value', 'CR-V') } } }));
      abandonedFourth.resolve(Response.json({ modelSpecs: { status: 'unavailable', fields: {}, reason: 'Stale fourth-car response' } }));
      researchPending[3].resolve(Response.json({ modelSpecs: { status: 'unavailable', fields: {}, reason: 'Third-car research unavailable' } }));
      await new Promise(resolve => setTimeout(resolve, 15));
    });
    assert.match(fourthCard().textContent, /Research ready: 1 specifications/);
    assert.doesNotMatch(fourthCard().textContent, /Stale fourth-car response|Third-car research unavailable/);
    assert.equal(fourthAction().textContent, 'Refresh research');
    // Clearing during another pending lookup aborts it; its late result cannot restore a car.
    await go('compare');
    await clearComparison();
    await change('#listing-url', 'https://www.ebay.ca/itm/377777777777');
    await submit();
    await act(async () => document.querySelector('.remove-button').click());
    assert.equal(researchPending.at(-1).signal.aborted, true);
    await act(async () => {
      researchPending.at(-1).resolve(Response.json({ modelSpecs: { status: 'matched', fields: { horsepower: researchField(158) } } }));
      await new Promise(resolve => setTimeout(resolve, 15));
    });
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 0);
    // Demo is explicit, uses only public bundled reference files, and supports sparse data.
    const demoRequests = [];
    globalThis.fetch = async url => {
      demoRequests.push(url);
      assert.match(url, /^\/data\/fuel\//);
      return Response.json(JSON.parse(await readFile(`public${url}`, 'utf8')));
    };
    await act(async () => {
      document.querySelector('.demo-entry button').click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 3);
    await tab('sources');
    assert.equal(demoRequests.length, 3);
    assert.match(document.querySelector('.demo-notice').textContent, /fictional/i);
    assert.match(document.querySelector('.source-status-grid').textContent, /Reference specifications and your entries.*Seller-reported claims.*Model advice.*Still to verify on this car/s);
    assert.ok(document.querySelector('.model-research a[href="https://www.caranddriver.com/honda/civic-2018"]'));
    await tab('specifications');
    // Fuel references load from disk asynchronously. Wait for their table row;
    // the sources panel is absent while Overview is selected and cannot signal readiness.
    for (let attempt = 0; attempt < 100 && document.querySelector('.table-scroll tbody').rows.length < 20; attempt++) {
      await act(async () => new Promise(resolve => setTimeout(resolve, 20)));
    }
    assert.equal(document.querySelector('.table-scroll').querySelectorAll('tbody tr').length, 20);
    assert.match(document.querySelector('.table-scroll').textContent, /Power \(hp\).*158.*132.*155/s);
    await tab('sources');
    assert.match(document.querySelector('.source-status-grid').textContent, /Factory reference/);
    assert.ok(document.querySelector('a[href*="hondanews.ca"]'), 'factory evidence links to the manufacturer');
    await go('decide');
    await act(async () => document.querySelector('.mode-card[data-mode="performance"]').click());
    assert.equal(document.querySelector('.decision-match').dataset.basis, 'supported');
    assert.match(document.querySelector('.recommendation-badge').textContent, /Provisional match/);
    assert.match(document.querySelector('.decision-reasons').textContent, /factory reference; not measured output/);
    assert.ok(document.querySelectorAll('.decision-reasons > li').length <= 6);
    assert.equal(document.querySelector('.research-guidance-grid'), null);
    await act(async () => document.querySelector('.mode-card[data-mode="comfort"]').click());
    assert.equal(document.querySelector('.decision-match').dataset.basis, 'supported');
    assert.match(document.querySelector('.decision-reasons').textContent, /Cabin quietness/);
    assert.doesNotMatch(document.querySelector('.decision-reasons').textContent, /CAD\/year/);
    await act(async () => document.querySelector('.mode-card[data-mode="value"]').click());
    assert.ok(document.querySelector('.best-match'));
    assert.match(document.querySelector('.decision-reasons').textContent, /Seller-reported/);
    const beforeLookup = document.querySelector('.decision-match h2').textContent;
    await act(async () => { document.querySelector('.decision-sources-link').click(); await new Promise(resolve => setTimeout(resolve, 25)); });
    assert.equal(window.location.hash, '#compare');
    assert.ok(document.querySelector('#evidence-vehicle').selectedOptions[0].textContent.includes(beforeLookup));
    let recallCalls = 0;
    globalThis.fetch = async (url, options) => {
      recallCalls++;
      assert.equal(url, '/api/recalls');
      assert.equal(options.cache, 'no-store');
      assert.deepEqual(Object.keys(JSON.parse(options.body)).sort(), ['make', 'model', 'year']);
      return Response.json({ recalls: { status: 'available', count: 0, campaigns: [], checked: '2026-10-29T12:00:00Z' } });
    };
    await act(async () => {
      document.querySelector('.recall-research button').click();
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    assert.equal(recallCalls, 1);
    assert.match(document.querySelector('.recall-research [role="status"]').textContent, /does not establish.*recall-free/);
    assert.ok(document.querySelector('#evidence-vehicle').selectedOptions[0].textContent.includes(beforeLookup), 'recalls preserve the selected source car');
    globalThis.fetch = async () => { throw new TypeError('offline'); };
    await act(async () => {
      document.querySelector('.recall-research button').click();
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    assert.match(document.querySelector('.recall-research [role="status"]').textContent, /Lookup unavailable/);

    // The actual app must show category evidence, not an amenity-count winner.
    await go('compare');
    await clearComparison();
    const references = comfortReferenceCars();
    let referenceIndex = 0;
    globalThis.fetch = async (url, options) => {
      if (String(url).startsWith('/data/')) return Response.json({ columns: [], rows: [] });
      if (url === '/api/model-specs') {
        const input = JSON.parse(options.body);
        const car = references.find(car => car.make === input.make && car.model === input.model);
        return Response.json({ modelSpecs: car.enrichment.modelSpecs });
      }
      return Response.json({ vehicle: { ...references[referenceIndex], images: [], legacyItemId: `${++referenceIndex}88888888888` } });
    };
    for (let index = 1; index <= 4; index++) {
      await change('#listing-url', `https://www.ebay.ca/itm/${index}88888888888`);
      await submit();
    }
    await go('decide');
    await act(async () => document.querySelector('[data-mode="comfort"]').click());
    assert.equal(document.querySelector('.best-match h2').textContent, '2025 Mercedes-Benz S-Class');
    assert.match(document.querySelector('.decision-reasons').textContent, /provisional/);
    assert.match(document.querySelector('.decision-reasons').textContent, /Ride quality.*Seat cushioning.*Cabin quietness.*Seat heating/s);
    assert.ok(document.querySelector('.decision-reasons a[href="https://www.caranddriver.com/mercedes-maybach/s580-s680-2025"]'));
    assert.ok(document.querySelector('.mode-grid [data-mode="performance"]'));
    await act(async () => document.querySelector('[data-mode="value"]').click());
    assert.equal(document.querySelector('.decision-reasons li').dataset.kind, 'overview');
    await act(async () => document.querySelector('[data-mode="practical"]').click());
    assert.match(document.querySelector('.decision-reasons').textContent, /Passenger room.*Usable cargo space/s);

    // The compact workspace preserves accessible navigation and mobile choices.
    await go('compare');
    assert.equal(document.querySelector('#compare-tab-specifications').getAttribute('aria-selected'), 'true', 'returning from Decide preserves the tab');
    const pressTabKey = async (id, key) => act(async () => {
      const control = document.getElementById(`compare-tab-${id}`);
      control.focus();
      control.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }));
    });
    await pressTabKey('specifications', 'Home');
    assert.equal(document.activeElement.id, 'compare-tab-overview');
    assert.ok(document.querySelector('#compare-panel-overview:not([hidden])'));
    assert.ok(document.querySelector('.table-scroll tbody').children.length <= 12, 'overview contains the required costs, comfort and practicality topics without full technical specifications');
    await pressTabKey('overview', 'ArrowRight');
    assert.equal(document.activeElement.id, 'compare-tab-specifications');
    await pressTabKey('specifications', 'End');
    assert.equal(document.activeElement.id, 'compare-tab-sources');
    await pressTabKey('sources', 'ArrowRight');
    assert.equal(document.activeElement.id, 'compare-tab-overview');
    for (const control of document.querySelectorAll('[role="tab"]')) {
      assert.ok(document.getElementById(control.getAttribute('aria-controls')), 'every tab controls an existing panel');
      assert.equal(control.tabIndex, control.getAttribute('aria-selected') === 'true' ? 0 : -1);
    }
    const ids = [...document.querySelectorAll('.car-card')].map(card => card.dataset.carId);
    const choosePair = async (index, value) => act(async () => {
      const select = document.querySelectorAll('.mobile-pair select')[index];
      select.value = value;
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    await choosePair(0, ids[2]);
    await choosePair(1, ids[2]);
    assert.equal(document.querySelector('.car-card.pair-0').dataset.carId, ids[3], 'selecting the other car swaps the two choices');
    assert.equal(document.querySelector('.car-card.pair-1').dataset.carId, ids[2]);
    assert.equal(document.querySelectorAll('.car-card.pair-visible').length, 2);
    assert.equal(document.querySelector('table thead .pair-0 .vehicle-name').textContent, document.querySelector('.car-card.pair-0 .vehicle-name').textContent, 'table and cards use the same first contender');
    await act(async () => document.querySelector('.car-card.pair-0 .view-details').click());
    assert.equal(document.querySelector('#evidence-vehicle').value, ids[3]);
    assert.equal(document.activeElement.dataset.researchCar, ids[3], 'View details focuses the selected vehicle evidence');
    assert.equal(document.querySelector('.vehicle-evidence').open, true);
    await go('decide');
    await go('compare');
    assert.equal(document.querySelector('#evidence-vehicle').value, ids[3], 'evidence selection survives stage navigation');
    assert.equal(document.querySelector('#compare-tab-sources').getAttribute('aria-selected'), 'true');
    await tab('overview');
    assert.equal(document.querySelector('.car-card.pair-1').dataset.carId, ids[2]);
    await act(async () => document.querySelector('[data-shortlist-id="' + ids[3] + '"] .remove-button').click());
    assert.equal(document.querySelectorAll('.car-card.pair-visible').length, 2);
    assert.equal(document.querySelector('.car-card.pair-0').dataset.carId, ids[2], 'remaining selected car stays selected');
    assert.equal(document.querySelector('.car-card.pair-1').dataset.carId, ids[0], 'removed selection falls back to the earliest distinct car');
    await tab('sources');
    assert.equal(document.querySelector('#evidence-vehicle').value, ids[0]);
    await act(async () => { document.querySelector('.nav-button').click(); await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.equal(document.activeElement.id, 'listing-url');
    await change('#listing-url', 'https://example.com/not-ebay');
    await submit();
    assert.match(document.querySelector('#import-error').textContent, /eBay.ca/);
    assert.ok(document.querySelector('#listing-url'), 'errors leave the form open for correction');
    await go('compare');
    await tab('sources');
    await clearComparison();
    assert.equal(document.querySelector('#comparison-import').hidden, false, 'empty shortlist teaches importing');
    assert.equal(document.querySelector('[role="tablist"]'), null);

    // Confirm a variant and correct a detail without importing the listing again.
    let detailImports = 0;
    const detailRequests = [];
    const catalogData = { version: 'synthetic-editor-regression', columns: ['id', 'year', 'make', 'model', 'displ', 'cylinders', 'trany', 'drive', 'fuelType1', 'VClass', 'comb08'], rows: [
      ['1001', '2018', 'Honda', 'Accord', '1.5', '4', 'Automatic (AV-S7)', 'Front-Wheel Drive', 'Regular Gasoline', 'Large Cars', '33'],
      ['1002', '2018', 'Honda', 'Accord', '2', '4', 'Automatic (S10)', 'Front-Wheel Drive', 'Regular Gasoline', 'Large Cars', '27'],
    ] };
    globalThis.fetch = async (url, options) => {
      if (url.startsWith('/data/catalog/')) return Response.json(catalogData);
      if (url.startsWith('/data/fuel/')) return Response.json({ columns: [], rows: [] });
      if (url === '/api/model-specs') { detailRequests.push(JSON.parse(options.body)); return Response.json({ modelSpecs: { status: 'not-configured', fields: {}, reason: 'Synthetic provider unavailable; edit details.' } }); }
      detailImports++;
      return Response.json({ vehicle: { legacyItemId: '999999999999', year: 2018, make: 'Honda', model: 'Accord', market: 'US', description: 'Mileage: 154865. Power: 190 hp.', images: [], itemSpecifics: [] } });
    };
    await change('#listing-url', 'https://www.ebay.ca/itm/999999999999');
    await submit();
    assert.deepEqual(detailRequests.map(request => request.domain).sort(), ['experience', 'ownership'], 'ambiguous engines allow model-level experience and ownership without selecting a base engine');
    assert.equal(detailRequests[0].domain, 'experience');
    await showSource();
    await act(async () => document.querySelector('.vehicle-summary .research-control button').click());
    assert.equal(document.querySelector('.vehicle-details-editor').open, true);
    await act(async () => {
      const select = document.querySelector('#configuration-999999999999');
      select.value = 'epa:1001';
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    await change('#edit-999999999999-horsepower', '192');
    await act(async () => {
      document.querySelector('.vehicle-details-editor form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    assert.equal(detailImports, 1);
    const confirmedRequest = detailRequests.slice(1).find(request => request.displacement === 1.5);
    assert.ok(confirmedRequest, 'confirmed configuration reaches subsequent lookups');
    assert.equal(confirmedRequest.transmission, 'CVT');
    assert.match(document.querySelector('.evidence-specs').textContent, /192.*User-entered/s);
    assert.match(document.querySelector('.evidence-specs').textContent, /Original imported evidence.*190 hp/s);
    await go('decide');
    await go('compare');
    assert.match(document.querySelector('.evidence-specs').textContent, /192.*User-entered/s);
    await act(async () => {
      [...document.querySelectorAll('.vehicle-details-editor button')].find(button => button.textContent === 'Reset to original import').click();
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    assert.equal(detailImports, 1, 'reset also avoids reimporting');
    assert.equal(document.querySelector('#configuration-999999999999').value, '');
    assert.match(document.querySelector('.evidence-specs').textContent, /190/);
    assert.doesNotMatch(document.querySelector('.evidence-specs').textContent, /User-entered/);

  } finally {
    await act(async () => root.unmount());
    await new Promise(resolve => setTimeout(resolve, 50));
    await vite.close();
    dom.window.close();
    globalThis.fetch = originalFetch;
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.HTMLElement;
    delete globalThis.Element;
    delete globalThis.SVGElement;
    delete globalThis.getComputedStyle;
    delete globalThis.requestAnimationFrame;
    delete globalThis.cancelAnimationFrame;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});

test('Compare and Decide omit false powertrain warnings while retaining genuine VIN disagreements', async () => {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Comparison } = await vite.ssrLoadModule('/src/VehicleComparison.jsx');
    const { default: Dashboard } = await vite.ssrLoadModule('/src/DecisionDashboard.jsx');
    const make = (id, year, make, model, description, fields) => {
      const car = { legacyItemId: id, year, make, model, description, priceCAD: { value: '20000', currency: 'CAD' },
        mileage: { raw: '100000', unit: 'km' }, images: [],
        itemSpecifics: [{ name: 'Transmission', value: 'Automatic' }, { name: 'Fuel type', value: 'Gasoline' }] };
      const vin = { status: 'decoded', fields: { year, make, model, fuelType: 'Gasoline', ...fields } };
      return { ...car, enrichment: { vin: { ...vin, mismatches: vinMismatches(car, vin) } } };
    };
    const cars = [
      make('synthetic-accord', '2019', 'Honda', 'Accord', 'Automatic transmission.', { transmission: 'CVT' }),
      make('synthetic-maserati', '2016', 'Maserati', 'Gran Turismo', 'Electric parking brake. Manual folding mirrors. Automatic climate control.', {}),
    ];
    const render = (Component, cars) => new JSDOM(renderToStaticMarkup(React.createElement(Component, { cars, mode: 'cost', ...(Component === Comparison ? { view: { tab: 'specifications', pair: [], sourceId: null } } : {}) })));
    for (const Component of [Comparison, Dashboard]) {
      const valid = render(Component, cars);
      assert.doesNotMatch(valid.window.document.body.textContent, /VIN\/listing mismatch|Conflicting seller values|Review before choosing/);
      if (Component === Comparison) {
        assert.match(valid.window.document.body.textContent, /CVT/);
        assert.match(valid.window.document.body.textContent, /Sources agree/);
      }
      valid.window.close();
      const mismatch = structuredClone(cars[0]);
      mismatch.enrichment.vin.fields.transmission = 'Manual';
      mismatch.enrichment.vin.mismatches = vinMismatches(mismatch, mismatch.enrichment.vin);
      const invalid = render(Component, [mismatch]);
      assert.match(invalid.window.document.body.textContent, /Review before choosing/);
      if (Component === Comparison) assert.match(invalid.window.document.body.textContent, /VIN\/listing mismatch.*Transmission: listing Automatic; VIN record Manual/);
      else {
        assert.match(invalid.window.document.querySelector('[data-kind="warning"]').textContent, /VIN\/listing mismatch/);
        assert.ok(invalid.window.document.querySelector('.decision-sources-link'));
      }
      invalid.window.close();
    }
  } finally {
    await vite.close();
  }
});


test('main cards explain value and comfort concisely with a direct full-source link', async () => {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Dashboard } = await vite.ssrLoadModule('/src/DecisionDashboard.jsx');
    const car = ratedCar('leader', 4, undefined, 15000);
    const ratings = car.enrichment.modelSpecs.dimensionRatings;
    ratings.rideQuality.rationale = 'Smooth bump absorption on uneven streets.';
    ratings.frontSeatComfort.rationale = 'Supportive front seats for longer drives.';
    ratings.rearSeatComfort.rationale = 'Well cushioned rear seats.';
    for (const mode of ['value', 'comfort']) {
      const dom = new JSDOM(renderToStaticMarkup(React.createElement(Dashboard, { cars: [car, ratedCar('peer', 2, undefined, 25000)], mode })));
      const doc = dom.window.document;
      const card = doc.querySelector('.decision-match');
      assert.doesNotMatch(card.textContent, /Supported capability|Unranked|\/ 100|% evidence coverage/);
      assert.match(card.textContent, /Smooth bump absorption/);
      assert.ok(card.querySelector('a[href="https://reviews.example.test/fixture"]'));
      if (mode === 'value') assert.match(card.textContent, /\$15,000 CAD.*lowest asking price/);
      else assert.match(card.textContent, /Supportive front seats.*Well cushioned rear seats/);
      assert.equal(doc.querySelector('.ranking-score'), null);
      assert.equal(doc.querySelector('.decision-sources-link').getAttribute('href'), '#compare');
      assert.ok(card.querySelectorAll('.decision-reasons > li').length <= 6);
      assert.equal(doc.querySelector('.decision-result').getAttribute('aria-live'), 'polite');
      dom.window.close();
    }
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(Dashboard, { cars: [{ legacyItemId: 'unknown', description: 'Engine problems.' }], mode: 'comfort' })));
    const card = dom.window.document.querySelector('.decision-match');
    assert.match(card.textContent, /Review before choosing/);
    assert.match(card.textContent, /Ride quality.*Mainstream bump absorption assumed/s);
    assert.match(card.textContent, /Seat cushioning.*Cabin quietness.*Seat heating/s);
    assert.match(card.textContent, /Engine concern/);
    assert.doesNotMatch(card.textContent, /Unranked|Unscored|Best category fit/);
    dom.window.close();
  } finally {
    await vite.close();
  }
});

test('five priorities show every selected information item once within the six-item cap', async () => {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Dashboard } = await vite.ssrLoadModule('/src/DecisionDashboard.jsx');
    const { decisionSummary, entrySummary } = await vite.ssrLoadModule('/src/decision-summary.js');
    const cars = [ratedCar('leader', 4, '200 hp. Curb weight: 1500 kg.', 15000), ratedCar('peer', 2, '150 hp. Curb weight: 1600 kg.', 25000)];
    for (const mode of ['value', 'cost', 'comfort', 'practical', 'performance']) {
      const summary = decisionSummary(cars, mode, new Date().getFullYear());
      const notes = entrySummary(summary, summary.ranking.ranked[0]);
      const dom = new JSDOM(renderToStaticMarkup(React.createElement(Dashboard, { cars, mode })));
      const card = dom.window.document.querySelector('.decision-match-copy');
      const reasons = [...card.querySelectorAll(':scope > .decision-reasons > li')];
      assert.equal(card.querySelectorAll('.decision-reasons').length, 1, mode);
      assert.equal(card.querySelector('.additional-reasons'), null, mode);
      assert.equal(reasons.length, notes.items.length, mode);
      assert.ok(reasons.length <= 6, mode);
      assert.equal(dom.window.document.querySelectorAll('.mode-card').length, 5);
      assert.equal(dom.window.document.querySelector('.decision-page [role="tablist"]'), null);
      notes.items.forEach((reason, index) => {
        assert.ok(reasons[index].textContent.includes(reason.text), mode);
        assert.ok(reasons[index].textContent.includes(reason.label), mode);
        assert.equal(reasons[index].closest('details'), null, mode);
        if (reason.source) assert.ok([...reasons[index].querySelectorAll('a')].some(link => link.getAttribute('href') === reason.source.url), mode);
      });
      assert.ok(card.querySelector('[data-kind="tradeoff"]').textContent.includes(notes.tradeoff), mode);
      dom.window.close();
    }
  } finally { await vite.close(); }
});
