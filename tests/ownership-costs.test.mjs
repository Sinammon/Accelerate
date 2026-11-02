import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';

test('ownership context distinguishes fuel scenarios, personal quotes and unavailable costs without inventing totals', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: OwnershipCosts } = await vite.ssrLoadModule('/src/OwnershipCosts.jsx');
    const car = { legacyItemId: 'synthetic-cost-fixture', year: '2018', make: 'Example', model: 'Long vehicle name for ownership comparison', priceCAD: { value: '20000', currency: 'CAD' }, enrichment: { fuel: { status: 'matched', combined: 6 } } };
    const missing = { ...car, legacyItemId: 'missing-cost-fixture', model: 'Unknown fuel', enrichment: {} };
    const scenario = { annualKm: 15000, pricePerLitre: 1.70 };
    const before = structuredClone({ car, missing, scenario });
    const render = assumptions => new JSDOM(renderToStaticMarkup(React.createElement(OwnershipCosts, { cars: [car, missing], scenario: assumptions })));
    const page = render(scenario);
    const cards = page.window.document.querySelectorAll('.ownership-vehicles > li');
    assert.match(cards[0].textContent, /\$1,530 CAD\/year.*\$128 CAD\/month average/s);
    assert.match(page.window.document.querySelector('.ownership-scenario').textContent, /\$1\.70 CAD\/L/);
    assert.match(cards[1].textContent, /Estimate unavailable/);
    assert.doesNotMatch(cards[1].textContent, /\$0 CAD/);
    for (const card of cards) assert.match(card.textContent, /Personal quote needed.*No premium has been estimated/s);
    assert.match(page.window.document.querySelector('.ownership-scope').textContent, /does not establish the cheapest car to own/);
    assert.match(page.window.document.querySelector('.ownership-checklist').textContent, /Insurance.*Servicing.*Taxes.*Financing.*Parking.*Depreciation/s);
    assert.equal(page.window.document.querySelectorAll('.ownership-guides a[rel="noopener noreferrer"]').length, 3);
    page.window.close();
    for (const invalid of [{ ...scenario, annualKm: 0 }, { ...scenario, pricePerLitre: NaN }, { ...scenario, annualKm: Number.MAX_VALUE, pricePerLitre: 10 }]) {
      const page = render(invalid);
      assert.doesNotMatch(page.window.document.body.textContent, /Infinity|NaN|\$0 CAD/);
      assert.equal(page.window.document.querySelectorAll('.ownership-facts dd')[1].textContent, 'Estimate unavailable');
      page.window.close();
    }
    assert.deepEqual({ car, missing, scenario }, before);
  } finally { await vite.close(); }
});
