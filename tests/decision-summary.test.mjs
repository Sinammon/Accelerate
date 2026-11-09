import test from 'node:test';
import assert from 'node:assert/strict';
import { decisionSummary, entrySummary, keyFacts } from '../src/decision-summary.js';
import { ratedCar } from './fixtures/scoring-fixtures.mjs';
import { makeDemoCars } from '../src/demo-cars.js';
import { researchForCar } from '../src/model-research.js';
const cars = makeDemoCars();

test('value explains the asking price and documented benefits without changing the winner', () => {
  const first = ratedCar('less', 4, undefined, 15000);
  const second = ratedCar('more', 3, undefined, 25000);
  const summary = decisionSummary([first, second], 'value', 2026);
  assert.equal(summary.ranking.best[0].car, first);
  const notes = entrySummary(summary, summary.ranking.best[0]);
  const text = notes.reasons.map(r => r.text).join(' ');
  assert.match(text, /\$15,000 CAD.*lowest asking price/);
  assert.match(text, /Ride quality: Synthetic assessment/);
  assert.doesNotMatch(text, /Supported capability|\/ 100|\/ 5/);
  assert.ok(notes.tradeoff);
  assert.equal(summary.ranking.best[0].breakdown.find(c => c.key === 'capability').weight, 50);
});

test('comfort prioritizes sourced ride and separate seat descriptions without requiring a score', () => {
  const car = ratedCar('partial');
  const ratings = car.enrichment.modelSpecs.dimensionRatings;
  for (const key of Object.keys(ratings)) if (!['rideQuality', 'frontSeatComfort'].includes(key)) delete ratings[key];
  ratings.rideQuality.rationale = 'Absorbs bumps smoothly.';
  ratings.frontSeatComfort.rationale = 'Supportive front seats over longer journeys.';
  const summary = decisionSummary([car], 'comfort', 2026);
  const notes = entrySummary(summary, summary.ranking.ranked[0]);
  assert.match(notes.reasons[0].text, /Ride quality: Absorbs bumps/);
  assert.match(notes.reasons[1].text, /Seat cushioning: Front: Supportive front seats/);
  assert.doesNotMatch(JSON.stringify(notes.reasons), /Rear-seat comfort|\/ 5/);
  assert.ok(notes.reasons.slice(0, 2).every(r => r.source?.url.startsWith('https:')));
  assert.equal(notes.reasons[2].label, 'General baseline');
  assert.match(notes.explanation, /only contender/);
  assert.ok(keyFacts(car, 'comfort').some(f => f.sourceUrl));
});

test('comfort keeps required topics populated and labels baseline checks', () => {
  const car = ratedCar('shared');
  const summary = decisionSummary([car], 'comfort', 2026);
  assert.equal(entrySummary(summary, summary.ranking.ranked[0]).reasons.filter(r => r.text.includes('Synthetic assessment')).length, 3);
  const unknown = decisionSummary([{ legacyItemId: 'unknown' }], 'comfort', 2026);
  const notes = entrySummary(unknown, unknown.ranking.ranked[0]);
  assert.match(notes.reasons[0].text, /Ride quality: Mainstream bump absorption assumed/);
  assert.match(notes.explanation, /only contender/);
  assert.equal(unknown.ranking.ranked[0].score, 59);
  assert.equal(unknown.ranking.best.length, 1);
});

test('value mentions supported mileage advantages but never compares missing prices', () => {
  const car = ratedCar('lower-mileage');
  const peer = ratedCar('higher-mileage');
  peer.mileage.raw = '150000';
  const summary = decisionSummary([car, peer], 'value', 2026);
  const notes = entrySummary(summary, summary.ranking.ranked.find(e => e.car === car));
  assert.match(JSON.stringify(notes), /lowest reported mileage/);
  peer.priceCAD = null;
  const missing = decisionSummary([car, peer], 'value', 2026);
  assert.doesNotMatch(JSON.stringify(entrySummary(missing, missing.ranking.ranked.find(e => e.car === car))), /lowest asking price/);
  assert.match(JSON.stringify(notes), /lowest reported mileage/);
});

test('sparse comfort and performance retain their category with guidance and no substitute score', () => {
  const before = structuredClone(cars);
  for (const mode of ['comfort', 'performance']) {
    const summary = decisionSummary(cars, mode, 2026);
    assert.equal(summary.kind, mode === 'comfort' ? 'supported' : 'guidance');
    assert.equal(summary.requested.totalWeight, mode === 'comfort' ? 100 : 0);
    assert.equal(summary.requested.best.length > 0, mode === 'comfort');
    assert.equal(summary.ranking.best.length > 0, mode === 'comfort');
    const notes = entrySummary(summary, summary.ranking.ranked[0]);
    assert.match(notes.explanation, mode === 'comfort' ? /equal match|comfort pick/ : /More comparable information/);
    assert.ok(notes.reasons.every(reason => !reason.source || reason.source.url.startsWith('https:')));
  }
  assert.deepEqual(cars, before);
});

test('condition and identity concerns never disappear through the fallback', () => {
  const bad = cars.map(car => ({ ...car, description: 'Engine problems. Not running.' }));
  const summary = decisionSummary(bad, 'comfort', 2026);
  assert.equal(summary.kind, 'review');
  assert.ok(summary.ranking.ranked.every(entry => entry.warnings.length));
  assert.ok(summary.ranking.best.length);
  assert.match(entrySummary(summary, summary.ranking.ranked[0]).explanation, /purchase concerns/);
  const mismatch = decisionSummary(cars.map(car => ({ ...car, enrichment: { vin: { mismatches: [{ field: 'Year' }] } } })), 'cost', 2026);
  assert.ok(mismatch.ranking.best.length);
  assert.equal(mismatch.kind, 'supported');
});

test('baseline-only comfort estimates tie and equal matches stay equal', () => {
  const empty = decisionSummary([{ legacyItemId: 'A' }, { legacyItemId: 'B' }], 'comfort', 2026);
  assert.equal(empty.kind, 'supported');
  assert.ok(empty.ranking.ranked.every(e => e.score === 59));
  assert.equal(empty.ranking.best.length, 2);
  const equal = decisionSummary([ratedCar('first'), ratedCar('second')], 'value', 2026);
  assert.equal(equal.shared, true);
  assert.match(entrySummary(equal, equal.ranking.best[0]).explanation, /equal match/);
  assert.equal(decisionSummary([], 'value', 2026).kind, 'empty');
});

test('short facts include only actual supported claims and preserve provenance', () => {
  const facts = keyFacts(cars[0]);
  assert.deepEqual(facts.map(f => f.label), ['Engine', 'Mileage', 'Transmission']);
  assert.equal(keyFacts({ mileage: { raw: '75k miles' } })[0].value, '120,701 km');
  assert.ok(!facts.some(f => f.label === 'Reported features'));
  assert.deepEqual(keyFacts({}), []);
  const documented = keyFacts({ ...cars[0], description: 'Heated seats. No backup camera.' });
  assert.equal(documented.find(f => f.label === 'Reported features').value, 'Heated seats');
  assert.match(documented.find(f => f.label === 'Reported features').source, /Seller-reported/);
  assert.deepEqual(keyFacts({ priceCAD: { currency: 'CAD', value: null } }), []);
});

test('the screenshot vehicles receive exact-year model context, never installed equipment', () => {
  for (const [year, make, model] of [[2002, 'Ford', 'Thunderbird'], [2005, 'Dodge', 'Sprinter']]) {
    const car = { year: String(year), make, model };
    const research = researchForCar(car);
    assert.equal(research.status, 'matched');
    assert.ok(research.claims.some(c => c.category === 'comfort'));
    assert.equal(researchForCar({ ...car, year: String(year + 1) }).status, 'unavailable');
    assert.deepEqual(keyFacts(car), []);
  }
});
