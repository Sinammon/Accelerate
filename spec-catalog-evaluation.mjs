import { readFile } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';
import { pathToFileURL } from 'node:url';
import { epaCandidate, matchSpecCatalog } from './src/spec-catalog.js';
import { extractVehicleSpecs } from './src/vehicle-specs.js';
import { modelResearchRequest } from './src/model-specs.js';
import { estimateModelSpecs } from './backend/model-specs.mjs';
import { ESSENTIAL_SPEC_FIELDS } from './src/spec-applicability.js';

export async function evaluateCatalog({ live = false, onProgress = () => {} } = {}) {
  const fixture = JSON.parse(await readFile(new URL('./test-data/spec-catalog-benchmark.json', import.meta.url)));
  const totals = { configurations: fixture.cases.length, applicableEssentials: 0, sourced: 0, estimates: 0, manual: 0, missing: 0, recoverable: 0, auditedNumericFields: 0, numericMismatches: [], providerStatuses: {}, aiAttempts: 0 };
  let stopped;
  for (const entry of fixture.cases) {
    const data = JSON.parse(await readFile(new URL(`./public/data/catalog/${entry.year}.json`, import.meta.url)));
    const rows = data.rows.map(row => epaCandidate(Object.fromEntries(data.columns.map((field, index) => [field, row[index]])), data.version));
    const car = { year: entry.year, make: entry.make, model: entry.model, market: 'US', catalogSelection: entry.id };
    const catalog = matchSpecCatalog(extractVehicleSpecs(car).specs, rows, entry.id);
    car.enrichment = { catalog };
    if (catalog.status !== 'matched') throw new Error(`Benchmark configuration failed: ${entry.id}`);
    if (live && !stopped) {
      const input = modelResearchRequest(car);
      const result = await estimateModelSpecs(input);
      totals.aiAttempts++;
      totals.providerStatuses[result.status] = (totals.providerStatuses[result.status] || 0) + 1;
      car.enrichment.modelSpecs = result;
      onProgress(`${entry.id}: ${result.status}`);
      if (['quota', 'not-configured', 'model-unavailable', 'invalid-request'].includes(result.status)) stopped = result.reason;
    }
    const { specs } = extractVehicleSpecs(car);
    for (const field of ESSENTIAL_SPEC_FIELDS) {
      if (specs[field].status === 'not-applicable') continue;
      totals.applicableEssentials++;
      if (specs[field].value == null) totals.missing++;
      else if (specs[field].status === 'model-estimate') totals.estimates++;
      else if (specs[field].status === 'user-entered') totals.manual++;
      else totals.sourced++;
    }
    totals.applicableEssentials++;
    if (catalog.energy) totals.sourced++; else totals.missing++;
    if (ESSENTIAL_SPEC_FIELDS.some(field => specs[field].status === 'unknown')) totals.recoverable++;
    // Independent raw-record checks; estimates of power/weight are not counted
    // as correct merely because they are populated.
    for (const [field, raw] of [['displacement', entry.reference.displ], ['cylinders', entry.reference.cylinders]]) {
      if (!Number(raw)) continue;
      totals.auditedNumericFields++;
      if (specs[field].value !== Number(raw)) totals.numericMismatches.push({ id: entry.id, field, expected: Number(raw), actual: specs[field].value });
    }
  }
  return { ...totals, coverage: (totals.sourced + totals.estimates + totals.manual) / totals.applicableEssentials, target: 0.9,
    targetMet: (totals.sourced + totals.estimates + totals.manual) / totals.applicableEssentials >= 0.9,
    aiConfigured: live, stopped: stopped || null,
    limitations: 'Confirmed US reference configurations without VINs. Numeric audit covers EPA displacement/cylinders, not AI power, torque, seats or weight. Manual entries are not pre-populated. This measures availability separately from correctness; unverified estimates are provisional.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { loadEnvFile(new URL('.env', import.meta.url)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  console.log(JSON.stringify(await evaluateCatalog({ live: process.argv.includes('--live'), onProgress: console.log }), null, 2));
}
