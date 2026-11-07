import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

test('compact workspace preserves tab choices and private edits across the complete shopping journey', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/dashboard', pretendToBeVisual: true });
  const names = ['window', 'document', 'HTMLElement', 'Element', 'SVGElement', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'IS_REACT_ACT_ENVIRONMENT', 'fetch'];
  const saved = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  for (const name of ['window', 'document', 'HTMLElement', 'Element', 'SVGElement']) globalThis[name] = dom.window[name];
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  dom.window.scrollTo = () => {};
  dom.window.Element.prototype.scrollIntoView = () => {};
  const requests = [];
  let releaseImport, failImport = false;
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, body: options.body });
    if (url === '/api/import') {
      if (failImport) return Response.json({ error: 'Synthetic listing unavailable' }, { status: 502 });
      const id = JSON.parse(options.body).url.match(/(\d+)$/)[1];
      return new Promise(resolve => { releaseImport = () => resolve(Response.json({ vehicle: {
        legacyItemId: id, year: '2018', make: 'Example', model: id.slice(0, 1),
        priceCAD: { value: '20000', currency: 'CAD' }, location: { city: 'Toronto', country: 'CA' }, images: ['https://images.example.test/front.jpg', 'https://images.example.test/rear.jpg'], itemSpecifics: [],
        ...(id.startsWith('4') ? { description: 'Engine problems. Not running.' } : {}),
      } })); });
    }
    return Response.json({}, { status: 503 });
  };
  const React = await import('react'), { createRoot } = await import('react-dom/client');
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const root = createRoot(document.getElementById('root'));
  const click = selector => React.act(async () => { document.querySelector(selector).click(); await new Promise(resolve => setTimeout(resolve, 20)); });
  const go = page => click(`#primary-navigation a[href="#${page}"]`);
  const change = (selector, value) => React.act(async () => {
    const input = document.querySelector(selector);
    assert.ok(input, selector);
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  const submit = () => React.act(async () => { document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); });
  const add = async id => {
    const inline = window.location.hash === '#compare';
    if (!document.querySelector('#listing-url')) await click('.nav-button');
    await change('#listing-url', `https://www.ebay.ca/itm/${id}`);
    await submit();
    assert.equal(document.querySelector('form').getAttribute('aria-busy'), 'true');
    assert.match(document.querySelector('form button[type="submit"]').textContent, /Adding car/);
    assert.equal(document.querySelector('.nav-button').disabled, true);
    if (inline) {
      assert.equal(window.location.hash, '#compare');
      assert.equal(document.querySelector('.compare-add').disabled, true);
    }
    await React.act(async () => { releaseImport(); await new Promise(resolve => setTimeout(resolve, 25)); });
    if (inline) {
      await React.act(async () => { await new Promise(resolve => dom.window.requestAnimationFrame(resolve)); });
      assert.equal(document.querySelector('#comparison-import').hidden, true);
      assert.equal(document.activeElement.dataset.carId, id);
    }
  };
  try {
    const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
    await React.act(async () => root.render(React.createElement(App)));
    assert.deepEqual([...document.querySelectorAll('#primary-navigation a')].map(a => a.textContent), ['Compare', 'Recommendation', 'Costs']);
    assert.equal(document.querySelector('.workflow'), null);
    assert.ok(document.querySelector('.dashboard-hero'));
    assert.equal(document.querySelector('.shortlist-rail'), null);
    assert.equal(document.querySelector('.workspace-help'), null);
    assert.equal(document.querySelector('.dashboard-preview').open, false);
    await change('#listing-url', 'https://example.test/invalid');
    await submit();
    assert.match(document.querySelector('#import-error').textContent, /eBay.ca/);
    assert.equal(requests.length, 0);

    await add('111111111111');
    assert.equal(window.location.hash, '#compare');
    assert.equal(document.querySelector('.comparison-table tbody').rows.length, 6);
    assert.match(document.querySelector('.comparison-table').textContent, /General baseline/);
    await click('.compare-add');
    assert.equal(window.location.hash, '#compare');
    assert.equal(document.activeElement.id, 'listing-url');
    await change('#listing-url', 'https://example.test/invalid');
    await submit();
    assert.equal(document.querySelector('#comparison-import').hidden, false);
    assert.match(document.querySelector('#import-error').textContent, /eBay.ca/);
    const importCount = requests.filter(request => request.url === '/api/import').length;
    await change('#listing-url', 'https://www.ebay.ca/itm/111111111111');
    await submit();
    assert.match(document.querySelector('#import-error').textContent, /already/);
    assert.equal(requests.filter(request => request.url === '/api/import').length, importCount);
    failImport = true;
    await change('#listing-url', 'https://www.ebay.ca/itm/999999999999');
    await submit();
    assert.equal(document.querySelector('#comparison-import').hidden, false);
    assert.ok(document.querySelector('#import-error').textContent);
    assert.equal(window.location.hash, '#compare');
    failImport = false;
    await click('.comparison-import-cancel');
    assert.equal(document.activeElement, document.querySelector('.compare-add'));
    await click('.nav-button');
    assert.equal(window.location.hash, '#compare');
    assert.equal(document.activeElement.id, 'listing-url');
    assert.equal(document.querySelector('#listing-url').value, 'https://www.ebay.ca/itm/999999999999');
    for (const id of ['222222222222', '333333333333', '444444444444']) await add(id);
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 4);
    document.querySelector('.car-management').open = true;
    await React.act(async () => {
      const remove = document.querySelector('.managed-car-remove');
      remove.focus();
      remove.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    assert.equal(document.querySelector('.car-management').open, false);
    assert.equal(document.activeElement, document.querySelector('.car-management > summary'));
    assert.equal(document.querySelector('.nav-button').disabled, true);
    assert.equal(document.querySelector('.compare-add').disabled, true);
    assert.match(document.querySelector('#comparison-full-note').textContent, /Remove a car/);
    await click('.brand');
    assert.equal(window.location.hash, '#import');
    assert.equal(document.querySelector('.hero-composer button[type="submit"]').textContent, 'Shortlist full');
    assert.equal(document.querySelector('.hero-composer button[type="submit"]').disabled, true);
    assert.equal(document.getElementById('listing-url').disabled, true);
    assert.match(document.getElementById('input-note').textContent, /4\/4 cars added.*Remove a car/);
    await go('compare');
    assert.match(document.querySelector('.card-warnings summary').textContent, /Engine concern/);
    assert.equal(document.querySelector('.shortlist-rail'), null);
    assert.equal(document.querySelectorAll('.comparison-table .vehicle-image').length, 4);
    assert.equal(document.querySelector('.comparison-table .vehicle-image img').getAttribute('src'), 'https://images.example.test/front.jpg');
    await click('.comparison-table .photo-next');
    assert.equal(document.querySelector('.comparison-table .vehicle-image img').getAttribute('src'), 'https://images.example.test/rear.jpg');
    await React.act(async () => document.querySelector('.comparison-table .vehicle-image img').dispatchEvent(new dom.window.Event('error')));
    assert.ok(document.querySelector('.comparison-table .image-placeholder'));

    await click('[data-car-id="444444444444"] .compare-remove');
    assert.equal(document.querySelector('[data-car-id="444444444444"]'), null);
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 3);
    const pair = [...document.querySelectorAll('.mobile-pair select')].map(select => select.value);
    assert.equal(new Set(pair).size, 2);
    assert.ok(!pair.includes('444444444444'));
    assert.ok(document.activeElement.matches('.car-card.pair-visible .compare-remove'));
    assert.equal(document.querySelector('.compare-add').disabled, false);
    await add('444444444444');
    await click('#compare-tab-specifications');
    await go('decide');
    assert.equal(document.querySelectorAll('.mode-card').length, 5);
    await click('[data-mode="comfort"]');
    await click('.decision-arrow.next');
    const contender = document.querySelector('.decision-match h2').textContent;
    assert.equal(document.querySelector('.decision-page [role="tablist"]'), null);
    assert.ok(document.querySelectorAll('.decision-reasons > li').length <= 6);
    const contenderId = document.querySelector('.decision-match').dataset.carId;
    await click('.decision-sources-link');
    assert.equal(window.location.hash, '#compare');
    assert.equal(document.querySelector('#evidence-vehicle').value, contenderId);
    assert.equal(document.activeElement.dataset.researchCar, contenderId);
    assert.ok(document.querySelector('.recall-research'));
    await click('#compare-tab-specifications');
    await go('decide');
    assert.equal(document.querySelector('.decision-match h2').textContent, contender);

    await go('ownership');
    assert.equal(document.querySelector('#costs-panel-summary').hidden, false);
    assert.equal(document.querySelector('#costs-panel-purchase').hidden, true);
    assert.match(document.querySelector('#costs-panel-summary').textContent, /Cash needed.*Monthly running budget/s);
    for (const [index, destination] of ['purchase', 'running', 'salary'].entries()) {
      await click('#costs-tab-summary');
      await click(`.cost-summary-actions button:nth-child(${index + 1})`);
      assert.equal(document.activeElement.id, `costs-tab-${destination}`);
      assert.equal(document.querySelector(`#costs-panel-${destination}`).hidden, false);
    }
    await click('#costs-tab-summary');
    await click('.cost-summary-actions button:nth-child(2)');
    assert.equal(document.activeElement.id, 'costs-tab-running');
    await change('[data-field="insuranceAnnual"]', '3000');
    await click('#costs-tab-purchase');
    await change('[data-field="purchasePrice"]', '25000');
    await click('#costs-tab-salary');
    await change('[data-field="salary"]', '120000');
    await go('decide');
    assert.equal(document.querySelector('[data-mode="comfort"]').getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('.decision-match h2').textContent, contender);
    await go('compare');
    assert.equal(document.querySelector('#compare-tab-specifications').getAttribute('aria-selected'), 'true');
    await go('ownership');
    assert.equal(document.querySelector('#costs-tab-salary').getAttribute('aria-selected'), 'true');
    assert.equal(document.querySelector('[data-field="salary"]').value, '120000');
    assert.equal(document.querySelector('[data-field="insuranceAnnual"]').value, '3000');
    assert.equal(document.querySelector('[data-field="purchasePrice"]').value, '25000');
    assert.doesNotMatch(JSON.stringify(requests), /salary|insuranceAnnual|purchasePrice|120000/);

    document.querySelector('.car-management').open = true;
    await click('.managed-car-remove');
    assert.equal(document.querySelectorAll('[data-shortlist-id]').length, 3);
    assert.equal(document.querySelector('[data-field="insuranceAnnual"]').value, '2218');
    assert.equal(document.querySelector('[data-field="salary"]').value, '120000');
    assert.equal(document.activeElement.classList.contains('managed-car-remove'), true);
    await click('.managed-car-name');
    assert.equal(window.location.hash, '#compare');
    assert.equal(document.querySelector('#compare-tab-sources').getAttribute('aria-selected'), 'true');
    assert.match(document.querySelector('.source-listing-context').textContent, /Listing location: Toronto, CA.*Mileage:/);
    for (const tab of document.querySelectorAll('[role="tab"]')) {
      assert.ok(document.getElementById(tab.getAttribute('aria-controls')));
      assert.equal(tab.tabIndex, tab.getAttribute('aria-selected') === 'true' ? 0 : -1);
    }
    await go('ownership');
    document.querySelector('.car-management').open = true;
    await click('.managed-car-remove');
    document.querySelector('.car-management').open = true;
    await click('.managed-car-remove');
    await go('compare');
    await click('#compare-tab-overview');
    await click('.car-card .compare-remove');
    assert.match(document.querySelector('.empty-state').textContent, /shortlist starts/);
    assert.equal(document.activeElement.id, 'listing-url');
    await add('555555555555');
    await go('ownership');
    assert.equal(document.querySelector('#costs-tab-summary').getAttribute('aria-selected'), 'true');
    assert.equal(document.querySelector('[data-field="salary"]').value, '');
    assert.equal(document.querySelector('[data-field="insuranceAnnual"]').value, '2218');
    assert.doesNotMatch(document.body.textContent, /NaN|Infinity/);
    await go('decide');
    await click('[data-mode="practical"]');
    await click('.decision-adjust-practical');
    assert.equal(window.location.hash, '#compare');
    assert.equal(document.querySelector('#compare-tab-overview').getAttribute('aria-selected'), 'true');
    assert.equal(document.querySelector('.scenario-panel').open, true);
    assert.equal(document.activeElement, document.querySelector('.scenario-fields select'));
    await React.act(async () => {
      const seats = document.querySelector('.scenario-fields select');
      seats.value = '2';
      seats.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    await go('decide');
    await click('[data-mode="cost"]');
    await click('.decision-adjust-costs');
    assert.equal(window.location.hash, '#ownership');
    assert.equal(document.querySelector('#costs-tab-running').getAttribute('aria-selected'), 'true');
    assert.equal(document.activeElement.id, 'costs-tab-running');
    await change('[data-field="insuranceAnnual"]', '3500');
    await go('decide');
    assert.match(document.querySelector('.decision-reasons').textContent, /Insurance.*3,500 CAD.*Your calculator input/s);
    assert.ok(document.querySelectorAll('.decision-reasons > li').length <= 6);
    await go('compare');
    assert.equal(document.querySelector('.scenario-fields select').value, '2', 'practical needs share the existing scenario');
  } finally {
    await React.act(async () => root.unmount());
    await vite.close();
    dom.window.close();
    for (const [name, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
  }
});
