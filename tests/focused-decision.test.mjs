import test from 'node:test';
import assert from 'node:assert/strict';
import { decisionSummary, entrySummary, PRIMARY_MODES } from '../src/decision-summary.js';
import { rankDecisionMode } from '../src/decision-engine.js';
import { ratedCar } from './fixtures/scoring-fixtures.mjs';
import { planningData } from './fixtures/ownership-fixtures.mjs';
import { createOwnershipState } from '../src/ownership-calculator.js';

function informedCar(id = 'car') {
  const car = ratedCar(id, 4, '2.0 L 4-cylinder engine. 200 hp. 300 Nm. Curb weight: 1500 kg.');
  Object.assign(car.enrichment.modelSpecs, planningData({ year: 2018, make: 'Honda', model: 'Civic' }));
  const ratings = car.enrichment.modelSpecs.dimensionRatings;
  ratings.rideQuality.rationale = 'Absorbs broken-road bumps without excessive body movement.';
  ratings.frontSeatComfort.rationale = 'Supportive front-seat cushioning for long drives.';
  ratings.rearSeatComfort.rationale = 'Rear-seat cushioning supports adult occupants.';
  ratings.cabinQuietness.rationale = 'Road and wind noise stay subdued at highway speeds.';
  ratings.frontPassengerSpace.rationale = 'Front occupants have useful leg and shoulder room.';
  ratings.rearPassengerSpace.rationale = 'Rear passenger legroom is limited for taller adults.';
  ratings.cargoSpace.rationale = 'A wide cargo opening makes grocery loading easier.';
  return car;
}
const notesFor = (cars, mode, ownership) => {
  const summary = decisionSummary(cars, mode, 2026, undefined, ownership);
  return { summary, notes: entrySummary(summary, summary.ranking.ranked[0]) };
};

test('the six-item budget includes the model overview, trade-off and every purchase warning as research arrives', () => {
  const car = informedCar();
  const pending = structuredClone(car);
  delete pending.enrichment.modelSpecs.modelAdvice;
  car.description += ' Engine problems. Coolant leak. Not running. Needs repairs.';
  const before = structuredClone(car);
  for (const vehicle of [pending, car]) {
    for (const { id } of PRIMARY_MODES) {
      const { notes } = notesFor([vehicle], id);
      assert.ok(notes.items.length >= 1 && notes.items.length <= 6, id);
      assert.equal(notes.items.filter(item => item.kind === 'tradeoff').length, 1);
      assert.equal(notes.items.filter(item => item.kind === 'overview').length, Number(id === 'value'));
      if (vehicle === car) {
        const warning = notes.items.filter(item => item.kind === 'warning');
        assert.equal(warning.length, 1);
        for (const label of ['Engine concern', 'Coolant leak', 'Not running', 'Repairs disclosed']) assert.ok(warning[0].text.includes(label));
      }
      assert.equal(new Set(notes.items.map(item => item.text.toLowerCase())).size, notes.items.length);
    }
  }
  assert.deepEqual(car, before, 'presenting summaries never changes imported records or research');
  const { notes } = notesFor([car], 'value');
  assert.equal(notes.items[0].text, car.enrichment.modelSpecs.modelAdvice.overview);
  assert.equal(notes.items[0].label, 'AI model guidance—not independently verified');
});

test('each priority excludes unrelated advice while keeping the relevant evidence and provenance', () => {
  const car = informedCar();
  const { notes: comfort } = notesFor([car], 'comfort');
  const comfortText = JSON.stringify(comfort.items);
  assert.match(comfortText, /broken-road bumps.*front-seat cushioning.*Rear-seat cushioning.*Road and wind noise/s);
  assert.doesNotMatch(comfortText, /CAD|grocery|cargo opening|200 hp|300 Nm|relaxed daily drive|cooling-system leaks/);
  assert.ok(comfort.items.some(item => item.sources?.some(source => source.url === 'https://reviews.example.test/fixture')));
  const { notes: practical } = notesFor([car], 'practical');
  assert.match(JSON.stringify(practical.items), /leg and shoulder room.*Rear passenger legroom.*cargo opening.*5-seat need/s);
  assert.doesNotMatch(JSON.stringify(practical.items), /front-seat cushioning|wind noise|CAD|200 hp|Engine durability/);
  const { notes: cost } = notesFor([car], 'cost');
  assert.match(JSON.stringify(cost.items), /Purchase price.*Annual running expenses.*Insurance.*Maintenance/s);
  assert.doesNotMatch(JSON.stringify(cost.items), /cushioning|wind noise|cargo opening|200 hp|Engine durability|relaxed daily drive/);
  const { notes: performance } = notesFor([car], 'performance');
  assert.match(JSON.stringify(performance.items), /hp\/tonne.*200 hp.*300 Nm/s);
  assert.doesNotMatch(JSON.stringify(performance.items), /CAD|wind noise|cargo opening|front-seat cushioning|relaxed daily drive/);
});

test('cost points use calculator overrides, keep incomplete totals explicit and do not change rankings', () => {
  const car = informedCar(), peer = informedCar('peer');
  peer.priceCAD.value = '25000';
  const ownership = createOwnershipState();
  ownership.vehicles.car = { insuranceAnnual: '4000', maintenancePerKm: '0.20', energyOverride: '1200' };
  const { notes, summary } = notesFor([car, peer], 'cost', ownership);
  const entry = summary.ranking.ranked.find(item => item.car === car);
  const ownNotes = entrySummary(summary, entry);
  assert.match(JSON.stringify(ownNotes.items), /4,000 CAD.*Your calculator input/);
  assert.match(JSON.stringify(ownNotes.items), /3,000 CAD.*Your calculator input/);
  assert.match(JSON.stringify(ownNotes.items), /1,200 CAD.*Your calculator input/);
  assert.ok(notes.items.length <= 6);
  for (const { id } of PRIMARY_MODES) {
    const presented = decisionSummary([car, peer], id, 2026, undefined, ownership);
    const original = rankDecisionMode([car, peer], id, 2026, undefined, ownership);
    assert.deepEqual(presented.ranking.ranked.map(item => [item.car.legacyItemId, item.score]), original.ranked.map(item => [item.car.legacyItemId, item.score]));
  }
  ownership.vehicles.car.insuranceAnnual = '';
  const incomplete = decisionSummary([car], 'cost', 2026, undefined, ownership);
  const text = JSON.stringify(entrySummary(incomplete, incomplete.ranking.ranked[0]).items);
  assert.match(text, /Annual running expenses: Incomplete/);
  assert.doesNotMatch(text, /NaN|Infinity/);
});

test('sparse data stays concise and unsupported presentation modes normalize without removing the legacy engine mode', () => {
  assert.equal(PRIMARY_MODES.length, 5);
  assert.ok(!PRIMARY_MODES.some(item => item.id === 'balanced'));
  const car = { legacyItemId: 'unknown' };
  const { notes } = notesFor([car], 'performance');
  assert.equal(notes.items.length, 1, 'missing performance evidence is not padded with unrelated facts');
  for (const mode of ['balanced', 'invalid', undefined]) assert.equal(decisionSummary([car], mode).requested.mode.id, 'value');
  assert.equal(rankDecisionMode([car], 'balanced').mode.id, 'balanced');
  assert.match(notesFor([car], 'value').notes.items[0].text, /overview is not available/);
  const known = informedCar(), partialPeer = ratedCar('peer', 3, '150 Nm.');
  const summary = decisionSummary([known, partialPeer], 'performance', 2026);
  const entry = summary.ranking.ranked.find(item => item.car === known);
  const partial = entrySummary(summary, entry);
  assert.match(JSON.stringify(partial.items), /200 hp/);
  assert.match(JSON.stringify(partial.items), /excluded from comparative score/);
  assert.equal(summary.requested.criteria.some(criterion => criterion.key === 'power' && criterion.active), false);
  assert.equal(entry.score, rankDecisionMode([known, partialPeer], 'performance', 2026).ranked.find(item => item.car === known).score);
});
