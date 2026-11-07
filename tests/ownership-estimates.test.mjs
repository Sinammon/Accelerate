import test from 'node:test';
import assert from 'node:assert/strict';
import { validatedOwnershipEstimates, validatedModelAdvice } from '../shared/ownership-estimates.js';
import { validatedResearch, mergeResearch } from '../shared/model-specs.js';
import { estimateVehicleOwnership } from '../backend/model-specs.mjs';
import { createHandler } from '../backend/handler.mjs';
import { createSpecCache } from '../src/spec-cache.js';
import { createSpecScheduler } from '../src/spec-scheduler.js';
import { loadModelSpecs, experienceResearchRequest } from '../src/model-specs.js';
import { enrichVehicle } from '../src/enrichment.js';
import { ownershipInputs, resolveRunningCosts, calculateOwnership, createOwnershipState, assessOwnership, runningScenario } from '../src/ownership-calculator.js';
import { rankDecisionMode, DEFAULT_SCENARIO } from '../src/decision-engine.js';
import { decisionSummary, entrySummary } from '../src/decision-summary.js';
import { modelAdviceSummary } from '../src/model-advice.js';
import { ratedCar } from './fixtures/scoring-fixtures.mjs';
import { ownershipInput as input, planningData, ownershipCar } from './fixtures/ownership-fixtures.mjs';

const turn = () => new Promise(resolve => setTimeout(resolve, 15));
const providerResponse = payload => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(payload) }] } }] });
test('ownership ranges validate CAD units, ordered finite amounts, scope and scenario independently of specifications', () => {
  const good = planningData();
  assert.equal(validatedResearch(good, input).ownershipEstimates.insuranceAnnual.central, 2600);
  assert.deepEqual(validatedResearch(good, input).fields, {});
  for (const edit of [
    value => { value.insuranceAnnual.central = Infinity; },
    value => { value.insuranceAnnual.high = 100; },
    value => { value.insuranceAnnual.unit = 'USD/year'; },
    value => { value.insuranceAnnual.low = -1; },
    value => { value.insuranceAnnual.rationale = '<b>invented</b>'; },
  ]) {
    const value = structuredClone(good.ownershipEstimates); edit(value);
    const partial = validatedOwnershipEstimates(value, input);
    assert.equal(partial.insuranceAnnual, undefined);
    assert.equal(partial.maintenancePerKm.central, .14);
  }
  for (const edit of [
    value => { value.currency = 'USD'; }, value => { value.scenarioId = 'young-driver'; },
    value => { value.scope.model = 'Different'; }, value => { value.referenceYear--; },
    value => { value.version = 'old'; },
  ]) {
    const value = structuredClone(good.ownershipEstimates); edit(value);
    assert.equal(validatedOwnershipEstimates(value, input), undefined);
  }
  const partial = validatedResearch({ ...good, fields: { horsepower: { kind: 'value', value: 999, evidence: [] } } }, input);
  assert.equal(partial.fields.horsepower, undefined, 'planning data never relaxes sourced-spec checks');
  assert.ok(partial.ownershipEstimates);
  const oldScenario = structuredClone(good); oldScenario.ownershipEstimates.scenarioId = 'previous-scenario';
  const insuranceUpdate = structuredClone(good); delete insuranceUpdate.ownershipEstimates.maintenancePerKm;
  assert.equal(mergeResearch(oldScenario, insuranceUpdate).ownershipEstimates.maintenancePerKm, undefined, 'partial data cannot renew an estimate from a different scenario');

  assert.equal(validatedModelAdvice(good.modelAdvice, input).engineAndReliability, undefined, 'unresolved variant cannot inherit engine claims');
  const advice = validatedModelAdvice({ ...good.modelAdvice, benefits: ['Guaranteed reliability for this car.', 'https://made-up.test/citation'], overview: 'This car is reliable.' }, input);
  assert.equal(advice.overview, undefined); assert.deepEqual(advice.benefits, []);
});

test('configured Gemini ownership request is model-only and validates partial estimates separately from advice', async () => {
  let body, endpoint;
  const payload = { currency: 'CAD', ownershipEstimates: planningData().ownershipEstimates, modelAdvice: planningData().modelAdvice };
  const result = await estimateVehicleOwnership({ ...input, vin: 'SECRET-VIN', description: 'PRIVATE', salary: 90000, insuranceAnnual: 999 }, {
    apiKey: 'fixture', fetcher: async (url, options) => { endpoint = url; body = JSON.parse(options.body); return providerResponse(payload); },
  });
  assert.match(endpoint, /gemini-3.5-flash-lite:generateContent$/);
  assert.equal(result.ownershipEstimates.insuranceAnnual.central, 2600);
  assert.equal(result.modelAdvice.engineAndReliability, undefined);
  assert.doesNotMatch(JSON.stringify(body), /SECRET-VIN|PRIVATE|salary|90000|999/);
  assert.match(body.systemInstruction.parts[0].text, /\$1,000 deductibles/);
  assert.equal(body.tools, undefined);
  const invalidMoney = await estimateVehicleOwnership(input, { apiKey: 'fixture', fetcher: async () => providerResponse({ ...payload, currency: 'USD' }) });
  assert.equal(invalidMoney.ownershipEstimates, undefined); assert.ok(invalidMoney.modelAdvice);
  const insuranceOnly = await estimateVehicleOwnership(input, { apiKey: 'fixture', fetcher: async () => providerResponse({ ...payload, ownershipEstimates: { insuranceAnnual: payload.ownershipEstimates.insuranceAnnual } }) });
  assert.ok(insuranceOnly.ownershipEstimates.insuranceAnnual); assert.equal(insuranceOnly.ownershipEstimates.maintenancePerKm, undefined);
  assert.equal((await estimateVehicleOwnership(input, { apiKey: '', fetcher: () => assert.fail() })).status, 'not-configured');
  const quota = await estimateVehicleOwnership(input, { apiKey: 'fixture', fetcher: async () => Response.json({ error: { details: [{ violations: [{ quotaId: 'RequestsPerDay', quotaValue: '0' }] }] } }, { status: 429 }) });
  assert.equal(quota.status, 'quota'); assert.equal(quota.dailyQuota, true);
  assert.equal((await estimateVehicleOwnership(input, { apiKey: 'fixture', fetcher: async () => new Response('', { status: 401 }) })).status, 'model-unavailable');
});

test('ownership endpoint requires quick phase and keeps private values out of the lookup configuration', async () => {
  const calls = [];
  const handler = createHandler({ modelSpecsLookup: async (config, options) => { calls.push({ config, options }); return planningData(); } });
  const request = (phase, domain = 'ownership') => handler(new Request('https://app.test/api/model-specs', { method: 'POST', headers: { origin: 'https://app.test', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, phase, domain, salary: 12345, vin: 'private' }) }));
  assert.equal((await request('research')).status, 400);
  const response = await request('quick');
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(calls[0].options.domain, 'ownership'); assert.equal(calls[0].config.salary, undefined); assert.equal(calls[0].config.vin, undefined);
});

test('seven-day model-only cache expires planning fields independently without renewing preserved estimates', () => {
  let now = Date.now(), stored;
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value; }, removeItem: () => { stored = undefined; } };
  const cache = createSpecCache({ storage, now: () => now });
  const data = planningData(input, { now });
  data.ownershipEstimates.vin = 'SECRET'; data.modelAdvice.salary = 'PRIVATE'; data.modelAdvice.listingDescription = 'DO NOT SAVE';
  cache.save(input, data);
  assert.doesNotMatch(stored, /SECRET|PRIVATE|DO NOT SAVE|listingDescription/);
  assert.ok(createSpecCache({ storage, now: () => now }).read(input).modelAdvice);
  now += 6 * 86400000;
  const refresh = planningData(input, { insurance: 3000, now }); delete refresh.ownershipEstimates.maintenancePerKm; delete refresh.modelAdvice;
  cache.save(input, refresh);
  assert.equal(cache.read(input).ownershipEstimates.maintenancePerKm.central, .14);
  now += 2 * 86400000;
  assert.equal(cache.read(input).ownershipEstimates.maintenancePerKm, undefined);
  assert.equal(cache.read(input).ownershipEstimates.insuranceAnnual.central, 3000);
  assert.equal(cache.read(input).modelAdvice, undefined);
  assert.equal(cache.read({ ...input, model: 'Other' }), null);
  now += 8 * 86400000; assert.equal(cache.read(input, { allowStale: true }), null);
});

test('shared running resolver applies model central amounts, preserves overrides and scales maintenance with distance', () => {
  const a = ownershipCar('a'), b = ownershipCar('b', { insurance: 4000, maintenance: .25 });
  const defaults = ownershipInputs(a);
  assert.equal(defaults.insuranceAnnual, '2600'); assert.equal(defaults.maintenancePerKm, '0.14');
  assert.equal(ownershipInputs(b).insuranceAnnual, '4000');
  assert.ok(modelAdviceSummary(a).some(r => r.text === planningData().modelAdvice.engineAndReliability), 'known engine context remains qualified and model-level');
  const r = resolveRunningCosts(a, DEFAULT_SCENARIO, { insuranceAnnual: '1900', maintenancePerKm: '0.08', parkingMonthly: '100', otherAnnual: '50', energyOverride: '1000' });
  assert.equal(r.annualRunning, 5350); assert.equal(r.maintenance, 1200);
  assert.ok(Math.abs(resolveRunningCosts(a, { ...DEFAULT_SCENARIO, annualKm: 20000 }).maintenance - 2800) < 1e-8);
  assert.equal(resolveRunningCosts(a, DEFAULT_SCENARIO, { insuranceAnnual: '' }).annualRunning, null);
  assert.equal(resolveRunningCosts(a, runningScenario(DEFAULT_SCENARIO, { energyDrafts: { annualKm: '' } })).annualRunning, null);
  const fallback = ownershipInputs({ ...a, enrichment: {} });
  assert.equal(fallback.insuranceAnnual, '2218'); assert.equal(fallback.maintenancePerKm, '0.10');
  for (const method of ['cash', 'finance']) {
    const settings = { ...createOwnershipState(), method, takeHomePercent: '75', comfortablePercent: '12' };
    const costs = calculateOwnership({ inputs: defaults, settings, annualKm: DEFAULT_SCENARIO.annualKm, annualEnergyCost: 1530 });
    assert.equal(costs.annualRunning, resolveRunningCosts(a, DEFAULT_SCENARIO).annualRunning);
    assert.equal(assessOwnership(costs.monthlyBudget, settings).requiredSalary, costs.monthlyBudget * 12 / .75 / .12);
  }
});

test('running expenses can reverse Affordability while every unrelated mode and Balanced subscore remain unchanged', () => {
  const a = ratedCar('a'), b = ratedCar('b');
  a.enrichment.fuel = { status: 'matched', combined: 6 }; b.enrichment.fuel = { status: 'matched', combined: 10 };
  const cars = [a, b], before = rankDecisionMode(cars, 'cost');
  assert.equal(before.best[0].car.legacyItemId, 'a');
  const ownership = { ...createOwnershipState(), vehicles: { a: { insuranceAnnual: '12000', maintenancePerKm: '0.5' }, b: { insuranceAnnual: '1000', maintenancePerKm: '0.05' } } };
  const after = rankDecisionMode(cars, 'cost', 2026, DEFAULT_SCENARIO, ownership);
  assert.equal(after.best[0].car.legacyItemId, 'b'); assert.equal(after.provisional, true);
  assert.equal(after.criteria.find(c => c.key === 'running').weight, 20);
  for (const mode of ['value', 'comfort', 'performance', 'practical', 'balanced']) {
    assert.deepEqual(rankDecisionMode(cars, mode).ranked.map(r => [r.car.legacyItemId, r.score]), rankDecisionMode(cars, mode, undefined, undefined, ownership).ranked.map(r => [r.car.legacyItemId, r.score]), mode);
  }
  ownership.vehicles.a.insuranceAnnual = '';
  const missing = rankDecisionMode(cars, 'cost', 2026, DEFAULT_SCENARIO, ownership);
  assert.equal(missing.criteria.find(c => c.key === 'running').active, false);
  assert.equal(missing.ranked.find(r => r.car.legacyItemId === 'a').running.annualRunning, null);
  assert.ok(missing.ranked.every(r => r.score === 50));
  ownership.vehicles.a = { insuranceAnnual: '1000', energyOverride: '0', downPayment: '', purchasePrice: '', purchaseFees: '' };
  assert.ok(Number.isFinite(rankDecisionMode(cars, 'cost', 2026, DEFAULT_SCENARIO, ownership).ranked[0].running.annualRunning));
});

test('the model overview is limited to Best Value and warnings share the six-item budget in every priority', () => {
  const car = ownershipCar();
  car.description += ' Engine problems. Coolant leak. Not running. Clean Carfax.';
  for (const mode of ['value', 'cost', 'comfort', 'performance', 'practical']) {
    const summary = decisionSummary([car], mode);
    const notes = entrySummary(summary, summary.ranking.ranked[0]);
    assert.ok(notes.items.length <= 6, mode);
    assert.equal(notes.items.filter(item => item.kind === 'tradeoff').length, 1);
    assert.equal(notes.items.filter(item => item.kind === 'warning').length, 1);
    const warning = notes.items.find(item => item.kind === 'warning');
    for (const label of ['Engine concern', 'Coolant leak', 'Not running']) assert.ok(warning.text.includes(label));
    const overview = notes.items.find(item => item.kind === 'overview');
    if (mode === 'value') {
      assert.equal(notes.items[0], overview);
      assert.equal(overview.text, planningData().modelAdvice.overview);
      assert.equal(overview.label, 'AI model guidance\u2014not independently verified');
      assert.equal(overview.source, undefined);
    } else {
      assert.equal(overview, undefined);
      assert.ok(!notes.items.some(item => item.text === planningData().modelAdvice.overview));
      assert.ok(!notes.items.some(item => item.text === planningData().modelAdvice.engineAndReliability));
    }
  }
  const fullAdvice = modelAdviceSummary(car);
  assert.ok(fullAdvice.some(item => item.topic === 'Engine & reliability context'), 'full model guidance remains available for Sources & checks');
  const unresolved = { ...car, description: 'Engine problems.' };
  assert.ok(modelAdviceSummary(unresolved).some(item => item.topic === 'Engine scope'), 'unresolved variants retain their caveat in full sources');
  assert.deepEqual(modelAdviceSummary(car, [planningData().modelAdvice.overview]).filter(r => r.topic === 'Model overview'), []);
  const sourced = modelAdviceSummary(ratedCar('source'));
  assert.ok(sourced.some(r => r.source));
  assert.ok(sourced.filter(r => r.source).every(r => r.sources.length && !r.label.includes('AI model guidance')));
});

test('automatic ownership research is nonblocking and aborted late results cannot update or cache a removed configuration', async () => {
  const car = ownershipCar(); delete car.enrichment.modelSpecs;
  const cache = createSpecCache({ storage: null }), scheduler = createSpecScheduler({ quickLimit: 3 });
  const controller = new AbortController(), updates = [], requests = [];
  let resolve, started;
  const ready = new Promise(r => { started = r; });
  const task = enrichVehicle(car, { cache, scheduler, signal: controller.signal, onUpdate: state => updates.push(state), fetcher: async (url, options) => {
    if (url.startsWith('/data/')) return Response.json({ columns: [], rows: [] });
    const request = JSON.parse(options.body); requests.push(request);
    if (request.domain !== 'ownership') return Response.json({ modelSpecs: { status: 'not-configured', fields: {} } });
    started(); return new Promise(r => { resolve = r; });
  } });
  await ready; assert.ok(updates.length); assert.ok(requests.some(r => r.domain === 'ownership'));
  controller.abort(); const count = updates.length;
  resolve(Response.json({ modelSpecs: planningData() }));
  await task.catch(() => {}); await turn();
  assert.equal(updates.length, count);
  assert.equal(cache.read(experienceResearchRequest(car)), null);
  const request = experienceResearchRequest(car), preserved = planningData(request);
  const merged = mergeResearch(preserved, { status: 'quota', fields: {}, reason: 'Fixture outage' });
  assert.equal(merged.ownershipEstimates.insuranceAnnual.central, 2600); assert.ok(merged.modelAdvice);
  assert.equal(merged.lastAttempt.status, 'quota');
});

test('clearing planning cache during a request prevents late persistence while useful guidance still resolves', async () => {
  const car = ownershipCar(), cache = createSpecCache({ storage: null });
  let release;
  const task = loadModelSpecs(car, { phase: 'quick', domain: 'ownership', cache, scheduler: createSpecScheduler(), fetcher: async () => new Promise(resolve => { release = resolve; }) });
  await turn(); cache.clear(); release(Response.json({ modelSpecs: planningData() }));
  assert.ok((await task).ownershipEstimates);
  assert.equal(cache.read(experienceResearchRequest(car)), null);
});

test('successful automatic ownership enrichment is cached, reused and retained after a provider failure', async () => {
  const car = ownershipCar(); delete car.enrichment.modelSpecs;
  const cache = createSpecCache({ storage: null }), requests = [];
  const fetcher = async (url, options) => {
    if (url.startsWith('/data/')) return Response.json({ columns: [], rows: [] });
    const body = JSON.parse(options.body); requests.push(body);
    return Response.json({ modelSpecs: body.domain === 'ownership' ? planningData(experienceResearchRequest(car)) : { status: 'not-configured', fields: {} } });
  };
  const first = await enrichVehicle(car, { cache, fetcher, scheduler: createSpecScheduler() });
  assert.equal(first.modelSpecs.ownershipEstimates.insuranceAnnual.central, 2600);
  assert.ok(first.modelSpecs.modelAdvice);
  const before = requests.filter(r => r.domain === 'ownership').length;
  const next = await enrichVehicle({ ...car, enrichment: first }, { cache, fetcher, scheduler: createSpecScheduler() });
  assert.equal(requests.filter(r => r.domain === 'ownership').length, before, 'fresh complete model planning data needs no extra request');
  assert.equal(next.modelSpecs.ownershipEstimates.maintenancePerKm.central, .14);
  const retained = await loadModelSpecs({ ...car, enrichment: next }, { cache, phase: 'quick', domain: 'ownership', scheduler: createSpecScheduler(), fetcher: async () => Response.json({ modelSpecs: { status: 'quota', fields: {}, reason: 'Temporary rate limit' } }) });
  assert.ok(retained.modelAdvice); assert.equal(retained.ownershipEstimates.insuranceAnnual.central, 2600);
  const changed = { ...car, model: 'Other', enrichment: next };
  assert.equal(ownershipInputs(changed).insuranceAnnual, '2218', 'old model estimate cannot follow a configuration correction');
});

test('ownership provider deadlines and caller cancellation use the existing abort behavior', async () => {
  const fetcher = async (_, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  assert.equal((await estimateVehicleOwnership(input, { apiKey: 'fixture', timeoutMs: 10, fetcher })).status, 'timeout');
  const controller = new AbortController();
  const pending = estimateVehicleOwnership(input, { apiKey: 'fixture', signal: controller.signal, fetcher });
  controller.abort(); await assert.rejects(pending, { name: 'AbortError' });
});

test('Affordability explanation follows invalid calculator drafts without displaying an old energy total or NaN', () => {
  const car = ownershipCar(), state = { ...createOwnershipState(), energyDrafts: { annualKm: '', pricePerLitre: '' } };
  const summary = decisionSummary([car], 'cost', 2026, DEFAULT_SCENARIO, state);
  const entry = summary.ranking.ranked[0], notes = entrySummary(summary, entry);
  assert.equal(entry.running.annualRunning, null);
  const fuel = notes.reasons.find(r => r.text.startsWith('Estimated annual'));
  assert.match(fuel.text, /check driving/);
  assert.match(fuel.label, /annual driving incomplete.*fuel price incomplete/);
  assert.doesNotMatch(JSON.stringify(notes), /NaN|Infinity/);
});
