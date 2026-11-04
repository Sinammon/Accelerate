import { CONFIG_FIELDS, approximateScopeMatches } from './model-specs.js';

export const EXPERIENCE_DIMENSIONS = ['rideQuality', 'cabinQuietness', 'frontSeatComfort', 'rearSeatComfort', 'frontPassengerSpace', 'rearPassengerSpace', 'cargoSpace'];
export const DEFAULT_SCENARIO = { annualKm: 15000, pricePerLitre: 1.70, pricePerKwh: 0.15, electricShare: 50, minSeats: 5, bodyType: '' };
export const SCENARIO_BOUNDS = { annualKm: [1, 200000], pricePerLitre: [0.01, 10], pricePerKwh: [0.01, 5], electricShare: [0, 100] };
export const validScenarioValue = (key, value) => Number.isFinite(value) && value >= SCENARIO_BOUNDS[key][0] && value <= SCENARIO_BOUNDS[key][1];

// Estimates have an explicit, small allowlist. Never promote a model guess into
// installed equipment or attach invented citations to it.
export function validatedExperience(raw, input) {
  const clean = record => {
    if (!['year', 'make', 'model'].every(key => input?.[key] != null) || !record || record.quality !== 'estimated' || record.origin !== 'model-estimate' || !approximateScopeMatches(record.scope, input)) return null;
    const assumptions = Array.isArray(record.assumptions) ? record.assumptions.filter(a => typeof a === 'string' && a.trim() && a.length <= 500).slice(0, 6) : [];
    if (!assumptions.length || record.evidence?.length) return null;
    const rationale = typeof record.rationale === 'string' ? record.rationale.trim().slice(0, 600) : '';
    if (rationale.length < 15) return null;
    return { quality: 'estimated', origin: 'model-estimate', scope: Object.fromEntries(CONFIG_FIELDS.filter(k => record.scope[k] != null).map(k => [k, record.scope[k]])), assumptions, evidence: [], rationale,
      ...(typeof record.retrievedAt === 'string' ? { retrievedAt: record.retrievedAt.slice(0, 40) } : {}),
      ...(Number.isFinite(record.cachedAt) ? { cachedAt: record.cachedAt } : {}), ...(record.stale ? { stale: true } : {}), ...(record.fromCache ? { fromCache: true } : {}) };
  };
  const result = { ratings: {} };
  for (const key of EXPERIENCE_DIMENSIONS) {
    const record = raw?.ratings?.[key], base = clean(record);
    if (base && Number.isFinite(record.rating) && record.rating >= 0 && record.rating <= 5) result.ratings[key] = { ...base, rating: record.rating };
  }
  const energy = raw?.energy, energyBase = clean(energy);
  const positive = (n, max) => Number.isFinite(n) && n > 0 && n <= max;
  if (energyBase && ['liquid', 'electric', 'phev'].includes(energy.powertrain)
    && (energy.powertrain === 'electric' || positive(energy.litresPer100Km, 60))
    && (energy.powertrain === 'liquid' || positive(energy.kwhPer100Km, 100))
    && !(input.fuelType === 'Electric' && energy.powertrain !== 'electric')
    && !(input.fuelType && input.fuelType !== 'Electric' && energy.powertrain === 'electric')) {
    result.energy = { ...energyBase, powertrain: energy.powertrain,
      ...(energy.powertrain !== 'electric' ? { litresPer100Km: energy.litresPer100Km } : {}),
      ...(energy.powertrain !== 'liquid' ? { kwhPer100Km: energy.kwhPer100Km } : {}) };
  }
  const heating = raw?.heating, heatingBase = clean(heating);
  if (heatingBase && ['likely', 'unlikely', 'trim-dependent'].includes(heating.availability)) result.heating = { ...heatingBase, availability: heating.availability };
  const practicality = clean(raw?.practicality);
  if (practicality) result.practicality = practicality;
  return result;
}

const choose = (old, next) => !next || old && !old.stale && next.stale ? old : next;
export function mergeExperience(previous = {}, incoming = {}) {
  const ratings = { ...previous.ratings };
  for (const [key, value] of Object.entries(incoming.ratings || {})) ratings[key] = choose(ratings[key], value);
  return { ratings, ...Object.fromEntries(['energy', 'heating', 'practicality'].flatMap(key => {
    const value = choose(previous[key], incoming[key]); return value ? [[key, value]] : [];
  })) };
}
export const hasExperience = value => !!(value?.energy || value?.heating || value?.practicality || Object.keys(value?.ratings || {}).length);
