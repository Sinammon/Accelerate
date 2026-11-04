import baselines from './experience-baselines.json' with { type: 'json' };
import { extractVehicleSpecs } from './vehicle-specs.js';
import { dimensionRatingsForCar, researchGuidance } from './model-research.js';
import { CONFIG_FIELDS } from '../shared/model-specs.js';
import { DEFAULT_SCENARIO, EXPERIENCE_DIMENSIONS, validatedExperience, validScenarioValue } from '../shared/experience.js';

export { DEFAULT_SCENARIO };
export const experienceLabel = record => `${record?.origin === 'baseline' ? 'General baseline' : record?.origin === 'catalog' && record?.quality === 'estimated' ? 'Catalog estimate' : record?.quality === 'estimated' ? 'Model estimate' : record?.origin === 'seller' ? 'Seller-reported' : record?.origin === 'model-reference' ? 'Typical model equipment' : record?.origin === 'catalog' ? 'Government reference' : 'Professional review'}${record?.stale ? ' · older saved detail' : ''}`;
export const experienceConfiguration = car => {
  const { specs } = extractVehicleSpecs({ ...car, enrichment: { ...car.enrichment, modelSpecs: undefined } });
  return Object.fromEntries(CONFIG_FIELDS.filter(key => specs[key]?.value != null).map(key => [key, specs[key].value]));
};
const median = values => {
  const sorted = values.toSorted((a, b) => a - b), i = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[i] : (sorted[i - 1] + sorted[i]) / 2;
};
const baseline = rationale => ({ quality: 'estimated', origin: 'baseline', rationale, assumptions: ['Broad starting estimate; model, trim and used-car condition may differ.'], evidence: [] });

export function annualEnergyCost(energy, scenario = DEFAULT_SCENARIO) {
  const s = { ...DEFAULT_SCENARIO, ...scenario };
  if (!Object.keys(s).filter(key => ['annualKm', 'pricePerLitre', 'pricePerKwh', 'electricShare'].includes(key)).every(key => validScenarioValue(key, s[key]))) return null;
  if (energy?.alternatives) {
    const costs = energy.alternatives.map(item => annualEnergyCost(item, s)).filter(Number.isFinite);
    return costs.length ? median(costs) : null;
  }
  if (!energy) return null;
  const share = energy.powertrain === 'electric' ? 1 : energy.powertrain === 'phev' ? s.electricShare / 100 : 0;
  const litres = share < 1 ? energy.litresPer100Km : 0, kwh = share > 0 ? energy.kwhPer100Km : 0;
  if (![litres, kwh].every(n => Number.isFinite(n) && n >= 0) || share < 1 && litres <= 0 || share > 0 && kwh <= 0) return null;
  const cost = s.annualKm / 100 * (litres * (1 - share) * s.pricePerLitre + kwh * share * s.pricePerKwh);
  return Number.isFinite(cost) ? cost : null;
}

function catalogEnergy(candidate) {
  const energy = candidate.energy;
  if (!energy || !Number.isFinite(energy.value) || energy.value <= 0) return null;
  if (energy.unit === 'kWh/100 km') return { powertrain: 'electric', kwhPer100Km: energy.value };
  if (energy.unit !== 'L/100 km') return null;
  if (/plug-in|electricity/i.test(`${candidate.powertrain || ''} ${energy.secondaryFuel || ''}`)) {
    return energy.kwhPer100Km > 0 ? { powertrain: 'phev', litresPer100Km: energy.value, kwhPer100Km: energy.kwhPer100Km } : null;
  }
  return { powertrain: 'liquid', litresPer100Km: energy.value };
}

function resolveEnergy(car, specs, estimate) {
  const fuel = car.enrichment?.fuel;
  const catalog = car.enrichment?.catalog;
  let pool = catalog?.selectedId ? (catalog.candidates || []).filter(c => c.id === catalog.selectedId) : catalog?.candidates || [];
  if (!pool.length && catalog?.energy) pool = [{ energy: catalog.energy, source: catalog.source }];
  const catalogTypes = [...new Set(pool.map(candidate => catalogEnergy(candidate)?.powertrain).filter(Boolean))];
  const hint = [specs.model.value, specs.trim.value, specs.engineType.value].filter(Boolean).join(' ');
  const type = specs.fuelType.value === 'Electric' || specs.engineType.value === 'electric motor' ? 'electric' : /plug[- ]?in|\bphev\b/i.test(hint) ? 'phev' : catalogTypes.length === 1 && catalogTypes[0] !== 'liquid' ? catalogTypes[0] : /hybrid/i.test(hint) ? 'hybrid' : 'liquid';
  if (!['electric', 'phev'].includes(type) && !catalogTypes.includes('phev') && fuel?.status === 'matched' && Number.isFinite(fuel.combined) && fuel.combined > 0) return { powertrain: 'liquid', litresPer100Km: fuel.combined, quality: 'reference', origin: 'catalog', rationale: 'Exact NRCan configuration consumption, applied to your driving and price assumptions.', assumptions: [], evidence: [{ source: 'NRCan', url: fuel.source }] };
  // Prefer Canadian test-cycle references when liquid-fuel candidates exist.
  if (!catalogTypes.includes('phev') && pool.some(c => c.market === 'CA' && catalogEnergy(c))) pool = pool.filter(c => c.market === 'CA');
  const options = pool.map(candidate => ({ value: catalogEnergy(candidate), source: candidate.source })).filter(item => item.value && (type !== 'electric' || item.value.powertrain === 'electric') && (type !== 'phev' || item.value.powertrain === 'phev'));
  if (options.length) return { ...(options.length === 1 ? options[0].value : { powertrain: new Set(options.map(o => o.value.powertrain)).size === 1 ? options[0].value.powertrain : 'mixed', alternatives: options.map(o => o.value) }), quality: options.length === 1 ? 'reference' : 'estimated', origin: 'catalog',
    rationale: options.length === 1 ? 'Government consumption reference applied to your scenario.' : `Median running cost across ${options.length} compatible configurations; no engine has been selected.`,
    assumptions: ['Reference test-cycle consumption; actual use varies with driving, weather and condition.'], evidence: options.map(item => item.source).filter(Boolean) };
  if (estimate && (type !== 'electric' || estimate.powertrain === 'electric') && (type !== 'phev' || estimate.powertrain === 'phev')) return estimate;
  const shape = ({ SUV: 'suv', Pickup: 'pickup', Van: 'van' })[specs.bodyType.value] || (specs.bodyType.value ? 'car' : 'all');
  const band = specs.year.value ? String(Math.floor(specs.year.value / 10) * 10) : 'all';
  const fuelType = type === 'electric' ? 'electricity' : ({ Diesel: 'diesel', 'Ethanol / flex fuel': 'ethanol' })[specs.fuelType.value] || 'gasoline';
  const lookup = (powertrain, fuelName) => [band, 'all'].flatMap(year => [shape, 'all'].map(body => {
    const group = baselines[[powertrain, fuelName, body, year].join('|')]; return group ? { ...group, band: year, shape: body } : null;
  })).find(Boolean);
  const row = lookup(type, fuelType) || lookup(type, 'gasoline') || lookup('liquid', 'gasoline');
  return { ...baseline(`Offline ${type === 'electric' ? 'electricity' : type === 'phev' ? 'fuel and electricity' : 'fuel'} median from bundled government data (${row.count} configurations).`),
    powertrain: type === 'hybrid' ? 'liquid' : type,
    ...(type !== 'electric' ? { litresPer100Km: row.litres || baselines['liquid|gasoline|all|all'].litres } : {}),
    ...(['electric', 'phev'].includes(type) ? { kwhPer100Km: row.electricity || baselines['electric|electricity|all|all'].electricity } : {}),
    assumptions: [`${row.shape === 'all' ? 'Broad vehicle classes' : specs.bodyType.value || row.shape}; ${row.band === 'all' ? 'all model years' : `${row.band}s model-year band`}.`, ...(!specs.fuelType.value && !estimate && !['electric', 'phev'].includes(type) ? ['Powertrain not confirmed; gasoline assumed unless electric or plug-in details are supplied.'] : [])] };
}

export function resolveVehicleExperience(car, scenario = DEFAULT_SCENARIO) {
  const { specs, features } = extractVehicleSpecs(car);
  const input = experienceConfiguration(car);
  const saved = validatedExperience(car.enrichment?.modelSpecs?.experience, input);
  const sourced = dimensionRatingsForCar(car);
  const ratings = {};
  for (const key of EXPERIENCE_DIMENSIONS) ratings[key] = sourced[key] || saved.ratings[key] || { ...baseline(key.includes('PassengerSpace') ? 'Average passenger room assumed; headroom and legroom depend on body and seating position.' : key === 'cargoSpace' ? 'Average cargo usefulness assumed; check luggage fit and the loading opening.' : key.includes('SeatComfort') ? 'Mainstream seat cushioning and support assumed; confirm on a longer test drive.' : key === 'rideQuality' ? 'Mainstream bump absorption assumed; wheels and suspension can change the ride.' : 'Mainstream cabin isolation assumed; road and wind noise vary with speed and tyres.'), rating: 3 };
  const hasRearSeats = specs.seats.value !== 1 && specs.seats.value !== 2;
  if (!hasRearSeats) { delete ratings.rearSeatComfort; delete ratings.rearPassengerSpace; }
  const heatingFeature = features['Heated seats'];
  const heating = typeof heatingFeature?.value === 'boolean' ? { availability: heatingFeature.value ? 'present' : 'absent', rating: heatingFeature.value ? 5 : 0,
    quality: 'reference', origin: heatingFeature.status === 'seller-reported' ? 'seller' : 'model-reference', rationale: heatingFeature.value ? 'Heated seats reported present; confirm operation in this car.' : 'Heated seats reported absent or not working.', evidence: heatingFeature.evidence || [], assumptions: [] }
    : saved.heating ? { ...saved.heating, rating: ({ likely: 4, unlikely: 1, 'trim-dependent': 2.5 })[saved.heating.availability] }
      : { ...baseline('Seat heating is trim-dependent; a neutral allowance is used until equipment is confirmed.'), availability: 'trim-dependent', rating: 2.5 };
  ratings.seatHeating = heating;
  const average = (a, b) => hasRearSeats ? (ratings[a].rating + ratings[b].rating) / 2 : ratings[a].rating;
  const energy = resolveEnergy(car, specs, saved.energy);
  const practicalClaims = researchGuidance(car, 'practical').claims.filter(c => !c.contextOnly);
  const practicality = practicalClaims.length ? { quality: 'reference', origin: 'review', rationale: practicalClaims.map(c => c.text).join(' '), evidence: practicalClaims.flatMap(c => c.sources), assumptions: [] }
    : saved.practicality || baseline(specs.bodyType.value === 'Pickup' ? 'An open bed suits bulky loads; check bed length, cab access and parking space.' : ['SUV', 'Van'].includes(specs.bodyType.value) ? 'A taller cabin can ease entry and loading; check step-in height, rear access and parking dimensions.' : ['Coupe', 'Convertible'].includes(specs.bodyType.value) ? 'Check low-seat entry, door clearance, rear-seat access and luggage fit for daily use.' : 'Check rear-seat access, luggage fit, loading height and visibility when parking for your daily routine.');
  return { energy: { ...energy, annualCost: annualEnergyCost(energy, scenario) }, ratings, heating, practicality, hasRearSeats,
    seatComfort: average('frontSeatComfort', 'rearSeatComfort'), passengerSpace: average('frontPassengerSpace', 'rearPassengerSpace') };
}
