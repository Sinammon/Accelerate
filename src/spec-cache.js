import { CATALOG_VERSION } from '../shared/catalog-version.js';
import { CONFIG_FIELDS, MODEL_FIELDS, cosmeticTrim, modelKey, modelSpecsInput, usableModelFinding, mergeResearch, validatedResearch } from '../shared/model-specs.js';
import { validatedExperience, hasExperience } from '../shared/experience.js';

const STORAGE_KEY = 'dilemma:model-specs:v1';
const DAY = 86400000;
const scopeOnly = value => Object.fromEntries(CONFIG_FIELDS.filter(key => value?.[key] != null).map(key => [key, value[key]]));
export const specCacheKey = input => JSON.stringify([CATALOG_VERSION, ...CONFIG_FIELDS.map(key => key === 'trim' && modelKey(input.make) === 'bmw' && cosmeticTrim(input.trim) ? '' : modelKey(input[key]))]);
const short = (value, length) => typeof value === 'string' ? value.slice(0, length) : undefined;
const mapExperience = (value, fn) => ({ ratings: Object.fromEntries(Object.entries(value?.ratings || {}).map(([key, record]) => [key, fn(record)]).filter(([, record]) => record)),
  ...Object.fromEntries(['energy', 'heating', 'practicality'].flatMap(key => { const record = value?.[key] && fn(value[key]); return record ? [[key, record]] : []; })) });
const savedRating = rating => ({ rating: rating.rating, rationale: short(rating.rationale, 600), scope: scopeOnly(rating.scope), cachedAt: rating.cachedAt, origin: short(rating.origin, 80),
  evidence: cacheableFinding(rating).evidence.map((e, i) => ({ ...e, editorial: rating.evidence[i]?.editorial === true })) });

// Explicit allowlist: never serialize a car, listing identifier, VIN, price,
// mileage, description, seller, import URL, or response attribution HTML.
export function cacheableFinding(finding) {
  if (!finding || typeof finding !== 'object' || Array.isArray(finding)) return { evidence: [] };
  return { kind: finding.kind, value: finding.value, minimum: finding.minimum, maximum: finding.maximum, alternatives: finding.alternatives,
    scope: scopeOnly(finding.scope), sharedAcross: Array.isArray(finding.sharedAcross) ? finding.sharedAcross.filter(key => CONFIG_FIELDS.includes(key)) : undefined, availability: finding.availability,
    quality: finding.quality, origin: short(finding.origin, 80), assumptions: Array.isArray(finding.assumptions) ? finding.assumptions.filter(a => typeof a === 'string').map(a => a.slice(0, 500)).slice(0, 6) : undefined,
    contextReason: short(finding.contextReason, 600), measurementMethod: finding.measurementMethod, retrievedAt: short(finding.retrievedAt, 40),
    evidence: (Array.isArray(finding.evidence) ? finding.evidence : []).filter(e => e && typeof e === 'object').slice(0, 6).map(e => ({ type: e.type, source: short(e.source, 150), url: short(e.url, 2048), quote: short(e.quote, 1200), label: short(e.label, 180), manufacturer: e.manufacturer, configuration: scopeOnly(e.configuration) })),
  };
}

export function createSpecCache({ storage, now = Date.now, maxEntries = 200 } = {}) {
  const entries = new Map();
  let loaded = false;
  let generation = 0;
  const getStorage = () => { try { return storage === undefined ? globalThis.window?.localStorage : storage; } catch { return null; } };
  const load = () => {
    if (loaded) return; loaded = true;
    try {
      const saved = JSON.parse(getStorage()?.getItem(STORAGE_KEY) || '[]');
      for (const entry of Array.isArray(saved) ? saved.slice(-maxEntries) : []) {
        const input = modelSpecsInput({ ...scopeOnly(entry?.input), fields: MODEL_FIELDS });
        if (entry?.catalogVersion === CATALOG_VERSION && input && typeof entry.savedAt === 'number' && entry.savedAt <= now()) entries.set(specCacheKey(input), { catalogVersion: CATALOG_VERSION, input: scopeOnly(input), fields: entry.fields || {}, experience: validatedExperience(entry.experience, input), dimensionRatings: validatedResearch({ dimensionRatings: entry.dimensionRatings }, input).dimensionRatings, savedAt: entry.savedAt });
      }
    } catch {}
  };
  const persist = () => { try { getStorage()?.setItem(STORAGE_KEY, JSON.stringify([...entries.values()])); } catch {} };
  return {
    get generation() { return generation; },
    read(input, { allowStale = false } = {}) {
      load(); const entry = entries.get(specCacheKey(input));
      if (!entry) return null;
      const fields = {};
      for (const [key, raw] of Object.entries(entry.fields || {})) {
        if (!MODEL_FIELDS.includes(key) || !raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
        const finding = cacheableFinding(raw), estimated = finding.quality === 'estimated';
        const savedAt = typeof raw.cachedAt === 'number' ? raw.cachedAt : entry.savedAt;
        const age = now() - savedAt, freshDays = estimated ? 7 : 30, maximumDays = allowStale ? estimated ? 30 : 90 : freshDays;
        if (age < 0 || age > maximumDays * DAY || !usableModelFinding(key, finding, { ...input, fields: MODEL_FIELDS })) continue;
        fields[key] = { ...finding, stale: age > freshDays * DAY, fromCache: true, cachedAt: savedAt };
      }
      const ageRecord = (record, estimated) => {
        const savedAt = record.cachedAt ?? entry.savedAt, age = now() - savedAt, fresh = estimated ? 7 : 30, maximum = allowStale ? estimated ? 30 : 90 : fresh;
        return age >= 0 && age <= maximum * DAY ? { ...record, stale: age > fresh * DAY, fromCache: true, cachedAt: savedAt } : undefined;
      };
      const experience = mapExperience(validatedExperience(entry.experience, input), record => ageRecord(record, true));
      const dimensionRatings = Object.fromEntries(Object.entries(validatedResearch({ dimensionRatings: entry.dimensionRatings }, input).dimensionRatings).map(([key, record]) => [key, ageRecord(record, false)]).filter(([, record]) => record));
      return Object.keys(fields).length || hasExperience(experience) || Object.keys(dimensionRatings).length ? { status: 'partial', fields, experience, dimensionRatings, reason: 'Saved model details are available; older results are labeled when used during an outage.' } : null;
    },
    save(input, research) {
      load(); const key = specCacheKey(input), previous = entries.get(key);
      const combined = mergeResearch(previous || {}, research), merged = combined.fields;
      const fields = {};
      for (const [field, raw] of Object.entries(merged)) {
        if (!MODEL_FIELDS.includes(field) || !usableModelFinding(field, raw, { ...input, fields: MODEL_FIELDS })) continue;
        const previousField = previous?.fields?.[field];
        const reused = raw === previousField || raw.fromCache && raw.cachedAt === previousField?.cachedAt;
        fields[field] = { ...cacheableFinding(raw), cachedAt: reused ? previousField.cachedAt ?? previous.savedAt : now() };
      }
      const stamp = record => ({ ...record, cachedAt: record.cachedAt ?? now(), stale: undefined, fromCache: undefined });
      const experience = mapExperience(validatedExperience(combined.experience, input), stamp);
      const dimensionRatings = Object.fromEntries(Object.entries(validatedResearch({ dimensionRatings: combined.dimensionRatings }, input).dimensionRatings).map(([key, record]) => [key, stamp(savedRating(record))]));
      if (!Object.keys(fields).length && !hasExperience(experience) && !Object.keys(dimensionRatings).length) return;
      entries.delete(key); entries.set(key, { catalogVersion: CATALOG_VERSION, input: scopeOnly(input), fields, experience, dimensionRatings, savedAt: now() });
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value);
      persist();
    },
    clear() { entries.clear(); loaded = true; generation++; try { getStorage()?.removeItem(STORAGE_KEY); } catch {} },
  };
}
export const modelSpecCache = createSpecCache();
