import { compatibleTransmission, normalizeTransmission } from '../shared/transmission.js';

import { CATALOG_VERSION } from '../shared/catalog-version.js';
export { CATALOG_VERSION };
const key = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const positive = value => Number(value) > 0 ? Number(value) : null;
const compact = object => Object.fromEntries(Object.entries(object).filter(([, value]) => value != null && value !== ''));
const drive = value => ({ 'Front-Wheel Drive': 'FWD', 'Rear-Wheel Drive': 'RWD', 'All-Wheel Drive': 'AWD', '4-Wheel Drive': '4WD', 'Part-time 4-Wheel Drive': '4WD' })[value];
const fuel = value => /gasoline/i.test(value) ? 'Gasoline' : /diesel/i.test(value) ? 'Diesel' : /^electricity$/i.test(value) ? 'Electric' : /ethanol/i.test(value) ? 'Ethanol / flex fuel' : null;
const body = value => /sport utility/i.test(value) ? 'SUV' : /pickup/i.test(value) ? 'Pickup' : /wagon/i.test(value) ? 'Wagon' : /van/i.test(value) ? 'Van' : null;
const namedBody = value => ({ sedan: 'Sedan', coupe: 'Coupe', convertible: 'Convertible', roadster: 'Convertible', hatchback: 'Hatchback', wagon: 'Wagon' })[String(value).match(/\b(sedan|coupe|convertible|roadster|hatchback|wagon)\b/i)?.[1]?.toLowerCase()];

export function epaCandidate(row, version) {
  const electric = row.atvType === 'EV';
  const transmission = /\bAV[-S\d)]|variable/i.test(row.trany) ? 'CVT' : /\bAM[-S\d)]/i.test(row.trany) ? 'Dual-clutch / automated manual' : normalizeTransmission(row.trany);
  return { id: `epa:${row.id}`, market: 'US', version, model: row.model, powertrain: row.atvType || 'Conventional',
    values: compact({ year: Number(row.year), make: row.make, model: row.model,
      displacement: electric ? null : positive(row.displ), cylinders: electric ? null : positive(row.cylinders),
      engineType: electric ? 'electric motor' : null, transmission,
      transmissionSpeeds: transmission === 'CVT' ? null : positive(row.trany.match(/(\d+)(?:-spd| speed)/i)?.[1] || row.trany.match(/\((?:AM-)?[AS]?(\d+)\)/i)?.[1]),
      drivetrain: drive(row.drive), fuelType: fuel(row.fuelType1), bodyType: namedBody(row.model) || body(row.VClass) }),
    energy: electric && positive(row.combE) ? { value: Number(row.combE) / 1.609344, unit: 'kWh/100 km', originalValue: Number(row.combE), originalUnit: 'kWh/100 mi' }
      : !electric && ['Gasoline', 'Diesel', 'Ethanol / flex fuel'].includes(fuel(row.fuelType1)) && positive(row.comb08) ? { value: 235.214583 / Number(row.comb08), unit: 'L/100 km', originalValue: Number(row.comb08), originalUnit: 'US mpg', secondaryFuel: row.fuelType2 || null,
        ...(/plug-in/i.test(row.atvType) && positive(row.combE) ? { kwhPer100Km: Number(row.combE) / 1.609344 } : {}) } : null,
    source: { publisher: 'US EPA / DOE', url: `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=${row.id}`, quote: `${row.year} ${row.make} ${row.model}; ${row.displ || 'electric'} L; ${row.cylinders || 'no'} cylinders; ${row.trany}; ${row.drive}; ${row.fuelType1}; ${row.atvType || 'conventional'}` } };
}

export function nrcanCandidate(row, index) {
  const transmission = normalizeTransmission(row.transmission);
  return { id: `nrcan:${row.year}:${index}`, market: 'CA', version: 'nrcan-2026-10-29', model: row.model,
    values: compact({ year: Number(row.year), make: row.make, model: row.model, displacement: positive(row.displacement), cylinders: positive(row.cylinders), transmission, transmissionCode: row.transmission,
      transmissionSpeeds: transmission === 'CVT' ? null : positive(row.transmission.match(/\d+/)?.[0]), fuelType: ({ X: 'Gasoline', Z: 'Gasoline', D: 'Diesel', E: 'Ethanol / flex fuel' })[row.fuel],
      drivetrain: row.model.match(/\b(AWD|4WD|FWD|RWD)\b/i)?.[1]?.toUpperCase(), bodyType: namedBody(row.model) || body(row.vehicleClass) }),
    energy: ['X', 'Z', 'D', 'E'].includes(row.fuel) && positive(row.combined) ? { value: Number(row.combined), unit: 'L/100 km', originalValue: Number(row.combined), originalUnit: 'L/100 km' } : null,
    source: { publisher: 'NRCan', url: 'https://open.canada.ca/data/en/dataset/98f1a129-f628-4ce4-b24d-6f16bf24dd64', quote: `${row.year} ${row.make} ${row.model}; ${row.displacement} L; ${row.cylinders} cylinders; ${row.transmission}; fuel ${row.fuel}` } };
}

// A broad listing model includes named subvariants so missing trim/engine details
// cannot silently select the base engine. A 330i never matches a 330e.
export function catalogModelMatches(listing, candidate) {
  if (key(listing) === key(candidate)) return true;
  const words = value => String(value).toLowerCase().replace(/[-/]/g, ' ').replace(/\s+/g, ' ').trim();
  if (words(candidate).startsWith(`${words(listing)} `)) return true;
  const base = String(candidate).replace(/\b(?:sedan|coupe|convertible|roadster|hatchback|wagon|4-door|5-door|2wd|4wd|awd|fwd|rwd|4matic|hybrid|plug-in hybrid)\b/gi, '').trim();
  const listingBase = String(listing).replace(/\b(?:sedan|coupe|convertible|roadster|hatchback|wagon)\b/gi, '').trim();
  return key(listing) === key(base) || key(listingBase) === key(candidate);
}

export function matchSpecCatalog(specs, candidates, selectedId, referenceMarket) {
  const get = field => specs[field]?.value;
  const empty = reason => ({ status: 'unmatched', values: {}, candidates: [], reason, version: CATALOG_VERSION });
  if (['year', 'make', 'model'].some(field => get(field) == null)) return empty('Add the year, make and model to find reference configurations.');
  if (Object.values(specs).some(spec => spec.status === 'conflict')) return empty('Resolve conflicting details using Edit details before choosing a configuration.');
  const compatible = candidates.filter(candidate => {
    const value = candidate.values;
    const modelName = model => key(get('make')) === 'mazda' ? String(model).replace(/^mazda\s*/i, '') : model;
    if (Number(get('year')) !== value.year || key(get('make')) !== key(value.make) || !catalogModelMatches(modelName(get('model')), modelName(value.model))) return false;
    if (get('market') && get('market') !== candidate.market) return false;
    if (referenceMarket && referenceMarket !== candidate.market) return false;
    if (get('transmissionCode') && value.transmissionCode && get('transmissionCode') !== value.transmissionCode) return false;
    return ['displacement', 'cylinders', 'drivetrain', 'fuelType', 'bodyType', 'transmission', 'transmissionSpeeds'].every(field => {
      if (get(field) == null || value[field] == null) return true;
      if (field === 'transmission') return compatibleTransmission(get(field), value[field], { speeds: get('transmissionSpeeds'), code: get('transmissionCode'), conventional: specs.transmission.evidence?.some(item => /torque[- ]converter|conventional automatic/i.test(item.quote)) }, { speeds: value.transmissionSpeeds, code: value.transmissionCode });
      return typeof value[field] === 'number' ? Math.abs(value[field] - get(field)) < (field === 'displacement' ? 0.06 : 0.001) : key(value[field]) === key(get(field));
    });
  });
  if (!compatible.length) return empty(`No supported ${referenceMarket ? `${referenceMarket} reference ` : 'catalog '}match. Check the reference market and original market, enter missing specifications, or research the model.`);
  const selected = compatible.find(candidate => candidate.id === selectedId);
  if (selectedId && !selected) return { ...empty('The previous configuration no longer matches these details. Choose a compatible reference or clear the selection.'), candidates: compatible };
  const pool = selected ? [selected] : compatible;
  const values = {}, evidence = {};
  for (const field of ['displacement', 'cylinders', 'engineType', 'transmission', 'transmissionSpeeds', 'drivetrain', 'fuelType', 'bodyType']) {
    const value = pool[0].values[field];
    if (value != null && pool.every(candidate => candidate.values[field] === value)) {
      values[field] = value;
      evidence[field] = pool.map(candidate => ({ ...candidate.source, type: 'catalog-reference', value, configuration: candidate.values }));
    }
  }
  // Different test cycles, hybrid systems, engines and source markets require a choice.
  const signatures = new Set(pool.map(candidate => JSON.stringify([candidate.market, candidate.values, candidate.powertrain, candidate.energy])));
  const resolved = !!selected || signatures.size === 1;
  return { status: resolved ? 'matched' : 'ambiguous', values, evidence, candidates: compatible, selectedId: selected?.id || (resolved ? pool[0].id : null),
    energy: resolved ? pool[0].energy : null, source: resolved ? pool[0].source : null, version: `${CATALOG_VERSION}:${[...new Set(pool.map(candidate => candidate.version))].sort().join(':')}`,
    reason: resolved ? `${selected ? 'You confirmed' : 'Evidence supports'} this reference configuration. Original market and installed equipment still require verification.` : `${compatible.length} reference configurations remain. Confirm one to research configuration-specific gaps; shared details are already available.` };
}

export async function loadEpaYear(year, { fetcher = fetch, signal } = {}) {
  if (!Number.isInteger(Number(year)) || year < 1995 || year > new Date().getFullYear() + 1) return [];
  const response = await fetcher(`/data/catalog/${Number(year)}.json`, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000) });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Catalog unavailable');
  const data = await response.json();
  if (!Array.isArray(data.columns) || !Array.isArray(data.rows) || typeof data.version !== 'string') throw new Error('Catalog invalid');
  return data.rows.map(row => epaCandidate(Object.fromEntries(data.columns.map((field, index) => [field, row[index]])), data.version));
}
