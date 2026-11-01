import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { epaCandidate, nrcanCandidate, matchSpecCatalog } from '../src/spec-catalog.js';
import { extractVehicleSpecs } from '../src/vehicle-specs.js';
import { modelResearchRequest } from '../src/model-specs.js';
import { validateOverrides } from '../src/vehicle-overrides.js';
import { evaluateCatalog } from '../scripts/spec-catalog-evaluation.mjs';
import { enrichVehicle } from '../src/enrichment.js';
import { createSpecCache } from '../src/spec-cache.js';
import { createHandler } from '../backend/handler.mjs';

const rows = async year => { const data = JSON.parse(await readFile(`public/data/catalog/${year}.json`)); return data.rows.map(row => epaCandidate(Object.fromEntries(data.columns.map((field, index) => [field, row[index]])), data.version)); };
const match = (car, list, selection) => matchSpecCatalog(extractVehicleSpecs(car).specs, list, selection);

test('broad Accord models retain larger-engine and hybrid alternatives instead of silently choosing the base engine', async () => {
  const car = { year: 2018, make: 'Honda', model: 'Accord', market: 'US' };
  const catalog = match(car, await rows(2018));
  assert.equal(catalog.status, 'ambiguous');
  assert.ok(catalog.candidates.some(candidate => candidate.values.displacement === 1.5));
  assert.ok(catalog.candidates.some(candidate => candidate.values.displacement === 2));
  assert.ok(catalog.candidates.some(candidate => candidate.powertrain === 'Hybrid'));
  assert.equal(catalog.values.displacement, undefined);
  assert.equal(modelResearchRequest({ ...car, enrichment: { catalog } }), null);
  const selected = catalog.candidates.find(candidate => candidate.values.displacement === 1.5 && candidate.values.transmission === 'CVT');
  const confirmed = match(car, await rows(2018), selected.id);
  const resolved = extractVehicleSpecs({ ...car, enrichment: { catalog: confirmed } }).specs;
  assert.equal(resolved.displacement.value, 1.5);
  assert.equal(resolved.transmission.value, 'CVT');
  assert.equal(resolved.transmissionSpeeds.status, 'not-applicable');
  assert.ok(modelResearchRequest({ ...car, enrichment: { catalog: confirmed } }));
});

test('incompatible engine, transmission, fuel, identity and original markets do not supply catalog specifications', async () => {
  const list = await rows(2018);
  const car = { year: 2018, make: 'Honda', model: 'Accord', market: 'US' };
  const catalog = match(car, list);
  const cvt = catalog.candidates.find(candidate => candidate.values.transmission === 'CVT');
  for (const change of [{ make: 'Toyota' }, { year: 1995 }, { market: 'CA' }, { itemSpecifics: [{ name: 'Fuel type', value: 'Diesel' }] }, { itemSpecifics: [{ name: 'Transmission', value: 'Manual' }] }]) {
    const result = match({ ...car, ...change }, list, cvt.id);
    assert.equal(result.status, 'unmatched');
    assert.deepEqual(result.values, {});
    assert.equal(result.energy, undefined);
  }
});

test('electric applicability, explicit transmission subtypes and original energy units stay correct', async () => {
  const row = (await rows(2023)).find(candidate => candidate.model === 'Model 3 RWD');
  const car = { year: 2023, make: 'Tesla', model: 'Model 3 RWD', market: 'US' };
  const catalog = match(car, [row]);
  const { specs } = extractVehicleSpecs({ ...car, enrichment: { catalog } });
  assert.equal(specs.displacement.status, 'not-applicable');
  assert.equal(specs.cylinders.status, 'not-applicable');
  assert.ok(!modelResearchRequest({ ...car, enrichment: { catalog } }).fields.some(field => ['displacement', 'cylinders'].includes(field)));
  assert.equal(catalog.energy.unit, 'kWh/100 km');
  assert.equal(catalog.energy.originalUnit, 'kWh/100 mi');
  assert.equal(specs.transmissionSpeeds.value, 1);
  const generic = { id: '0', year: '2020', make: 'Test', model: 'Car', trany: 'Automatic (AM-S7)', fuelType1: 'Premium Gasoline', displ: '2', cylinders: '4', drive: 'Front-Wheel Drive', VClass: 'Compact Cars' };
  assert.equal(epaCandidate(generic, 'test').values.transmission, 'Dual-clutch / automated manual');
  assert.equal(epaCandidate(generic, 'test').values.transmissionSpeeds, 7);
  assert.equal(epaCandidate({ ...generic, fuelType1: 'Hydrogen', comb08: '60' }, 'test').energy, null, 'hydrogen MPG-equivalent must never turn into litres of liquid fuel');
});

test('user corrections retain original evidence, exclude incompatible VIN supplements and reset without mutation', () => {
  const original = { year: 2018, make: 'Honda', model: 'Accord', itemSpecifics: [{ name: 'Engine Size', value: '2.0 L' }], enrichment: { vin: { status: 'decoded', fields: { year: 2018, make: 'Honda', model: 'Accord', displacement: 2, horsepower: 252 } } } };
  const before = structuredClone(original);
  const overrides = validateOverrides({ displacement: '1.5', horsepower: '192' }, original);
  const edited = extractVehicleSpecs({ ...original, specOverrides: overrides }).specs;
  assert.equal(edited.displacement.status, 'user-entered');
  assert.equal(edited.displacement.originalEvidence[0].value, 2);
  assert.equal(edited.horsepower.value, 192);
  assert.equal(extractVehicleSpecs({ ...original, specOverrides: { displacement: 1.5 } }).specs.horsepower.value, null);
  assert.equal(extractVehicleSpecs({ ...original, specOverrides: {} }).specs.horsepower.value, 252);
  assert.throws(() => validateOverrides({ horsepower: '-5' }, original));
  assert.throws(() => validateOverrides({ mileage: 12345 }, original));
  assert.deepEqual(original, before);
});

test('government sources remain distinct and a Canadian listing location does not establish original market', () => {
  const row = { year: 2020, make: 'Test', model: 'Car', displacement: 2, cylinders: 4, transmission: 'AV', fuel: 'X', combined: 7, vehicleClass: 'Mid-size' };
  const ca = nrcanCandidate(row, 0), us = { ...ca, id: 'epa:test', market: 'US', energy: { value: 8, unit: 'L/100 km' } };
  const result = match({ year: 2020, make: 'Test', model: 'Car', location: 'Toronto, Canada' }, [ca, us]);
  assert.equal(result.status, 'ambiguous');
  assert.equal(result.values.market, undefined);
  assert.equal(result.energy, null);
  assert.equal(result.values.displacement, 2);
});

test('catalog outages preserve listings and report a recovery path without blind retrying reference fetches', async () => {
  const calls = [];
  const car = { year: 2018, make: 'Honda', model: 'Accord', description: '192 hp', mileage: { raw: '154865' } };
  const result = await enrichVehicle(car, { cache: createSpecCache({ storage: null }), fetcher: async url => { calls.push(url); return new Response('', { status: 401 }); } });
  assert.equal(extractVehicleSpecs({ ...car, enrichment: result }).specs.horsepower.value, 192);
  assert.match(result.catalog.reason, /Edit details or research/);
  assert.equal(calls.filter(url => url.includes('/data/fuel/')).length, 1);
  assert.equal(calls.filter(url => url.includes('/data/catalog/')).length, 1);
});

test('an old AI engine estimate cannot steer catalog matching or survive a real variant ambiguity', async () => {
  const data = JSON.parse(await readFile('public/data/catalog/2018.json'));
  let providerCalls = 0;
  const car = { year: 2018, make: 'Honda', model: 'Accord', market: 'US', enrichment: { modelSpecs: { status: 'partial', fields: { displacement: { kind: 'value', value: 1.5, quality: 'estimated', origin: 'model-estimate', scope: { year: 2018, make: 'Honda', model: 'Accord' }, assumptions: ['Synthetic old base-engine assumption.'], evidence: [] } } } } };
  const result = await enrichVehicle(car, { cache: createSpecCache({ storage: null }), fetcher: async url => {
    if (url.startsWith('/data/catalog/')) return Response.json(data);
    if (url.startsWith('/data/fuel/')) return Response.json({ columns: [], rows: [] });
    providerCalls++;
    return Response.json({ modelSpecs: { status: 'not-configured', fields: {} } });
  } });
  assert.equal(result.catalog.status, 'ambiguous');
  assert.equal(extractVehicleSpecs({ ...car, enrichment: result }).specs.displacement.value, null);
  assert.equal(providerCalls, 0);
});

test('optional research domain is validated and omission retains the combined API contract', async () => {
  const domains = [];
  const handler = createHandler({ modelSpecsLookup: async (_, options) => { domains.push(options.domain); return { status: 'partial', fields: {} }; } });
  const request = domain => handler(new Request('https://app.test/api/model-specs', { method: 'POST', headers: { origin: 'https://app.test', 'content-type': 'application/json' }, body: JSON.stringify({ year: 2018, make: 'Honda', model: 'Accord', fields: ['horsepower'], domain }) }));
  for (const domain of [undefined, 'specs', 'insights']) assert.equal((await request(domain)).status, 200);
  assert.equal((await request('invalid')).status, 400);
  assert.deepEqual(domains, [undefined, 'specs', 'insights']);
});

test('53 configuration benchmark measures coverage separately from numeric correctness with no hidden manual fills', async () => {
  const report = await evaluateCatalog();
  assert.ok(report.configurations >= 50);
  assert.ok(report.auditedNumericFields >= 80);
  assert.deepEqual(report.numericMismatches, []);
  assert.equal(report.manual, 0);
  assert.equal(report.estimates, 0);
  assert.equal(report.recoverable, report.configurations);
});
