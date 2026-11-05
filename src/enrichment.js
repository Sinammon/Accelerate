import { validateVin } from '../shared/vin.js';
import { extractVehicleSpecs, vinMismatches } from './vehicle-specs.js';
import { loadFuelYear, matchFuelEconomy, NRCAN_SOURCE } from './fuel-data.js';
import { matchFactorySpecs } from './factory-specs.js';
import { loadModelSpecs, modelResearchRequest, experienceResearchRequest } from './model-specs.js';
import { bundledModelSpecs } from './bundled-model-specs.js';
import { modelSpecCache } from './spec-cache.js';
import { CORE_SPEC_FIELDS, mergeResearch } from '../shared/model-specs.js';
import { loadEpaYear, nrcanCandidate, matchSpecCatalog } from './spec-catalog.js';
import { referenceMarket } from './reference-market.js';

export async function enrichVehicle(car, { fetcher = fetch, signal, researchSignal, factoryMatcher = matchFactorySpecs, onUpdate, cache = modelSpecCache, force = false, scheduler, skipVin = false } = {}) {
  const cacheGeneration = cache.generation;
  const phaseCache = { get generation() { return cache.generation; }, read: (...args) => cache.read(...args), save: (...args) => { if (cache.generation === cacheGeneration) cache.save(...args); } };
  const specsSignal = researchSignal && signal ? AbortSignal.any([signal, researchSignal]) : researchSignal || signal;
  const state = { status: 'loading-model', vin: car.enrichment?.vin || validateVin(car.vin), specsStatus: 'loading-quick', catalog: car.demo ? undefined : car.enrichment?.catalog || { status: 'loading', values: {}, candidates: [], reason: 'Finding compatible government reference configurations.' } };
  const candidate = () => ({ ...car, enrichment: { ...state } });
  const catalogSpecs = () => extractVehicleSpecs({ ...car, enrichment: { ...state, modelSpecs: undefined, catalog: undefined } }).specs;
  const factory = () => { try { return factoryMatcher({ ...car, enrichment: { ...state, modelSpecs: undefined } }); } catch { return { status: 'unavailable', reason: 'Factory references are unavailable.' }; } };
  state.factorySpecs = factory();
  let input = modelResearchRequest(candidate()) || experienceResearchRequest(candidate());
  let saved = input && !car.demo ? cache.read(input) : null;
  state.modelSpecs = mergeResearch(mergeResearch(car.enrichment?.modelSpecs || {}, bundledModelSpecs(candidate())), saved || {});
  if (input && !car.demo) cache.save(input, state.modelSpecs);
  const emit = domain => { if (!signal?.aborted && (domain !== 'specs' || !specsSignal?.aborted)) onUpdate?.({ ...state }, { domain }); };
  emit('initial');

  // Model-level experience does not depend on VIN, catalog selection or core
  // specification success. Local estimates are already rendered synchronously.
  const experienceTask = (async () => {
    const experienceInput = experienceResearchRequest(candidate());
    if (!experienceInput) return;
    const prior = cache.read(experienceInput);
    state.modelSpecs = mergeResearch(state.modelSpecs, prior || {});
    const seats = extractVehicleSpecs(candidate()).specs.seats.value;
    const expectedRatings = seats === 1 || seats === 2 ? 5 : 7;
    if (!force && prior?.experience?.energy && prior.experience.heating && Object.keys(prior.experience.ratings || {}).length >= expectedRatings) { emit('specs'); return; }
    const result = await loadModelSpecs(candidate(), { fetcher, signal: specsSignal, phase: 'quick', domain: 'experience', cache: phaseCache, scheduler });
    state.modelSpecs = mergeResearch(state.modelSpecs, result);
    emit('specs');
  })().catch(() => {});

  const initialYear = extractVehicleSpecs(candidate()).specs.year.value;
  const initialFuelRows = loadFuelYear(initialYear, { fetcher, signal }).catch(() => null);

  const catalogTask = (async () => {
    if (car.demo) return;
    const year = extractVehicleSpecs(candidate()).specs.year.value;
    const results = await Promise.allSettled([loadEpaYear(year, { fetcher, signal }), initialFuelRows]);
    signal?.throwIfAborted();
    const epa = results[0].status === 'fulfilled' ? results[0].value : [];
    const nrcan = results[1].status === 'fulfilled' && results[1].value ? results[1].value.map(nrcanCandidate) : [];
    const all = [...epa, ...nrcan];
    const sourceSpecs = catalogSpecs();
    state.catalog = matchSpecCatalog(sourceSpecs, all, car.catalogSelection, referenceMarket(car, sourceSpecs));
    state.catalog.lookupAvailable = !!all.length;
    if (!all.length) state.catalog.reason = 'Reference data could not be loaded for this year. Edit details or research the model; existing values remain available.';
    state.catalogRows = all;
    state.factorySpecs = factory();
    emit('catalog');
  })();

  // VIN/static references run independently; they never hold up listing-based specs.
  const vinTask = (async () => {
    if (skipVin) { state.fuel = car.enrichment?.fuel; return; }
    let vin = state.vin;
    if (vin.status === 'decoded') vin = { ...vin, mismatches: vinMismatches(car, vin) };
    const fuelRows = initialFuelRows;
    if (vin.status === 'valid') {
      try {
        const response = await fetcher('/api/vehicle-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vin: vin.vin }), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(9000)]) : AbortSignal.timeout(9000), cache: 'no-store' });
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Unavailable');
        const data = await response.json();
        vin = data?.vin && ['decoded', 'unsupported', 'unavailable', 'invalid', 'missing'].includes(data.vin.status) ? data.vin : { status: 'unavailable', reason: 'Invalid VIN response.' };
        if (vin.status === 'decoded') vin = { ...vin, mismatches: vinMismatches(car, vin) };
      } catch { vin = { status: 'unavailable', reason: 'VIN lookup unavailable. Listing details remain preferred.' }; }
    }
    let rows = await fuelRows;
    await catalogTask;
    signal?.throwIfAborted();
    state.vin = vin; state.factorySpecs = factory();
    const decodedYear = extractVehicleSpecs(candidate()).specs.year.value;
    if (decodedYear && decodedYear !== initialYear) {
      const results = await Promise.allSettled([loadEpaYear(decodedYear, { fetcher, signal }), loadFuelYear(decodedYear, { fetcher, signal })]);
      rows = results[1].status === 'fulfilled' ? results[1].value : null;
      state.catalogRows = [...(results[0].status === 'fulfilled' ? results[0].value : []), ...(rows || []).map(nrcanCandidate)];
    }
    if (state.catalogRows?.length) state.catalog = { ...matchSpecCatalog(catalogSpecs(), state.catalogRows, car.catalogSelection, referenceMarket(car, catalogSpecs())), lookupAvailable: true };
    state.fuel = rows ? matchFuelEconomy(candidate(), rows) : { status: 'unavailable', reason: 'Canadian fuel reference data is unavailable.', source: NRCAN_SOURCE };
    emit('vin');
  })();

  const specsTask = (async () => {
    if (car.demo) { state.modelSpecs = { status: 'skipped', fields: {}, reason: 'Fictional demo uses bundled references; no AI request is made.' }; state.specsStatus = 'ready'; emit('specs'); return; }
    await catalogTask;
    input = modelResearchRequest(candidate());
    saved = input ? cache.read(input) : null;
    state.modelSpecs = mergeResearch(state.modelSpecs, saved || {});
    if (!input) {
      await vinTask;
      input = modelResearchRequest(candidate());
      saved = input ? cache.read(input) : null;
      state.modelSpecs = mergeResearch(state.modelSpecs, saved || {});
    }
    const missing = CORE_SPEC_FIELDS.filter(key => extractVehicleSpecs(candidate()).specs[key].status === 'unknown');
    if (!input) { state.modelSpecs = mergeResearch(state.modelSpecs, { status: 'insufficient', fields: {}, reason: candidate().enrichment.catalog?.reason || 'Add vehicle details to continue research.' }); state.specsStatus = 'needs-details'; emit('specs'); return; }
    specsSignal?.throwIfAborted();
    if (missing.length) {
      const quick = await loadModelSpecs(candidate(), { fetcher, signal: specsSignal, phase: 'quick', requestedFields: missing, cache: phaseCache, scheduler });
      state.modelSpecs = mergeResearch(state.modelSpecs, quick);
      state.specsStatus = 'verifying'; emit('specs');
      const stopped = quick.lastAttempt || quick;
      if (['not-configured', 'model-unavailable', 'invalid-request', 'quota'].includes(stopped.status)) { state.specsStatus = 'failed'; emit('specs'); return; }
    }
    specsSignal?.throwIfAborted();
    state.specsStatus = 'verifying'; emit('specs');
    const gaps = CORE_SPEC_FIELDS.filter(key => extractVehicleSpecs(candidate()).specs[key].status === 'unknown');
    if (gaps.length) {
      const researched = await loadModelSpecs(candidate(), { fetcher, signal: specsSignal, phase: 'research', domain: 'specs', requestedFields: gaps, cache: phaseCache, scheduler });
      state.modelSpecs = mergeResearch(state.modelSpecs, researched);
      emit('specs');
      const stopped = researched.lastAttempt || researched;
      if (['not-configured', 'model-unavailable', 'invalid-request', 'quota'].includes(stopped.status)) { state.specsStatus = 'failed'; emit('specs'); return; }
    }
    const insights = await loadModelSpecs(candidate(), { fetcher, signal: specsSignal, phase: 'research', domain: 'insights', cache: phaseCache, scheduler });
    state.modelSpecs = mergeResearch(state.modelSpecs, insights);
    state.specsStatus = ['matched', 'partial', 'complete'].includes(state.modelSpecs.status) ? 'ready' : 'failed';
    emit('specs');
  })().catch(error => {
    if (specsSignal?.aborted || signal?.aborted) return;
    state.modelSpecs = mergeResearch(state.modelSpecs, { status: 'unavailable', fields: {}, reason: 'Specification lookup could not finish. Existing values remain available.' });
    state.specsStatus = 'failed'; emit('specs');
  });
  await Promise.all([vinTask, specsTask, catalogTask, experienceTask]);
  signal?.throwIfAborted();
  state.status = 'complete';
  return { ...state };
}
