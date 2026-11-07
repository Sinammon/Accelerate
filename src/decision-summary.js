import { modelAdviceSummary } from './model-advice.js';
import { rankDecisionMode, DEFAULT_SCENARIO } from './decision-engine.js';
import { extractVehicleSpecs, specEvidenceLabel } from './vehicle-specs.js';
import { DIMENSION_LABELS, supportedPowerToWeight } from './capability-scoring.js';
import { researchGuidance, researchForCar } from './model-research.js';
import { resolveVehicleExperience, experienceLabel } from './vehicle-experience.js';
import { resolveMileage, numeric, vehicleName } from './vehicle-data.js';
import { mileageEvidenceLabel } from './mileage.js';
import { ownershipContext, sellerHistoryContext } from './ownership-context.js';

export const PRIMARY_MODES = [
  { id: 'value', label: 'Best Value', icon: 'trophy' },
  { id: 'cost', label: 'Affordability', icon: 'dollar' },
  { id: 'comfort', label: 'Comfort', icon: 'seat' },
  { id: 'practical', label: 'Practicality', icon: 'compare' },
  { id: 'performance', label: 'Performance', icon: 'engine' },
];
const money = n => `$${n.toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD`;
const number = n => n.toLocaleString('en-CA', { maximumFractionDigits: 0 });

// The requested category always owns its result; missing evidence never switches priorities.
export function decisionSummary(cars, mode, year, scenario, ownership) {
  const selectedMode = PRIMARY_MODES.some(item => item.id === mode) ? mode : 'value';
  const requested = rankDecisionMode(cars, selectedMode, year, scenario, ownership);
  const kind = !cars.length ? 'empty' : !requested.best.length ? 'guidance' : requested.best[0].reviewRequired ? 'review' : 'supported';
  return { requested, ranking: requested, ownership, kind, provisional: requested.provisional, shared: requested.best.length > 1, single: cars.length === 1 };
}


export const MAX_DECISION_ITEMS = 6;
const textKey = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');
const sourcesFor = records => [...new Map(records.flatMap(record => record?.evidence || [])
  .filter(e => e.url).map(e => [e.url, { url: e.url, publisher: e.source || e.publisher || 'Reference source' }])).values()];
const supportedItem = (text, topic, records, key = topic) => {
  const parts = records.filter(Boolean), sources = sourcesFor(parts);
  return { key, text, topic, label: [...new Set(parts.map(experienceLabel))].join(' + '), source: sources[0], sources };
};
const claimItem = claim => ({ key: claim.id || claim.text, text: claim.text, topic: 'Model evidence',
  label: 'Sourced model context; confirm on this car', source: claim.sources[0], sources: claim.sources });

function comfortReasons(car) {
  const experience = resolveVehicleExperience(car);
  return ['rideQuality', 'seatComfort', 'cabinQuietness', 'seatHeating'].map(key => {
    const record = key === 'seatComfort' ? experience.ratings.frontSeatComfort : experience.ratings[key];
    const parts = key === 'seatComfort' ? [record, experience.ratings.rearSeatComfort].filter(Boolean) : [record];
    const rationale = key === 'seatComfort' && experience.hasRearSeats
      ? `Front: ${record.rationale} Rear: ${experience.ratings.rearSeatComfort.rationale}` : record.rationale;
    return supportedItem(`${DIMENSION_LABELS[key]}: ${rationale}`, DIMENSION_LABELS[key], parts, key);
  });
}

function modelOverview(car) {
  const overview = modelAdviceSummary(car).find(item => item.topic === 'Model overview');
  if (overview) return { ...overview, key: 'overview', kind: 'overview' };
  const profile = researchForCar(car);
  if (profile.status === 'matched') return { key: 'overview', kind: 'overview', topic: 'Model overview', text: profile.scope,
    label: 'Reviewed model profile; not an individual condition check', source: profile.claims[0]?.sources[0] };
  const { specs } = extractVehicleSpecs(car);
  const fields = ['bodyType', 'fuelType', 'transmission'].filter(key => specs[key].value != null);
  return { key: 'overview', kind: 'overview', topic: 'Model overview',
    text: fields.length ? `${vehicleName(car)}: ${fields.map(key => String(specs[key].value)).join(', ')}.` : 'A model overview is not available for this configuration yet.',
    label: fields.length ? [...new Set(fields.map(key => specEvidenceLabel(specs[key])))].join(' + ') : 'Model information unavailable' };
}

function valueReasons(summary, entry) {
  const candidates = [modelOverview(entry.car)];
  const price = entry.values.price;
  if (price != null) {
    const peers = summary.ranking.ranked.filter(other => other !== entry && !other.identityMismatch);
    const lowest = peers.length > 0 && peers.every(other => other.values.price != null && price <= other.values.price)
      && peers.some(other => price < other.values.price);
    candidates.push({ key: 'price', topic: 'Asking price', text: `At ${money(price)}, ${lowest ? 'it has the lowest asking price in this comparison' : 'compare its documented strengths with the asking price'}.`, label: 'Seller-reported asking price' });
  }
  const guidance = researchGuidance(entry.car, 'value');
  const context = ownershipContext(entry.car, 'value');
  // A sourced ownership concern outranks a general benefit; history claims stay qualified.
  candidates.push(...guidance.claims.filter(c => !c.contextOnly && c.tone === 'caution').map(claimItem));
  for (const key of ['age', 'mileage']) {
    const factor = entry.breakdown.find(item => item.key === key);
    if (factor && factor.min < factor.max && factor.value === factor.min) candidates.push({ key, topic: key === 'age' ? 'Model year' : 'Mileage',
      text: key === 'age' ? 'The newest model year in this comparison.' : `The lowest reported mileage in this comparison: ${number(factor.value)} km.`, label: entry.labels[key] });
  }
  candidates.push(...guidance.claims.filter(c => !c.contextOnly && c.tone === 'positive').map(claimItem));
  const comfort = comfortReasons(entry.car);
  candidates.push(...comfort.filter(item => item.sources.length));
  candidates.push(...context.map(item => ({ ...item, topic: 'Ownership context' })));
  candidates.push(...modelAdviceSummary(entry.car).filter(item => ['Benefits', 'Problems to investigate', 'Engine & reliability context'].includes(item.topic)));
  return candidates;
}

function costReasons(summary, entry) {
  const r = entry.running, energy = r.experience.energy;
  const scenario = { ...DEFAULT_SCENARIO, ...r.scenario };
  const overrides = summary.ownership?.vehicles?.[entry.car.legacyItemId] || {};
  const amount = n => Number.isFinite(n) ? money(n) : 'Incomplete';
  const kind = energy.powertrain === 'electric' ? 'charging' : energy.powertrain === 'liquid' ? 'fuel' : 'fuel / charging';
  const prices = [energy.powertrain !== 'electric' && (Number.isFinite(scenario.pricePerLitre) ? `$${scenario.pricePerLitre.toFixed(2)}/L` : 'fuel price incomplete'),
    energy.powertrain !== 'liquid' && (Number.isFinite(scenario.pricePerKwh) ? `$${scenario.pricePerKwh.toFixed(2)}/kWh` : 'electricity price incomplete'),
    energy.powertrain === 'phev' && (Number.isFinite(scenario.electricShare) ? `${scenario.electricShare}% electric driving` : 'electric share incomplete')].filter(Boolean).join(' \u00b7 ');
  const source = energy.evidence?.find(e => e.url);
  const fuel = { key: 'fuel', topic: 'Fuel / charging', text: `Estimated annual ${kind} cost: ${Number.isFinite(r.energy) ? `${amount(r.energy)}/year` : 'check driving and energy-price assumptions'}.`,
    label: `${experienceLabel(energy)} \u00b7 ${Number.isFinite(scenario.annualKm) ? number(scenario.annualKm) + ' km/year' : 'annual driving incomplete'} \u00b7 ${prices} \u00b7 energy only`,
    source: source && { url: source.url, publisher: source.source } };
  if (r.inputs.energyOverride !== '') { fuel.text = `Annual fuel / charging override: ${amount(r.energy)}.`; fuel.label = 'Your calculator input; energy only'; delete fuel.source; }
  return [
    ...(entry.values.price != null ? [{ key: 'price', topic: 'Purchase price', text: `Purchase price: ${money(entry.values.price)}.`, label: 'Seller-reported asking price' }] : []),
    { key: 'running', topic: 'Annual running expenses', text: `Annual running expenses: ${amount(r.annualRunning)}${r.annualRunning == null ? '' : '/year'}.`, label: 'Planning estimates + your calculator inputs; includes parking and other running costs; financing excluded' },
    fuel,
    { key: 'insurance', topic: 'Insurance', text: `Insurance: ${amount(r.insurance)}${r.insurance == null ? '' : '/year'}.`, label: Object.hasOwn(overrides, 'insuranceAnnual') ? 'Your calculator input; not a verified quote' : r.estimates.insuranceAnnual.label },
    { key: 'maintenance', topic: 'Maintenance reserve', text: `Maintenance, tyres and repair reserve: ${amount(r.maintenance)}${r.maintenance == null ? '' : '/year'}.`, label: Object.hasOwn(overrides, 'maintenancePerKm') ? 'Your calculator input; reserve per km at your annual driving distance' : `${r.estimates.maintenancePerKm.label}; not a repair forecast` },
  ];
}

function practicalReasons(summary, entry) {
  const e = entry.experience, ratings = e.ratings;
  const passengers = [ratings.frontPassengerSpace, ratings.rearPassengerSpace].filter(Boolean);
  const candidates = [
    supportedItem(`Passenger room: ${passengers.map((rating, index) => `${index ? 'Rear' : 'Front'}: ${rating.rationale}`).join(' ')}`, 'Passenger room', passengers),
    supportedItem(`Usable cargo space: ${ratings.cargoSpace.rationale}`, 'Usable cargo space', [ratings.cargoSpace]),
  ];
  const seats = entry.specs.seats;
  if (seats.value != null) candidates.push({ key: 'seats', topic: 'Seating needs', text: `${seats.value} seats${Number.isFinite(summary.requested.scenario.minSeats) ? `; ${seats.value >= summary.requested.scenario.minSeats ? 'meets' : 'does not meet'} your ${summary.requested.scenario.minSeats}-seat need` : ''}.`, label: specEvidenceLabel(seats), sources: sourcesFor([seats]) });
  candidates.push(supportedItem(e.practicality.rationale, 'Everyday usability', [e.practicality]));
  if (summary.requested.scenario.bodyType && entry.specs.bodyType.value) candidates.push({ key: 'body', topic: 'Body preference', text: `${entry.specs.bodyType.value} body; ${entry.values.body ? 'matches' : 'does not match'} your ${summary.requested.scenario.bodyType} preference.`, label: specEvidenceLabel(entry.specs.bodyType), sources: sourcesFor([entry.specs.bodyType]) });
  candidates.push(...researchGuidance(entry.car, 'practical').claims.filter(c => !c.contextOnly).map(claimItem));
  return candidates;
}

function performanceReasons(summary, entry) {
  const comparison = performanceComparison(summary, entry);
  const factors = ['acceleration', 'powerToWeight', 'power', 'torque'].flatMap(key => entry.breakdown.filter(f => f.key === key));
  for (const [key, label] of [['powerToWeight', 'Power-to-weight'], ['power', 'Horsepower'], ['torque', 'Torque']]) {
    if (!factors.some(factor => factor.key === key) && Number.isFinite(entry.values[key])) factors.push({ key, label, value: entry.values[key], evidence: entry.evidence[key], evidenceLabel: `${entry.labels[key]}; unavailable for some contenders, excluded from comparative score` });
  }
  const candidates = comparison ? [{ ...comparison, key: 'powerToWeight', topic: 'Power-to-weight' }] : [];
  for (const factor of factors) {
    if (comparison?.covers.includes(factor.key)) continue;
    const value = factor.key === 'acceleration' ? `${factor.value} s` : factor.key === 'powerToWeight' ? `${factor.value.toFixed(1)} hp/tonne` : `${number(factor.value)} ${factor.key === 'power' ? 'hp' : 'Nm'}`;
    const sources = sourcesFor([factor]);
    candidates.push({ key: factor.key, topic: factor.label, text: `${factor.label}: ${value}`, label: factor.evidenceLabel, source: sources[0], sources });
  }
  candidates.push(...researchGuidance(entry.car, 'performance').claims.filter(c => !c.contextOnly).map(claimItem));
  return candidates;
}

function purchaseWarning(entry) {
  const labels = [...new Set(entry.warnings.map(warning => warning.label))];
  if (entry.identityMismatch) labels.unshift('Resolve conflicting identity or configuration');
  const history = sellerHistoryContext(entry.car);
  if (history && /^(Seller history concern|Conflicting seller history claims)/.test(history.text)) labels.push('Seller history concern; check the actual report');
  return labels.length ? { key: 'warning', kind: 'warning', topic: 'Review before choosing', text: `${[...new Set(labels)].join('; ')}. Review the full evidence before buying.`,
    label: 'Listing claims and evidence concerns; not an independent inspection' } : null;
}

function categoryTradeoff(summary, entry) {
  const mode = summary.requested.mode.id;
  const claim = researchGuidance(entry.car, mode).claims.find(item => item.tone === 'caution' && !item.contextOnly);
  if (!entry.identityMismatch && claim) return { ...claimItem(claim), key: 'tradeoff', kind: 'tradeoff', topic: 'Trade-off' };
  const weaker = [...entry.breakdown].sort((a, b) => a.points - b.points)[0];
  const fallback = {
    value: 'Model strengths do not establish this used car\u2019s condition. Check service records and arrange an inspection.',
    cost: 'Running costs are planning estimates, not quotes. Actual insurance and repair spending may differ.',
    comfort: 'Confirm ride quality, seat support and cabin noise on a test drive; model assessments do not verify this car.',
    practical: 'Check passenger fit, loading access and usable cargo room in person before choosing.',
    performance: summary.requested.criteria.some(c => c.key === 'acceleration' && c.active) ? 'Published performance figures do not verify this used car\u2019s current mechanical condition.' : 'Comparable acceleration evidence is incomplete; power figures alone do not establish which car is faster.',
  };
  const text = !entry.identityMismatch && weaker && weaker.points < 50
    ? `${weaker.key === 'capability' ? 'The documented comfort, performance and practicality are less competitive' : `${weaker.label} is a weaker factor`} in this comparison.` : fallback[mode];
  return { key: 'tradeoff', kind: 'tradeoff', topic: 'Trade-off', text, label: weaker && weaker.points < 50 && !entry.identityMismatch ? weaker.evidenceLabel : 'What to check for this priority', sources: weaker && weaker.points < 50 ? sourcesFor([weaker]) : [] };
}

export function performanceComparison(summary, entry) {
  const ratio = entry.values.powerToWeight;
  if (!Number.isFinite(ratio)) return null;
  const peer = summary.ranking.ranked.find(other => other !== entry && !other.identityMismatch && Number.isFinite(other.values.powerToWeight)
    && entry.values.power < other.values.power && entry.specs.curbWeightKg.value < other.specs.curbWeightKg.value && ratio > other.values.powerToWeight);
  if (!peer) return null;
  const metric = summary.requested.criteria.find(c => c.key === 'acceleration' && c.active);
  const quicker = metric && Number.isFinite(entry.values.acceleration) && entry.values.acceleration < peer.values.acceleration;
  const acceleration = quicker
    ? ` Comparable ${metric.label} figures are quicker: ${entry.values.acceleration} s versus ${peer.values.acceleration} s (${entry.specs[summary.requested.accelerationMetric].measurementMethod}).`
    : ' Power-to-weight indicates acceleration potential; it does not establish which car is faster.';
  return { text: `Despite ${number(entry.values.power)} hp versus ${number(peer.values.power)} hp in the ${vehicleName(peer.car)}, its lower weight (${number(entry.specs.curbWeightKg.value)} versus ${number(peer.specs.curbWeightKg.value)} kg) gives it a higher power-to-weight ratio: ${ratio.toFixed(1)} versus ${peer.values.powerToWeight.toFixed(1)} hp/tonne.${acceleration}`,
    label: `Derived from compatible power and curb weight · ${entry.labels.powerToWeight}`, covers: ['powerToWeight', 'power', ...(quicker ? ['acceleration'] : [])] };
}


export function entrySummary(summary, entry) {
  const { ranking, requested, kind } = summary;
  const warning = purchaseWarning(entry);
  const tradeoffItem = categoryTradeoff(summary, entry);
  const tradeoff = tradeoffItem.text;
  const builders = { value: valueReasons, cost: costReasons, comfort: (_, item) => comfortReasons(item.car), practical: practicalReasons, performance: performanceReasons };
  const candidates = entry.identityMismatch ? [] : builders[requested.mode.id](summary, entry);
  const seen = new Set([textKey(tradeoff)]);
  const budget = MAX_DECISION_ITEMS - 1 - Number(!!warning);
  const reasons = [];
  for (const item of candidates) {
    const key = textKey(item.text);
    if (seen.has(key)) continue;
    seen.add(key);
    reasons.push({ ...item, kind: item.kind || 'reason' });
    if (reasons.length === budget) break;
  }
  const items = [...reasons, tradeoffItem, ...(warning ? [warning] : [])];
  const active = ranking.criteria.filter(c => c.active).map(c => c.label.toLowerCase());
  const explanation = entry.identityMismatch ? 'Resolve conflicting identity or configuration details before ranking this car.'
    : entry.score == null ? 'Here is what we know so far. More comparable information is needed to choose between the cars.'
    : !ranking.best.includes(entry) ? 'Another contender in your shortlist, scored on the same supported category factors.'
    : kind === 'review' ? `Leads the available ${requested.mode.title.toLowerCase()} comparison, with purchase concerns to review before choosing.`
      : summary.single ? 'Your only contender so far. Add another car for a relative comparison.'
        : summary.shared ? ['value', 'comfort'].includes(requested.mode.id) ? 'An equal match on the comparable details available. Review the strengths and trade-offs below.' : `An equal match on ${active.join(', ')}.`
          : requested.mode.id === 'value' ? `${summary.provisional ? 'A tentative' : 'Our'} best-value pick: the strongest overall combination of ${ranking.criteria.filter(c => c.active).map(c => c.key === 'capability' ? 'documented strengths' : c.key === 'price' ? 'asking price' : c.key === 'age' ? 'model year' : 'mileage').join(', ')} among these contenders. See what you get for the money below.`
            : requested.mode.id === 'comfort' ? `${summary.provisional ? 'A tentative comfort pick' : 'Our comfort pick'}, based on the available ride, seating and cabin evidence below.`
              : `${summary.provisional ? 'Provisional best fit' : 'Best fit'} for ${requested.mode.title.toLowerCase()} on the supported comparable factors.`;
  return { items, reasons, tradeoff, tradeoffSource: tradeoffItem.source, explanation };
}

export function keyFacts(car, mode = 'value') {
  if (mode === 'comfort') return comfortReasons(car).slice(0, 3).map((reason, index) => ({ icon: 'seat', label: reason.topic || `Comfort evidence ${index + 1}`, value: reason.topic ? reason.text.slice(reason.topic.length + 2) : reason.text, source: reason.source?.publisher || reason.label, sourceUrl: reason.source?.url }));
  const { specs, features } = extractVehicleSpecs(car);
  const facts = [];
  const engine = [specs.displacement.value != null && `${specs.displacement.value.toFixed(1)} L`, specs.cylinders.value != null && `${specs.cylinders.value}-cylinder`].filter(Boolean).join(' · ');
  const engineFields = [specs.displacement, specs.cylinders].filter(s => s.value != null);
  if (engine) facts.push({ icon: 'engine', label: 'Engine', value: engine, source: engineFields.some(s => s.quality === 'estimated') ? 'Includes estimated model specs; unverified' : engineFields.some(s => s.status === 'model-reference') ? 'Includes typical model specs · cited sources' : engineFields.every(s => s.status === 'vin-record') ? 'Original VIN record' : engineFields.every(s => s.status === 'seller-reported') ? 'Seller-reported' : 'Seller / original VIN evidence' });
  const mileage = resolveMileage(car);
  if (mileage.unit && mileage.amount != null) facts.push({ icon: 'mileage', label: 'Mileage', value: `${number(mileage.amount)} ${mileage.unit}`, source: mileageEvidenceLabel(mileage) });
  const amenities = Object.entries(features).filter(([, f]) => f.value === true).map(([label]) => label);
  if (amenities.length) facts.push({ icon: 'seat', label: 'Reported features', value: amenities.slice(0, 3).join(', '), source: amenities.some(name => features[name].status === 'model-reference') ? 'Includes typical standard equipment · confirm on this car' : 'Seller-reported · confirm on this car' });
  else if (specs.transmission.value) facts.push({ icon: 'transmission', label: 'Transmission', value: specs.transmission.value, source: specEvidenceLabel(specs.transmission) });
  if (!facts.length && car.priceCAD?.currency === 'CAD' && numeric(car.priceCAD.value) != null) facts.push({ icon: 'dollar', label: 'Asking price', value: money(numeric(car.priceCAD.value)), source: 'Seller-reported' });
  if (mode !== 'value') {
    const specFact = (key, label, unit, icon) => { if (specs[key].value != null) facts.push({ icon, label, value: `${specs[key].value}${unit}`, source: specEvidenceLabel(specs[key]) }); };
    specFact('horsepower', 'Power', ' hp', 'engine');
    specFact('torque', 'Torque', ' Nm', 'engine');
    specFact('curbWeightKg', 'Curb weight', ' kg', 'engine');
    const ratio = supportedPowerToWeight(specs);
    if (ratio != null) facts.push({ icon: 'engine', label: 'Power-to-weight', value: `${number(ratio)} hp/tonne`, source: 'Derived from compatible power and curb weight' });
    specFact('seats', 'Seats', '', 'seat');
    specFact('bodyType', 'Body style', '', 'compare');
    specFact('fuelType', 'Fuel type', '', 'dollar');
    if (car.enrichment?.fuel?.status === 'matched') facts.push({ icon: 'dollar', label: 'Fuel reference', value: `${car.enrichment.fuel.combined.toFixed(1)} L/100 km`, source: 'NRCan configuration reference' });
    if (car.priceCAD?.currency === 'CAD' && numeric(car.priceCAD.value) != null && !facts.some(f => f.label === 'Asking price')) facts.push({ icon: 'dollar', label: 'Asking price', value: money(numeric(car.priceCAD.value)), source: 'Seller-reported' });
    const order = ({ cost: ['Asking price', 'Fuel reference', 'Fuel type', 'Engine', 'Mileage'], comfort: ['Ride quality', 'Cabin quietness', 'Seat comfort', 'Passenger space'], practical: ['Seats', 'Body style', 'Reported features', 'Mileage'], performance: ['Power-to-weight', 'Power', 'Torque', 'Curb weight'], balanced: ['Engine', 'Fuel reference', 'Fuel type', 'Reported features', 'Mileage'] })[mode] || [];
    return order.flatMap(label => facts.filter(f => f.label === label)).slice(0, 3);
  }
  return facts.slice(0, 3);
}
