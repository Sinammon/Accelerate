import { rankDecisionMode } from './decision-engine.js';
import { extractVehicleSpecs, specEvidenceLabel } from './vehicle-specs.js';
import { DIMENSION_LABELS, supportedPowerToWeight } from './capability-scoring.js';
import { researchGuidance } from './model-research.js';
import { resolveVehicleExperience, experienceLabel } from './vehicle-experience.js';
import { resolveMileage, numeric } from './vehicle-data.js';

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
export function decisionSummary(cars, mode, year, scenario) {
  const requested = rankDecisionMode(cars, mode, year, scenario);
  const kind = !cars.length ? 'empty' : !requested.best.length ? 'guidance' : requested.best[0].reviewRequired ? 'review' : 'supported';
  return { requested, ranking: requested, kind, provisional: requested.provisional, shared: requested.best.length > 1, single: cars.length === 1 };
}

// Describe evidence, rather than translating a score into an unsupported claim.
function comfortReasons(car) {
  const experience = resolveVehicleExperience(car);
  return ['rideQuality', 'seatComfort', 'seatHeating', 'cabinQuietness'].map(key => {
    const record = key === 'seatComfort' ? experience.ratings.frontSeatComfort : experience.ratings[key];
    const evidence = record.evidence?.find(e => e.url);
    const rationale = key === 'seatComfort' && experience.hasRearSeats ? `Front: ${record.rationale} Rear: ${experience.ratings.rearSeatComfort.rationale}` : record.rationale;
    const parts = key === 'seatComfort' ? [record, experience.ratings.rearSeatComfort].filter(Boolean) : [record];
    return { text: `${DIMENSION_LABELS[key]}: ${rationale}`, topic: DIMENSION_LABELS[key], label: [...new Set(parts.map(experienceLabel))].join(' + '), source: evidence ? { url: evidence.url, publisher: evidence.source } : undefined };
  });
}

function valueReasons(summary, entry) {
  const reasons = [];
  const price = entry.values.price;
  if (price != null) {
    const peers = summary.ranking.ranked.filter(e => e !== entry && !e.identityMismatch);
    const comparable = peers.length > 0 && peers.every(e => e.values.price != null);
    const lowest = comparable && peers.every(e => price <= e.values.price) && peers.some(e => price < e.values.price);
    reasons.push({ text: `At ${money(price)}, ${lowest ? 'it has the lowest asking price in this comparison' : 'here is what you get for the asking price'}.`, label: 'Seller-reported asking price' });
  }
  const comfort = comfortReasons(entry.car);
  reasons.push(...comfort.slice(0, 1));
  const model = researchGuidance(entry.car, 'value');
  reasons.push(...model.claims.filter(c => c.tone === 'positive' && !c.contextOnly).slice(0, 1).map(c => ({ text: c.text, label: 'Sourced model strength', source: c.sources[0] })));
  for (const key of ['powerToWeight', 'power', 'seats']) {
    if (reasons.length >= 3) break;
    if (entry.values[key] == null) continue;
    const text = key === 'powerToWeight' ? `${number(entry.values[key])} hp/tonne from compatible power and weight specifications.`
      : key === 'power' ? `${number(entry.values[key])} hp of supported engine output.`
        : entry.values.seats ? `Meets your ${summary.requested.scenario.minSeats}-seat need.` : null;
    if (text) reasons.push({ text, label: entry.labels[key], source: entry.evidence[key]?.[0] && { url: entry.evidence[key][0].url, publisher: entry.evidence[key][0].source } });
  }
  const comparison = ['age', 'mileage'].flatMap(key => {
    const factor = entry.breakdown.find(c => c.key === key);
    return factor && factor.min < factor.max && factor.value === factor.min ? [{ text: key === 'age' ? 'The newest model year in this comparison.' : `The lowest reported mileage in this comparison: ${number(factor.value)} km.`, label: entry.labels[key] }] : [];
  });
  if (comparison.length) reasons.splice(2, reasons.length > 2 ? 1 : 0, comparison[0]);
  return reasons.slice(0, 3);
}

export function entrySummary(summary, entry) {
  const { ranking, requested, kind } = summary;
  const model = requested.research.find(item => item.car === entry.car)?.guidance;
  const describe = factor => {
    const value = factor.key === 'price' ? money(factor.value)
      : factor.key === 'mileage' ? `${number(factor.value)} km`
      : factor.key === 'power' ? `${number(factor.value)} hp`
      : factor.key === 'torque' ? `${number(factor.value)} Nm`
      : factor.key === 'powerToWeight' ? `${number(factor.value)} hp/tonne`
      : factor.key === 'acceleration' ? `${factor.value} s`
      : ['rideQuality', 'cabinQuietness', 'seatComfort', 'seatHeating', 'passengerSpace', 'cargoSpace'].includes(factor.key) ? `${factor.value} / 5`
      : ['capability', 'affordability', 'comfort', 'performance', 'practical'].includes(factor.key) ? `${factor.value.toFixed(1)} / 100`
      : factor.key === 'fuel' ? `${money(factor.value)}/year` : factor.key === 'seats' || factor.key === 'body' ? factor.value ? 'Yes' : 'No' : `${factor.value} years`;
    const evidence = factor.evidence?.find(e => e.url);
    return { text: `${factor.label}: ${value}`, label: factor.evidenceLabel, source: evidence ? { url: evidence.url, publisher: evidence.source } : undefined };
  };
  const factors = [...entry.breakdown].sort((a, b) => b.contribution - a.contribution);
  let reasons = factors.slice(0, 3).map(describe);
  if (!entry.identityMismatch && requested.mode.id === 'value') reasons = valueReasons(summary, entry);
  if (!entry.identityMismatch && requested.mode.id === 'comfort') reasons = comfortReasons(entry.car).slice(0, 3);
  if (!entry.identityMismatch && requested.mode.id === 'practical') reasons = [{ text: `Passenger room: ${entry.experience.passengerSpace.toFixed(1)} / 5. ${entry.experience.ratings.frontPassengerSpace.rationale}`, label: experienceLabel(entry.experience.ratings.frontPassengerSpace) }, { text: `Usable cargo space: ${entry.experience.ratings.cargoSpace.rationale}`, label: experienceLabel(entry.experience.ratings.cargoSpace) }, { text: entry.experience.practicality.rationale, label: experienceLabel(entry.experience.practicality) }];
  if (!reasons.length) reasons = (model?.claims || []).filter(c => !c.contextOnly).slice(0, 2).map(c => ({ text: c.text, label: 'Model context | not a comparative score', source: c.sources[0] }));
  if (!entry.identityMismatch && ['value', 'comfort'].includes(requested.mode.id) && !comfortReasons(entry.car).length) {
    const check = { text: 'Ride quality and seat comfort still need checking. On a test drive, check bump absorption, seat support and rear-seat comfort.', label: 'What to check in this car' };
    reasons = [...reasons.slice(0, 2), check];
  }
  const weaker = [...entry.breakdown].sort((a, b) => a.points - b.points)[0];
  const modelDrawback = model?.claims.find(c => c.tone === 'caution' && !c.contextOnly);
  const tradeoff = modelDrawback?.text || (weaker && weaker.points < 50 ? `${weaker.key === 'capability' ? 'The documented comfort, performance and practicality' : weaker.label} ${weaker.key === 'capability' ? 'are less competitive' : 'is a weaker factor'} in this comparison.` : summary.provisional ? 'Includes estimates or incomplete evidence. This result may improve as research completes.' : 'Model assessments do not establish the condition of this used car; confirm on a test drive.');
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
  return { reasons, tradeoff, tradeoffSource: modelDrawback?.sources[0], explanation };
}

export function keyFacts(car, mode = 'value') {
  if (mode === 'comfort') return comfortReasons(car).slice(0, 3).map((reason, index) => ({ icon: 'seat', label: reason.topic || `Comfort evidence ${index + 1}`, value: reason.topic ? reason.text.slice(reason.topic.length + 2) : reason.text, source: reason.source?.publisher || reason.label, sourceUrl: reason.source?.url }));
  const { specs, features } = extractVehicleSpecs(car);
  const facts = [];
  const engine = [specs.displacement.value != null && `${specs.displacement.value.toFixed(1)} L`, specs.cylinders.value != null && `${specs.cylinders.value}-cylinder`].filter(Boolean).join(' · ');
  const engineFields = [specs.displacement, specs.cylinders].filter(s => s.value != null);
  if (engine) facts.push({ icon: 'engine', label: 'Engine', value: engine, source: engineFields.some(s => s.quality === 'estimated') ? 'Includes estimated model specs; unverified' : engineFields.some(s => s.status === 'model-reference') ? 'Includes typical model specs · cited sources' : engineFields.every(s => s.status === 'vin-record') ? 'Original VIN record' : engineFields.every(s => s.status === 'seller-reported') ? 'Seller-reported' : 'Seller / original VIN evidence' });
  const mileage = resolveMileage(car);
  if (mileage.unit && mileage.amount != null) facts.push({ icon: 'mileage', label: 'Mileage', value: `${number(mileage.amount)} ${mileage.unit}`, source: mileage.assumedUnit ? 'Seller reading · kilometres assumed' : 'Seller-reported' });
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
