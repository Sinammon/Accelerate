// Model-only planning data. This module never receives a listing or a driver profile.
export const OWNERSHIP_VERSION = 'ontario-ownership-v1';
export const OWNERSHIP_SCENARIO_ID = 'experienced-personal-full-1000-v1';
export const OWNERSHIP_ASSUMPTIONS = 'Ontario illustrative scenario: experienced fully licensed driver, clean record, personal use, collision/comprehensive coverage and $1,000 deductibles. Not a personal quote.';
export const OWNERSHIP_SCOPE_KEYS = ['year', 'make', 'model', 'trim', 'market', 'displacement', 'cylinders', 'engineType', 'induction', 'transmission', 'transmissionSpeeds', 'drivetrain', 'fuelType', 'bodyType', 'seats'];
const DAY = 86400000;
const key = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const ownershipYear = (now = Date.now()) => Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Toronto', year: 'numeric' }).format(new Date(now)));
export const ownershipScope = input => Object.fromEntries(OWNERSHIP_SCOPE_KEYS.filter(k => input?.[k] != null).map(k => [k, input[k]]));
function validScope(scope, input) {
  return scope && ['year', 'make', 'model'].every(k => input?.[k] != null && key(scope[k]) === key(input[k]))
    && Object.entries(scope).every(([k, value]) => OWNERSHIP_SCOPE_KEYS.includes(k) && input[k] != null && key(value) === key(input[k]));
}
function meta(record, input, now) {
  return record?.version === OWNERSHIP_VERSION && record.scenarioId === OWNERSHIP_SCENARIO_ID && record.region === 'ON' && record.currency === 'CAD' && record.referenceYear === ownershipYear(now) && validScope(record.scope, input);
}
export function freshOwnershipRecord(record, now = Date.now()) {
  const checked = Date.parse(record?.checked);
  const start = Math.min(checked, Number.isFinite(record?.cachedAt) ? record.cachedAt : checked);
  return Number.isFinite(start) && checked <= now + 300000 && now - start <= 7 * DAY && now >= start;
}
const text = (value, max = 600) => typeof value === 'string' && value.trim().length >= 10 && value.length <= max
  && !/<[^>]*>|https?:\/\/|\b(?:guaranteed|bulletproof|never fails|failure rate|this (?:car|vehicle) is reliable|accident.free)\b|\d\s*%/i.test(value) ? value.trim() : undefined;
const assumptions = value => (Array.isArray(value) ? value : []).filter(a => typeof a === 'string' && a.length <= 300 && !/<[^>]*>|https?:\/\//i.test(a)).slice(0, 6);
function range(value, max, now, unit) {
  if (!value || value.unit !== unit || ![value.low, value.central, value.high].every(n => typeof n === 'number' && Number.isFinite(n))
      || value.low <= 0 || value.low > value.central || value.central > value.high || value.high > max
      || !text(value.rationale) || !freshOwnershipRecord(value, now)) return undefined;
  return { unit, low: value.low, central: value.central, high: value.high, rationale: text(value.rationale), assumptions: assumptions(value.assumptions), checked: value.checked,
    ...(Number.isFinite(value.cachedAt) ? { cachedAt: value.cachedAt } : {}) };
}
function metadata(value) {
  return { version: value.version, scenarioId: value.scenarioId, region: value.region, currency: value.currency, referenceYear: value.referenceYear, scope: ownershipScope(value.scope) };
}
export function validatedOwnershipEstimates(value, input, now = Date.now()) {
  if (!meta(value, input, now)) return undefined;
  const insuranceAnnual = range(value.insuranceAnnual, 100000, now, 'CAD/year'), maintenancePerKm = range(value.maintenancePerKm, 10, now, 'CAD/km');
  return insuranceAnnual || maintenancePerKm ? { ...metadata(value), ...(insuranceAnnual ? { insuranceAnnual } : {}), ...(maintenancePerKm ? { maintenancePerKm } : {}) } : undefined;
}
export function validatedModelAdvice(value, input, now = Date.now()) {
  if (!meta(value, input, now) || !freshOwnershipRecord(value, now)) return undefined;
  const overview = text(value.overview, 500);
  const benefits = (Array.isArray(value.benefits) ? value.benefits : []).map(v => text(v, 300)).filter(Boolean).slice(0, 3);
  const problemsToCheck = (Array.isArray(value.problemsToCheck) ? value.problemsToCheck : []).map(v => text(v, 300)).filter(Boolean).slice(0, 3);
  const engineKnown = input.fuelType === 'Electric' || input.displacement != null && input.cylinders != null;
  const engineAndReliability = engineKnown ? text(value.engineAndReliability, 600) : undefined;
  return overview || benefits.length || problemsToCheck.length || engineAndReliability ? { ...metadata(value), checked: value.checked, ...(Number.isFinite(value.cachedAt) ? { cachedAt: value.cachedAt } : {}),
    ...(overview ? { overview } : {}), benefits, problemsToCheck, ...(engineAndReliability ? { engineAndReliability } : {}) } : undefined;
}
export function mergeOwnershipEstimates(previous, incoming) {
  if (!incoming) return previous;
  if (!previous || JSON.stringify(metadata(previous)) !== JSON.stringify(metadata(incoming))) return incoming;
  const result = { ...previous, ...incoming };
  for (const name of ['insuranceAnnual', 'maintenancePerKm']) {
    const before = previous[name], next = incoming[name];
    result[name] = !next || before && Date.parse(before.checked) > Date.parse(next.checked) ? before : next;
  }
  return result;
}
