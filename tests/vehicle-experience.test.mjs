import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveVehicleExperience, annualEnergyCost, DEFAULT_SCENARIO } from '../src/vehicle-experience.js';
import { validatedExperience, mergeExperience } from '../shared/experience.js';
import { mergeResearch } from '../shared/model-specs.js';
import { createSpecCache } from '../src/spec-cache.js';
import { createSpecScheduler } from '../src/spec-scheduler.js';
import { enrichVehicle } from '../src/enrichment.js';
import { epaCandidate } from '../src/spec-catalog.js';
import { rankDecisionMode } from '../src/decision-engine.js';
import { estimateVehicleExperience } from '../backend/model-specs.mjs';
import { createHandler } from '../backend/handler.mjs';
import { ratedCar } from './fixtures/scoring-fixtures.mjs';

const input = { year: 2018, make: 'Honda', model: 'Civic', fields: [] };
const car = (extra = {}) => ({ ...input, year: '2018', legacyItemId: 'car', ...extra });
const record = (extra = {}) => ({ quality: 'estimated', origin: 'model-estimate', scope: { year: 2018, make: 'Honda', model: 'Civic' }, assumptions: ['Synthetic model estimate; not a real vehicle assessment.'], rationale: 'Synthetic estimate for this regression only.', evidence: [], ...extra });
const experience = () => ({ ratings: { rideQuality: record({ rating: 4 }), frontSeatComfort: record({ rating: 4 }) }, energy: record({ powertrain: 'liquid', litresPer100Km: 7 }), heating: record({ availability: 'likely' }), practicality: record() });

test('all required topics and positive running costs exist immediately without network or identity', () => {
  for (const vehicle of [{}, car(), car({ enrichment: { modelSpecs: { status: 'quota', fields: {} } } })]) {
    const resolved = resolveVehicleExperience(vehicle);
    assert.ok(resolved.energy.annualCost > 0);
    for (const dimension of ['rideQuality', 'frontSeatComfort', 'cabinQuietness', 'seatHeating', 'frontPassengerSpace', 'cargoSpace']) assert.ok(resolved.ratings[dimension].rationale);
    assert.equal(resolved.energy.origin, 'baseline');
    assert.equal(resolved.heating.availability, 'trim-dependent');
    assert.ok(resolved.practicality.rationale);
  }
});

test('fuel, EV and plug-in arithmetic uses the same bounded scenario, including electric-share endpoints', () => {
  const liquid = { powertrain: 'liquid', litresPer100Km: 8 }, ev = { powertrain: 'electric', kwhPer100Km: 20 };
  const phev = { powertrain: 'phev', litresPer100Km: 8, kwhPer100Km: 20 };
  assert.equal(annualEnergyCost(liquid), 2040);
  assert.equal(annualEnergyCost(ev), 450);
  assert.equal(annualEnergyCost(phev), 1245);
  assert.equal(annualEnergyCost(phev, { ...DEFAULT_SCENARIO, electricShare: 0 }), 2040);
  assert.equal(annualEnergyCost(phev, { ...DEFAULT_SCENARIO, electricShare: 100 }), 450);
  for (const scenario of [{ annualKm: 0 }, { pricePerLitre: Infinity }, { pricePerKwh: NaN }, { electricShare: 101 }]) assert.equal(annualEnergyCost(phev, scenario), null);
});

test('exact NRCan, catalog medians, model estimates and local baselines resolve in order', () => {
  const estimated = car({ enrichment: { modelSpecs: { status: 'partial', experience: experience() } } });
  assert.equal(resolveVehicleExperience(estimated).energy.annualCost, 1785);
  const candidate = litres => ({ market: 'CA', energy: { value: litres, unit: 'L/100 km' }, source: { publisher: 'NRCan' } });
  estimated.enrichment.catalog = { status: 'ambiguous', candidates: [candidate(6), candidate(10)] };
  const median = resolveVehicleExperience(estimated);
  assert.equal(median.energy.annualCost, 2040);
  assert.match(median.energy.rationale, /no engine has been selected/);
  estimated.enrichment.fuel = { status: 'matched', combined: 5 };
  assert.equal(resolveVehicleExperience(estimated).energy.annualCost, 1275);
});

test('bundled EV and PHEV consumption stays usable offline and catalog units remain distinct', async () => {
  const data = JSON.parse(await readFile('public/data/catalog/2025.json', 'utf8'));
  const rows = data.rows.map(values => Object.fromEntries(data.columns.map((key, i) => [key, values[i]])));
  for (const type of ['EV', 'Plug-in Hybrid']) {
    const row = rows.find(row => type === 'EV' ? row.atvType === 'EV' : /plug-in/i.test(row.atvType));
    const candidate = epaCandidate(row, 'test');
    const vehicle = { year: '2025', make: row.make, model: row.model, enrichment: { catalog: { status: 'matched', candidates: [candidate], selectedId: candidate.id } } };
    const resolved = resolveVehicleExperience(vehicle);
    assert.equal(resolved.energy.powertrain, type === 'EV' ? 'electric' : 'phev');
    assert.ok(resolved.energy.annualCost > 0);
    assert.ok((resolved.energy.kwhPer100Km || resolved.energy.alternatives?.[0].kwhPer100Km) > 0);
  }
  const ev = car({ description: 'Fuel type: Electric.' });
  assert.equal(resolveVehicleExperience(ev).energy.powertrain, 'electric');
  assert.ok(resolveVehicleExperience(ev).energy.annualCost > 0);
});

test('sourced comfort replaces individual estimates and two-seat cars have no rear-seat penalty', () => {
  const vehicle = ratedCar('sourced', 5);
  vehicle.enrichment.modelSpecs.experience = experience();
  const sourced = resolveVehicleExperience(vehicle);
  assert.equal(sourced.ratings.rideQuality.rating, 5);
  assert.equal(sourced.ratings.rideQuality.quality, undefined);
  vehicle.itemSpecifics = [{ name: 'Seats', value: '2' }];
  vehicle.enrichment.modelSpecs.dimensionRatings.frontSeatComfort.rating = 4;
  const twoSeat = resolveVehicleExperience(vehicle);
  assert.equal(twoSeat.seatComfort, 4);
  assert.equal(twoSeat.hasRearSeats, false);
  assert.equal(twoSeat.ratings.rearSeatComfort, undefined);
});

test('a compatible plug-in catalog reference keeps charging visible even with a fuel-only NRCan match', () => {
  const candidate = { id: 'plug-in', powertrain: 'Plug-in Hybrid', energy: { value: 8, unit: 'L/100 km', secondaryFuel: 'Electricity', kwhPer100Km: 20 } };
  const resolved = resolveVehicleExperience(car({ enrichment: { fuel: { status: 'matched', combined: 8 }, catalog: { selectedId: 'plug-in', candidates: [candidate] } } }));
  assert.equal(resolved.energy.powertrain, 'phev');
  assert.equal(resolved.energy.annualCost, 1245);
});

test('sourced dimensions survive caching without losing citations or renewing expiry', () => {
  let now = 1000, saved;
  const storage = { getItem: () => saved, setItem: (_, value) => { saved = value; }, removeItem: () => { saved = null; } };
  const cache = createSpecCache({ storage, now: () => now });
  const dimensions = ratedCar('reviewed').enrichment.modelSpecs.dimensionRatings;
  cache.save(input, { dimensionRatings: dimensions });
  const reloaded = createSpecCache({ storage, now: () => now });
  assert.equal(reloaded.read(input).dimensionRatings.rideQuality.evidence[0].editorial, true);
  now += 31 * 86400000;
  assert.equal(reloaded.read(input), null);
  const stale = reloaded.read(input, { allowStale: true });
  assert.equal(stale.dimensionRatings.rideQuality.stale, true);
  reloaded.save(input, stale);
  assert.equal(reloaded.read(input), null);
});

test('seller heating claims beat model guesses and absent equipment is different from unresolved equipment', () => {
  const withHeat = car({ description: 'Heated seats.', enrichment: { modelSpecs: { status: 'partial', experience: experience() } } });
  assert.equal(resolveVehicleExperience(withHeat).heating.availability, 'present');
  assert.equal(resolveVehicleExperience({ ...withHeat, description: 'No heated seats.' }).heating.rating, 0);
  assert.equal(resolveVehicleExperience(car()).heating.rating, 2.5);
});

test('estimates contribute to rankings, space affects only practicality and mixed fuels remain comparable', () => {
  const a = ratedCar('a', 4, 'Heated seats.'), b = ratedCar('b', 4, 'Heated seats.');
  const before = rankDecisionMode([a, b], 'comfort');
  for (const key of ['frontPassengerSpace', 'rearPassengerSpace', 'cargoSpace']) a.enrichment.modelSpecs.dimensionRatings[key].rating = 0;
  assert.deepEqual(rankDecisionMode([a, b], 'comfort').ranked.map(e => e.score), before.ranked.map(e => e.score));
  assert.equal(rankDecisionMode([a, b], 'practical').best[0].car.legacyItemId, 'b');
  const estimated = rankDecisionMode([car({ legacyItemId: 'one' }), car({ legacyItemId: 'two' })], 'comfort');
  assert.equal(estimated.best.length, 2);
  assert.equal(estimated.provisional, true);
  assert.equal(estimated.evidenceCoverage, 0);
  a.enrichment.fuel = { status: 'matched', combined: 6, fuel: 'X' };
  b.enrichment.fuel = { status: 'matched', combined: 10, fuel: 'Z' };
  assert.equal(rankDecisionMode([a, b], 'cost').criteria.find(c => c.key === 'fuel').active, true);
});

test('estimate validation rejects contradictory scope, implausible values and fabricated evidence per field', () => {
  const bad = experience();
  bad.ratings.rideQuality.rating = 100;
  bad.heating.evidence = [{ url: 'https://invented.test' }];
  bad.energy.scope = { ...input, model: 'Accord' };
  const clean = validatedExperience(bad, input);
  assert.deepEqual(Object.keys(clean.ratings), ['frontSeatComfort']);
  assert.equal(clean.energy, undefined);
  assert.equal(clean.heating, undefined);
  assert.ok(clean.practicality);
});

test('partial and failed responses preserve each useful detail and never replace fresh data with stale data', () => {
  const old = experience(), incoming = { ratings: { cabinQuietness: record({ rating: 4 }) } };
  const merged = mergeExperience(old, incoming);
  assert.ok(merged.energy); assert.ok(merged.ratings.rideQuality); assert.ok(merged.ratings.cabinQuietness);
  assert.equal(mergeExperience(old, { energy: { ...old.energy, stale: true, litresPer100Km: 20 } }).energy.litresPer100Km, 7);
  assert.equal(mergeResearch({ status: 'partial', experience: old }, { status: 'quota', fields: {} }).experience.energy.litresPer100Km, 7);
});

test('experience cache is allowlisted, expires without renewal, supports stale recovery and clears', () => {
  let saved, now = 1000;
  const storage = { getItem: () => saved, setItem: (_, value) => { saved = value; }, removeItem: () => { saved = null; } };
  const cache = createSpecCache({ storage, now: () => now });
  cache.save({ ...input, vin: 'PRIVATEVIN' }, { experience: { ...experience(), vin: 'PRIVATEVIN' }, seller: 'PRIVATESELLER' });
  assert.doesNotMatch(saved, /PRIVATEVIN|PRIVATESELLER/);
  assert.equal(createSpecCache({ storage, now: () => now }).read(input).experience.energy.litresPer100Km, 7);
  now += 8 * 86400000;
  assert.equal(cache.read(input), null);
  const stale = cache.read(input, { allowStale: true });
  assert.equal(stale.experience.energy.stale, true);
  cache.save(input, stale);
  assert.equal(cache.read(input), null, 'reading or resaving cached records cannot renew their expiry');
  cache.clear(); assert.equal(cache.read(input, { allowStale: true }), null);
});

test('experience endpoint is opt-in, bounded, tool-free and validates partial provider output', async () => {
  const result = await estimateVehicleExperience(input, { apiKey: 'test', fetcher: async (_, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.tools, undefined);
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ ratings: [{ dimension: 'rideQuality', rating: 4, rationale: 'Synthetic model ride estimate for this test.' }], energy: { powertrain: 'liquid', litresPer100Km: 7, rationale: 'Synthetic combined consumption for this test.' }, heating: { availability: 'likely', rationale: 'Synthetic trim-based availability for this test.' } }) }] } }] });
  } });
  assert.equal(result.experience.ratings.rideQuality.rating, 4);
  assert.equal(result.experience.energy.evidence.length, 0);
  const domains = [], handler = createHandler({ modelSpecsLookup: async (_, options) => { domains.push(options.domain); return result; } });
  const request = body => new Request('https://app.test/api/model-specs', { method: 'POST', headers: { origin: 'https://app.test', 'content-type': 'application/json' }, body: JSON.stringify({ ...input, ...body }) });
  assert.equal((await handler(request({ domain: 'experience', phase: 'quick' }))).status, 200);
  assert.deepEqual(domains, ['experience']);
  assert.equal((await handler(request({ domain: 'experience' }))).status, 400);
});

test('missing credentials, malformed responses and access/quota failures leave local estimates usable', async () => {
  assert.equal((await estimateVehicleExperience(input, { apiKey: '' })).status, 'not-configured');
  for (const status of [401, 429]) {
    let calls = 0;
    const result = await estimateVehicleExperience(input, { apiKey: 'test', fetcher: async () => { calls++; return new Response('', { status }); } });
    assert.equal(result.status, status === 429 ? 'quota' : 'model-unavailable');
    assert.equal(calls, 1);
    assert.ok(resolveVehicleExperience(car({ enrichment: { modelSpecs: result } })).energy.annualCost > 0);
  }
  const malformed = await estimateVehicleExperience(input, { apiKey: 'test', fetcher: async () => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'invalid JSON' }] } }] }) });
  assert.equal(malformed.status, 'unavailable');
  assert.ok(resolveVehicleExperience(car({ enrichment: { modelSpecs: malformed } })).ratings.frontSeatComfort);
});

test('experience enrichment runs before catalog and VIN resolve, survives failure, and cannot repopulate cleared cache', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; }), snapshots = [], cache = createSpecCache({ storage: null });
  const lookup = enrichVehicle(car(), { cache, scheduler: createSpecScheduler(), onUpdate: state => snapshots.push(state), fetcher: async (url, init) => {
    if (url.startsWith('/data/')) return pending;
    const body = JSON.parse(init.body);
    return Response.json({ modelSpecs: body.domain === 'experience' ? { status: 'partial', experience: experience() } : { status: 'unavailable', fields: {} } });
  } });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.ok(snapshots.some(s => s.modelSpecs?.experience?.energy));
  cache.clear();
  release(Response.json({ columns: [], rows: [] }));
  const final = await lookup;
  assert.equal(final.modelSpecs.experience.energy.litresPer100Km, 7);
  assert.equal(cache.read(input), null);
});
