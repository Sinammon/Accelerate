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
    await act(async () => document.querySelector('#primary-navigation a').click());
    assert.equal(menuButton.getAttribute('aria-expanded'), 'false', 'selecting navigation closes the mobile menu');
    assert.match(document.querySelector('h1').textContent, /Find the right car/);
    assert.equal(document.querySelector('.mode-grid'), null);
    assert.equal(document.querySelectorAll('.preview-vehicle').length, 4);
    assert.equal(document.querySelectorAll('.car-card').length, 0);
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
    assert.equal(document.querySelectorAll('.car-card').length, 0, 'sample data never enters the real shortlist');
    const tab = async id => act(async () => document.getElementById(`compare-tab-${id}`).click());
    const clearComparison = async () => act(async () => { document.querySelector('.comparison-options').open = true; document.querySelector('[data-action="clear-comparison"]').click(); });
    const change = async (selector, value) => {
      if (selector === '#listing-url' && document.querySelector('#comparison-import[hidden]')) await act(async () => document.querySelector('.add-car').click());
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
      const beforeCount = document.querySelectorAll('.car-card').length;
      await act(async () => {
        document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      if (document.querySelectorAll('.car-card').length > beforeCount) {
        assert.equal(document.querySelector('#compare-tab-overview').getAttribute('aria-selected'), 'true', 'imports start with the essentials');
        assert.equal(document.querySelector('#comparison-import').hidden, true, 'successful import collapses the form');
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
    assert.equal(document.querySelector('h1').textContent, 'Compare Your Vehicles');
    assert.equal(document.querySelector('.vehicle-name').textContent, '2016 Example 1');
    assert.match(document.querySelector('.car-meta').textContent, /100000 km/);
    assert.doesNotMatch(document.querySelector('.car-meta').textContent, /Unit unknown|conflict/);
    assert.equal(document.querySelector('.vehicle-image img').getAttribute('src'), 'https://images.example.test/front.jpg');
    await act(async () => document.querySelector('.photo-next').click());
    assert.equal(document.querySelector('.vehicle-image img').getAttribute('src'), 'https://images.example.test/rear.jpg');
    await act(async () => document.querySelector('.photo-next').click());
    assert.equal(document.querySelector('.vehicle-image img').getAttribute('src'), 'https://images.example.test/front.jpg');
    assert.equal(document.querySelectorAll('table:first-of-type tbody tr').length >= 2, true);
    assert.equal(document.querySelectorAll('.table-scroll')[0].querySelectorAll('tbody tr').length, 2, 'fully unknown specification rows are omitted');
    assert.match(document.querySelector('.shared-gaps').textContent, /Transmission/);
    await tab('sources');
    assert.equal(document.querySelectorAll('.feature-evidence > div').length, 1, 'only explicit amenity claims appear');
    await tab('specifications');
    assert.equal(document.querySelector('.mode-grid'), null);
    await add('222222222222', 20000, 2021, 'No heated seats.', null);
    assert.equal(document.querySelectorAll('.car-card').length, 2);
    assert.match(document.querySelector('tbody').textContent, /km \(assumed\)/);
    assert.doesNotMatch(document.querySelectorAll('.car-card')[1].textContent, /Check mileage/);
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw new Error('Should not fetch duplicate'); };
    await change('#listing-url', 'https://www.ebay.ca/itm/111111111111');
    await submit();
    assert.equal(calls, 0);
    assert.match(document.querySelector('#import-error').textContent, /already/);
    await act(async () => {
      document.querySelector('.desktop-decide button').click();
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    assert.equal(document.querySelector('h1').textContent, "Let's Find Your Best Match");
    assert.equal(window.location.hash, '#decide');
    await act(async () => document.querySelector('.skip-link').click());
    assert.equal(window.location.hash, '#decide', 'skip navigation preserves the current stage');
    assert.equal(document.activeElement.id, 'main-content');
    assert.equal(document.querySelectorAll('input[type="range"]').length, 0);
    assert.equal(document.querySelectorAll('.mode-grid .mode-card').length, 5);
    assert.equal(document.querySelectorAll('.mode-card').length, 6);
    assert.equal(document.querySelector('.best-match'), null, 'unresearched listings have no category winner');
    await act(async () => document.querySelector('.mode-card[data-mode="practical"]').click());
    assert.equal(document.querySelector('.best-match'), null);
    await act(async () => document.querySelector('.mode-card[data-mode="performance"]').click());
    assert.equal(document.querySelector('.decision-match').dataset.basis, 'guidance');
    assert.match(document.querySelector('.decision-reason').textContent, /More comparable information/);
    await act(async () => document.querySelector('.mode-card[data-mode="comfort"]').click());
    assert.equal(document.querySelector('.best-match'), null, 'unresearched listings have no category winner');
    await go('compare');
    await add('333333333333', 100, 2025, 'Engine problems. Coolant leak. Not running.');
    assert.match(document.querySelector('.car-card:last-child .warning-details').textContent, /Engine concern.*Coolant leak/s, 'condition warnings remain visible while evidence sections are collapsed');
    await go('decide');
    await act(async () => document.querySelector('.mode-card[data-mode="cost"]').click());
    assert.equal(document.querySelector('.best-match h2').textContent, '2025 Example 3');
    assert.equal(document.querySelectorAll('.best-match .warning-details b').length, 3);
    assert.match(document.querySelector('.ownership-costs').textContent, /Insurance.*Personal quote needed/s);
    assert.match(document.querySelector('.ownership-scope').textContent, /not estimated or included in the ranking/);
    await act(async () => document.querySelector('.ownership-scenario button').click());
    assert.equal(document.querySelector('.scenario-panel').open, true);
    assert.equal(document.activeElement, document.querySelector('.scenario-panel input'));
    await change('.scenario-panel input', '10000');
    assert.match(document.querySelector('.ownership-scenario').textContent, /10,000 km\/year/);
    await change('.scenario-panel input', '15000');
    await act(async () => document.querySelector('.mode-card[data-mode="value"]').click());
    assert.equal(document.querySelector('.ownership-costs'), null, 'ownership context appears under Affordability');
    assert.equal(document.querySelector('.best-match'), null);
    assert.equal(document.querySelector('.ranking-row:last-child h3').textContent, '2025 Example 3');
    await act(async () => document.querySelector('.mode-card[data-mode="balanced"]').click());
    assert.equal(document.querySelector('.mode-card[data-mode="balanced"]').getAttribute('aria-pressed'), 'true');
    await go('compare');
    await add('444444444444', 25000, 2023);
    assert.equal(document.querySelectorAll('.car-card').length, 4);
    assert.equal(document.querySelector('.url-form button').disabled, true);
    assert.equal(document.querySelector('table thead').querySelectorAll('th').length, 5);
    await act(async () => document.querySelector('.remove-button').click());
    assert.equal(document.querySelectorAll('.car-card').length, 3);
    assert.equal(document.querySelector('.url-form button').disabled, false);
    await add('555555555555', 15000, 2020);
    assert.equal(document.querySelectorAll('.car-card').length, 4);
    assert.equal(document.querySelector('.vehicle-name').textContent, '2021 Example 2');
    await go('decide');
    assert.equal(document.querySelectorAll('.ranking-row').length, 4);
    assert.equal(document.querySelector('.mode-card[data-mode="balanced"]').getAttribute('aria-pressed'), 'true');
    await go('compare');
    await clearComparison();
    assert.equal(document.querySelectorAll('.car-card').length, 0);
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
    assert.equal(document.querySelectorAll('.car-card').length, 1);
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
    assert.equal(document.querySelectorAll('.car-card').length, 1);
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
    assert.match(document.querySelector('.score-parts').textContent, /Typical model spec/);
    assert.equal(document.querySelectorAll('.decision-reasons > li').length <= 3, true);
    assert.equal(document.querySelectorAll('.decision-key-facts > div').length <= 3, true);
    // Retry research without reimporting; a failed retry preserves known specifications.
    await go('compare');
    assert.match(document.querySelector('.car-card .research-control').textContent, /Research ready: 2 specifications/);
    assert.equal(document.querySelector('.car-card [data-action="model-research"]').textContent, 'Refresh research');
    await act(async () => document.querySelector('.car-card .view-details').click());
    assert.equal(document.querySelector('#compare-tab-sources').getAttribute('aria-selected'), 'true', 'View details opens the correct evidence without another API request');
    assert.equal(document.activeElement, document.querySelector('.vehicle-summary'));
    assert.equal(document.querySelector('.vehicle-summary .model-research').open, true, 'View results opens dimension research even without broad notes');
    await act(async () => document.querySelector('.car-card [data-action="model-research"]').click());
    assert.equal(document.querySelector('.car-card [data-action="model-research"]').textContent, 'Restart research');
    await tab('specifications');
    assert.match(document.querySelector('table').textContent, /158/);
    await act(async () => {
      researchPending.at(-1).resolve(Response.json({ modelSpecs: { status: 'quota', fields: {}, reason: 'Free research quota reached.' } }));
      await new Promise(resolve => setTimeout(resolve, 15));
    });
    assert.match(document.querySelector('table').textContent, /158/);
    assert.match(document.querySelector('.car-card').textContent, /Previous research is still available/);
    await tab('sources');
    assert.equal(document.querySelector('.source-status-grid .capability-details strong').textContent, '4 / 5', 'quota failure preserves previous dimension results');
    assert.equal(document.querySelectorAll('.car-card').length, 2);
    assert.ok(window.localStorage.getItem('dilemma:model-specs:v1'));
    await act(async () => document.querySelector('[data-action="clear-saved-specs"]').click());
    assert.equal(window.localStorage.getItem('dilemma:model-specs:v1'), null);
    assert.equal(document.querySelectorAll('.car-card').length, 2, 'clearing saved specs preserves the temporary shortlist');
    // A full shortlist must still search and retry its fourth car independently.
    for (const id of ['377777777777', '477777777777']) {
      await change('#listing-url', `https://www.ebay.ca/itm/${id}`);
      await submit();
    }
    assert.equal(document.querySelectorAll('.car-card').length, 4);
    const fourthCard = () => document.querySelectorAll('.car-card')[3];
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
    assert.equal(document.querySelectorAll('.car-card').length, 0);
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
    assert.equal(document.querySelectorAll('.car-card').length, 3);
    await tab('sources');
    assert.equal(demoRequests.length, 3);
    assert.match(document.querySelector('.demo-notice').textContent, /fictional/i);
    assert.match(document.querySelector('.source-status-grid').textContent, /Reference specifications and your entries.*Seller-reported claims.*Typical model information.*Still to verify on this car/s);
    assert.ok(document.querySelector('.model-research a[href="https://www.caranddriver.com/honda/civic-2018"]'));
    await tab('specifications');
    // Fuel references load from disk asynchronously. Wait for their table row;
    // the sources panel is absent while Overview is selected and cannot signal readiness.
    for (let attempt = 0; attempt < 100 && document.querySelector('.table-scroll tbody').rows.length < 13; attempt++) {
      await act(async () => new Promise(resolve => setTimeout(resolve, 20)));
    }
    assert.equal(document.querySelector('.table-scroll').querySelectorAll('tbody tr').length, 13);
    assert.match(document.querySelector('.table-scroll').textContent, /Power \(hp\).*158.*132.*155/s);
    await tab('sources');
    assert.match(document.querySelector('.source-status-grid').textContent, /Factory reference/);
    assert.ok(document.querySelector('a[href*="hondanews.ca"]'), 'factory evidence links to the manufacturer');
    await go('decide');
    await act(async () => document.querySelector('.mode-card[data-mode="performance"]').click());
    assert.equal(document.querySelector('.decision-match').dataset.basis, 'supported');
    assert.match(document.querySelector('.decision-reason').textContent, /Provisional best fit/);
    assert.match(document.querySelector('.evidence-coverage').textContent, /Tentative recommendation/);
    assert.match(document.querySelector('.capability-details').textContent, /Curb weight.*Power-to-weight/s);
    assert.match(document.querySelector('.score-parts').textContent, /factory reference; not measured output/);
    assert.equal(document.querySelectorAll('.research-guidance-grid > article').length, 3);
    assert.equal(document.querySelectorAll('.research-next-step').length, 2);
    assert.match(document.querySelector('.decision-research').textContent, /retrieved manufacturer information/);
    assert.match(document.querySelector('.score-basis').textContent, /Preference score/);
    await act(async () => document.querySelector('.mode-card[data-mode="comfort"]').click());
    assert.equal(document.querySelector('.decision-match').dataset.basis, 'guidance');
    assert.match(document.querySelector('.decision-research').textContent, /sound isolation/);
    await act(async () => document.querySelector('.mode-card[data-mode="value"]').click());
    assert.ok(document.querySelector('.best-match'));
    assert.match(document.querySelector('.score-parts').textContent, /Seller-reported/);
    const beforeLookup = document.querySelector('.decision-match h2').textContent;
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
    assert.equal(document.querySelector('.decision-match h2').textContent, beforeLookup, 'recalls do not alter ranking');
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
    assert.match(document.querySelector('.evidence-coverage').textContent, /Tentative recommendation/);
    assert.match(document.querySelector('.ranking-row .capability-details').textContent, /Ride quality.*5 \/ 5.*Cabin quietness.*Seat comfort.*Passenger space/s);
    assert.ok(document.querySelector('.capability-details a[href="https://www.caranddriver.com/mercedes-maybach/s580-s680-2025"]'));
    assert.ok(document.querySelector('.mode-grid [data-mode="performance"]'));
    await act(async () => document.querySelector('[data-mode="value"]').click());
    assert.match(document.querySelector('.mode-explanation').textContent, /See what you get for the asking price/);
    await act(async () => document.querySelector('[data-mode="balanced"]').click());
    assert.match(document.querySelector('.mode-explanation').textContent, /Balanced emphasizes overall capability/);

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
    assert.ok(document.querySelector('.table-scroll tbody').children.length <= 5, 'overview stays focused');
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
    assert.equal(document.querySelector('table thead .pair-0').textContent, document.querySelector('.car-card.pair-0 .vehicle-name').textContent, 'table and cards use the same first contender');
    await act(async () => document.querySelector('.car-card.pair-0 .view-details').click());
    assert.equal(document.querySelector('#evidence-vehicle').value, ids[3]);
    assert.equal(document.activeElement.dataset.researchCar, ids[3], 'View details focuses the selected vehicle evidence');
    assert.equal(document.querySelector('.vehicle-evidence').open, true);
    await go('decide');
    await go('compare');
    assert.equal(document.querySelector('#evidence-vehicle').value, ids[3], 'evidence selection survives stage navigation');
    assert.equal(document.querySelector('#compare-tab-sources').getAttribute('aria-selected'), 'true');
    assert.equal(document.querySelector('.car-card.pair-1').dataset.carId, ids[2]);
    await act(async () => document.querySelector('.car-card.pair-0 .remove-button').click());
    assert.equal(document.querySelectorAll('.car-card.pair-visible').length, 2);
    assert.equal(document.querySelector('.car-card.pair-0').dataset.carId, ids[2], 'remaining selected car stays selected');
    assert.equal(document.querySelector('.car-card.pair-1').dataset.carId, ids[0], 'removed selection falls back to the earliest distinct car');
    assert.equal(document.querySelector('#evidence-vehicle').value, ids[0]);
    await act(async () => document.querySelector('.add-car').click());
    assert.equal(document.activeElement.id, 'listing-url');
    await change('#listing-url', 'https://example.com/not-ebay');
    await submit();
    assert.match(document.querySelector('#import-error').textContent, /eBay.ca/);
    assert.equal(document.querySelector('#comparison-import').hidden, false, 'errors leave the form open for correction');
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
    assert.equal(detailRequests.length, 0, 'ambiguous engines cannot silently trigger a base-engine estimate');
    await act(async () => document.querySelector('.car-card .research-control button').click());
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
    assert.equal(detailRequests[0].displacement, 1.5);
    assert.equal(detailRequests[0].transmission, 'CVT');
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
    const render = (Component, cars) => new JSDOM(renderToStaticMarkup(React.createElement(Component, { cars, mode: 'cost' })));
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
      assert.match(invalid.window.document.body.textContent, /VIN\/listing mismatch.*Transmission: listing Automatic; VIN record Manual/);
      invalid.window.close();
    }
  } finally {
    await vite.close();
  }
});


test('main cards explain value and comfort while calculations stay in disclosures', async () => {
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
      assert.doesNotMatch(card.textContent, /Supported capability|Unranked|\/ 100|\/ 5|% evidence coverage/);
      assert.match(card.textContent, /Smooth bump absorption/);
      assert.ok(card.querySelector('a[href="https://reviews.example.test/fixture"]'));
      if (mode === 'value') assert.match(card.textContent, /\$15,000 CAD.*lowest asking price/);
      else assert.match(card.textContent, /Supportive front seats.*Well cushioned rear seats/);
      assert.match(doc.querySelector('.ranking-score').textContent, /\/ 100/);
      assert.ok(doc.querySelector('.ranking-score').closest('details'));
      assert.equal(doc.querySelector('.decision-result').getAttribute('aria-live'), 'polite');
      dom.window.close();
    }
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(Dashboard, { cars: [{ legacyItemId: 'unknown', description: 'Engine problems.' }], mode: 'comfort' })));
    const card = dom.window.document.querySelector('.decision-match');
    assert.match(card.textContent, /What we know so far/);
    assert.match(card.textContent, /Ride quality and seat comfort still need checking/);
    assert.match(card.textContent, /bump absorption, seat support and rear-seat comfort/);
    assert.match(card.textContent, /Engine concern/);
    assert.doesNotMatch(card.textContent, /Unranked|Unscored|Best category fit/);
    dom.window.close();
  } finally {
    await vite.close();
  }
});
