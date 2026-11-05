import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractVehicleSpecs } from '../src/vehicle-specs.js';
import { matchSpecCatalog, nrcanCandidate } from '../src/spec-catalog.js';
import { referenceMarket, sellerMarket } from '../src/reference-market.js';
import { resolveMileage, mileageDisplay } from '../src/mileage.js';
import { validateDetailOptions } from '../src/vehicle-overrides.js';
import { decisionSummary, entrySummary } from '../src/decision-summary.js';
import { sellerHistoryContext } from '../src/ownership-context.js';
import { validResearchInsight } from '../shared/model-specs.js';
import { enrichVehicle } from '../src/enrichment.js';
import { createSpecCache } from '../src/spec-cache.js';
import { ratedCar, addAcceleration } from './fixtures/scoring-fixtures.mjs';
import { liveResearchForCar } from '../src/model-research.js';

const base = { year: 2020, make: 'Test', model: 'Car' };
const ca = nrcanCandidate({ ...base, displacement: 2, cylinders: 4, transmission: 'AV', fuel: 'X', combined: 7, vehicleClass: 'Mid-size' }, 0);
const us = { ...ca, id: 'epa:test', market: 'US', energy: { value: 8, unit: 'L/100 km' } };
const match = (car, rows = [ca, us], id) => {
  const specs = extractVehicleSpecs(car).specs;
  return matchSpecCatalog(specs, rows, id, referenceMarket(car, specs));
};

test('reference defaults follow seller country without changing original market; overrides retain compatibility checks', () => {
  for (const country of ['CA', 'Canada', 'CAN']) {
    const car = { ...base, location: { country } };
    assert.equal(match(car).selectedId, ca.id);
    assert.equal(extractVehicleSpecs(car).specs.market.value, null);
    assert.equal(match({ ...car, referenceMarket: 'US' }).selectedId, us.id);
  }
  assert.equal(match({ ...base, location: { country: 'US' } }).selectedId, us.id);
  assert.equal(match({ ...base, location: 'Toronto, Canada' }).selectedId, ca.id);
  assert.equal(match(base).status, 'ambiguous');
  assert.equal(match({ ...base, location: { country: 'GB' } }).candidates.length, 2);
  assert.equal(sellerMarket({ location: { stateOrProvince: 'CA', country: 'US' } }), 'US');
  assert.equal(match({ ...base, market: 'US', location: { country: 'CA' } }).selectedId, us.id);
  assert.equal(match({ ...base, market: 'US', referenceMarket: 'CA' }).status, 'unmatched');
  const unavailable = match({ ...base, location: { country: 'CA' } }, [us]);
  assert.equal(unavailable.status, 'unmatched');
  assert.match(unavailable.reason, /CA reference.*reference market/);
  assert.equal(match({ ...base, referenceMarket: 'US' }, [ca, us], ca.id).selectedId, undefined);
});

test('enrichment uses seller-based market selection at both catalog stages', async () => {
  const data = await readFile('public/data/fuel/2018.json', 'utf8');
  const epa = await readFile('public/data/catalog/2018.json', 'utf8');
  for (const country of ['CA', 'US']) {
    const car = { year: 2018, make: 'Honda', model: 'Accord', location: { country } };
    const states = [];
    const result = await enrichVehicle(car, { cache: createSpecCache({ storage: null }), onUpdate: state => states.push(state), fetcher: async url => {
      if (url === '/data/fuel/2018.json') return new Response(data, { headers: { 'Content-Type': 'application/json' } });
      if (url === '/data/catalog/2018.json') return new Response(epa, { headers: { 'Content-Type': 'application/json' } });
      return new Response('{}', { status: 503 });
    } });
    assert.ok(result.catalog.candidates.length);
    assert.ok(result.catalog.candidates.every(c => c.market === country));
    assert.ok(states.filter(s => s.catalog?.candidates?.length).every(s => s.catalog.candidates.every(c => c.market === country)));
  }
});

test('mileage corrections validate explicit units, preserve source evidence, reset and normalize scoring', () => {
  const original = ratedCar('mileage');
  const before = structuredClone(original);
  const choices = validateDetailOptions({ referenceMarket: 'CA', mileageOverride: { amount: '50000', unit: 'mi' } });
  const edited = { ...original, ...choices };
  const mileage = resolveMileage(edited);
  assert.equal(mileage.amount, 50000);
  assert.equal(mileage.unit, 'mi');
  assert.equal(mileage.userEntered, true);
  assert.equal(mileage.sellerReported, false);
  assert.equal(mileage.originalEvidence[0].amount, 100000);
  assert.match(mileageDisplay(edited), /50000 mi · User-entered/);
  const summary = decisionSummary([edited], 'value', 2026);
  assert.ok(Math.abs(summary.ranking.ranked[0].values.mileage - 80467.2) < 1e-8);
  assert.equal(summary.ranking.ranked[0].labels.mileage, 'User-entered mileage');
  assert.equal(resolveMileage({ ...edited, ...validateDetailOptions({}) }).amount, 100000);
  assert.equal(validateDetailOptions({ mileageOverride: { amount: 0, unit: 'km' } }).mileageOverride.amount, 0);
  for (const value of [{ amount: '', unit: 'km' }, { amount: -1, unit: 'km' }, { amount: 3, unit: '' }, { amount: Infinity, unit: 'mi' }, { amount: true, unit: 'km' }]) assert.throws(() => validateDetailOptions({ mileageOverride: value }), /nonnegative mileage/);
  assert.throws(() => validateDetailOptions({ referenceMarket: 'GB' }), /CA or US/);
  assert.deepEqual(original, before);
  const conflict = { mileage: { raw: '1000', unit: ['mi', 'km'] } };
  assert.equal(resolveMileage(conflict).status, 'conflict');
  assert.equal(resolveMileage({ ...conflict, mileageOverride: { amount: 1000, unit: 'km' } }).status, 'known');
});

test('history context preserves explicit seller claims and never promotes absent, negated or conflicting history', () => {
  assert.match(sellerHistoryContext({ description: 'CLEAN CARFAX. New tyres.' }).text, /Seller states: “CLEAN CARFAX”/);
  assert.equal(sellerHistoryContext({ title: 'Clean Carfax' }).label, 'Seller-reported · report not verified');
  for (const description of ['No clean Carfax.', 'Does not have a clean Carfax.', "Doesn’t have a clean Carfax.", 'Carfax is not clean.', 'Clean Carfax not provided.', 'Carfax available.', 'No accidents reported.', '<script>Clean Carfax</script>']) {
    const note = sellerHistoryContext({ description });
    assert.ok(!note || !note.text.includes('Seller states:'), description);
  }
  const conflict = sellerHistoryContext({ title: 'Clean Carfax', description: 'Rebuilt title. Carfax shows an accident.' });
  assert.match(conflict.text, /Conflicting seller history claims/);
  assert.match(conflict.text, /Rebuilt title/);
  assert.match(sellerHistoryContext({ title: 'Clean Carfax', description: 'No Carfax report available.' }).text, /Conflicting seller history claims/);
  assert.match(sellerHistoryContext({ title: 'Clean Carfax', description: 'Rebuilt title, no accidents reported.' }).text, /Conflicting seller history claims/);
  assert.equal(sellerHistoryContext({ description: 'No accident history and not a rebuilt title.' }), null);
});

const engineScope = { year: 2018, make: 'BMW', model: '340i', displacement: 3, cylinders: 6 };
const insight = { id: 'reliability', text: 'The review reports a favourable reliability reputation for the B58 engine.', engineFamily: 'B58', categories: ['reliability', 'value', 'cost'], tone: 'advantage', scope: engineScope,
  evidence: [{ source: 'Synthetic review', url: 'https://reviews.example.test/bmw', quote: 'Synthetic: 2018 BMW 340i uses the B58 engine, with a favourable reliability reputation.', configuration: engineScope }] };

test('engine reliability requires exact applicability and supporting engine-family evidence', () => {
  assert.equal(validResearchInsight(insight, engineScope), true);
  assert.equal(validResearchInsight({ ...insight, engineFamily: undefined }, engineScope), false);
  assert.equal(validResearchInsight({ ...insight, evidence: [{ ...insight.evidence[0], quote: 'A reliable engine.' }] }, engineScope), false);
  assert.equal(validResearchInsight({ ...insight, evidence: [{ ...insight.evidence[0], quote: 123 }] }, engineScope), false);
  assert.equal(validResearchInsight(insight, { ...engineScope, model: '330i' }), false);
  assert.equal(validResearchInsight(insight, { year: 2018, make: 'BMW', model: '340i' }), false);
  assert.equal(validResearchInsight({ ...insight, scope: { ...engineScope, trim: 'Special' }, contextOnly: true, contextReason: 'Unknown trim' }, engineScope), false);
  assert.equal(validResearchInsight({ ...insight, text: 'This car is reliable and has no accident history.' }, engineScope), false);
});

test('reliability and seller history appear in value and affordability explanations without scoring bonuses', () => {
  const car = { ...ratedCar('reliability'), ...engineScope, year: '2018', description: '3.0 L I6. 300 hp. 400 Nm. Curb weight: 1500 kg. Clean Carfax.' };
  const original = structuredClone(car);
  car.enrichment.modelSpecs.insights = [insight];
  for (const mode of ['cost', 'value']) {
    const summary = decisionSummary([car], mode, 2026);
    const entry = summary.ranking.ranked[0];
    const notes = entrySummary(summary, entry);
    assert.match(JSON.stringify(notes.reasons), /B58 engine/);
    assert.match(JSON.stringify(notes.reasons), /report not verified/);
    assert.equal(entry.score, decisionSummary([original], mode, 2026).ranking.ranked[0].score);
    if (mode === 'cost') assert.match(JSON.stringify(notes.reasons), /Estimated annual fuel cost.*km\/year/);
  }
  car.enrichment.modelSpecs.insights = [];
  assert.doesNotMatch(JSON.stringify(entrySummary(decisionSummary([car], 'value', 2026), decisionSummary([car], 'value', 2026).ranking.ranked[0])), /B58 engine/);
  car.enrichment.catalog = { status: 'matched', selectedId: 'synthetic:ca', values: {}, candidates: [{ id: 'synthetic:ca', market: 'CA', values: engineScope }] };
  car.enrichment.modelSpecs.insights = [{ ...insight, scope: { ...engineScope, market: 'CA' } }];
  assert.equal(liveResearchForCar(car).insights.length, 1, 'selected dataset scopes are validated consistently without inventing an original market');
});

test('power-to-weight explains lower output and lower weight; quicker claims require compatible measured acceleration', () => {
  const light = ratedCar('light', 3, '200 hp. 300 Nm. Curb weight: 1000 kg.');
  const heavy = { ...ratedCar('heavy', 3, '300 hp. 400 Nm. Curb weight: 2000 kg.'), model: 'Accord' };
  const notes = () => { const summary = decisionSummary([light, heavy], 'performance', 2026); return entrySummary(summary, summary.ranking.ranked.find(e => e.car === light)); };
  assert.match(notes().reasons[0].text, /Despite 200 hp versus 300 hp.*Accord.*1,000 versus 2,000 kg.*200.0 versus 150.0 hp\/tonne/);
  assert.doesNotMatch(notes().reasons[0].text, /figures are quicker/);
  addAcceleration(light, 'zeroTo100KphSeconds', 5);
  addAcceleration(heavy, 'zeroTo100KphSeconds', 6);
  assert.match(notes().reasons[0].text, /figures are quicker: 5 s versus 6 s/);
  heavy.enrichment.modelSpecs.fields.zeroTo100KphSeconds.measurementMethod = 'instrumented-test';
  assert.doesNotMatch(notes().reasons[0].text, /figures are quicker/);
  heavy.description = '300 hp. 400 Nm.';
  assert.doesNotMatch(JSON.stringify(notes().reasons), /Despite 200 hp/);
});

test('affordability explanations keep fuel, charging and plug-in assumptions visible for unscored cars too', () => {
  const notesFor = (car, scenario) => { const summary = decisionSummary([car], 'cost', 2026, scenario); return entrySummary(summary, summary.ranking.ranked[0]); };
  const ev = { ...ratedCar('ev'), model: 'Electric example', itemSpecifics: [{ name: 'Fuel type', value: 'Electric' }] };
  const evNotes = notesFor(ev, { annualKm: 12000, pricePerKwh: 0.2 });
  assert.match(JSON.stringify(evNotes.reasons), /Estimated annual charging cost.*12,000 km\/year.*0.20\/kWh/);
  assert.doesNotMatch(JSON.stringify(evNotes.reasons), /1.70\/L/);
  const phev = { ...ratedCar('phev'), model: 'Example PHEV', priceCAD: undefined };
  const plugInNotes = notesFor(phev, { electricShare: 75 });
  assert.match(JSON.stringify(plugInNotes.reasons), /Estimated annual fuel \/ charging cost.*75% electric driving/);
  const invalid = notesFor(ev, { annualKm: 0 });
  assert.match(JSON.stringify(invalid.reasons), /check driving and energy-price assumptions/);
  assert.doesNotMatch(JSON.stringify(invalid.reasons), /\$0 CAD\/year/);
});
