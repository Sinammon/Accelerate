import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';

test('ownership context shows complete running totals, generic fallbacks and incomplete amounts', async () => {
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
    assert.match(cards[0].textContent, /\$1,530 CAD.*\$5,248 CAD\$437 CAD\/month average/s);
    assert.match(page.window.document.querySelector('.ownership-scenario').textContent, /\$1\.70 CAD\/L/);
    assert.match(cards[1].textContent, /General baseline/);
    assert.match(cards[1].textContent, /Annual running expenses/);
    assert.match(cards[1].textContent, /Insurance.*\$2,218 CAD/s);
    for (const card of cards) assert.match(card.textContent, /Generic Ontario average.*Generic planning allowance/s);
    assert.match(page.window.document.querySelector('.ownership-scope').textContent, /annual running expenses \(20%\)/);
    assert.match(page.window.document.querySelector('.ownership-checklist').textContent, /insurance quotes.*service records.*taxes.*financing/s);
    assert.equal(page.window.document.querySelectorAll('.ownership-checklist a[rel="noopener noreferrer"]').length, 1);
    page.window.close();
    for (const invalid of [{ ...scenario, annualKm: 0 }, { ...scenario, pricePerLitre: NaN }, { ...scenario, annualKm: Number.MAX_VALUE, pricePerLitre: 10 }]) {
      const page = render(invalid);
      assert.doesNotMatch(page.window.document.body.textContent, /Infinity|NaN/);
      assert.match(page.window.document.querySelectorAll('.ownership-facts dd')[1].textContent, /Incomplete/);
      assert.match(page.window.document.querySelector('.ownership-vehicles li').textContent, /Annual running expensesIncomplete/);
      page.window.close();
    }
    assert.deepEqual({ car, missing, scenario }, before);
  } finally { await vite.close(); }
});
