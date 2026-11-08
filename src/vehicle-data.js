import { extractVehicleSpecs } from './vehicle-specs.js';
export { FEATURE_RULES, extractVehicleSpecs } from './vehicle-specs.js';
import { resolveMileage } from './mileage.js';
import { VPIC_SOURCE } from '../shared/vin.js';
export { unitType, resolveMileage, mileageDisplay } from './mileage.js';

// Conservative interpretation of seller claims. Original listing fields are untouched.
export const unknown = value => value == null || value === '' || Array.isArray(value) && !value.length ? 'Unknown' : Array.isArray(value) ? value.join(' / ') : String(value);
export const vehicleName = car => { const { specs } = extractVehicleSpecs(car); return ['year', 'make', 'model'].map(key => unknown(specs[key].value)).join(' '); };
export function vehicleTrimLine({ trim, drivetrain }) {
  return [trim, drivetrain].filter(spec => spec.value != null && spec.status !== 'conflict').map(spec => spec.value).join(' · ');
}
export const safeUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; } };
export function listingSource(car) {
  const url = !car.demo && safeUrl(car.sourceUrl);
  return url ? { url, publisher: 'eBay listing' } : undefined;
}
export function canFillPhotoFrame(imageWidth, imageHeight, frameWidth, frameHeight) {
  if (![imageWidth, imageHeight, frameWidth, frameHeight].every(value => Number.isFinite(value) && value > 0)) return false;
  const imageRatio = imageWidth / imageHeight;
  const frameRatio = frameWidth / frameHeight;
  // Keep at least 80% of the original photo visible along the cropped axis.
  return Math.min(imageRatio, frameRatio) / Math.max(imageRatio, frameRatio) >= 0.8;
}
export function evidenceSources(evidence, car) {
  return (evidence || []).map(item => {
    if (item.type === 'vpic') return { url: VPIC_SOURCE, publisher: 'NHTSA vPIC' };
    if (car && item.type?.startsWith('seller-')) return listingSource(car);
    return item;
  }).filter(item => safeUrl(item?.url));
}
export function specification(car, ...names) {
  const values = [...new Set((car.itemSpecifics || []).filter(a => names.includes(a.name?.trim().toLowerCase())).flatMap(a => Array.isArray(a.value) ? a.value : [a.value]).filter(v => v != null && v !== ''))];
  return values.length > 1 ? values : values[0] ?? null;
}
export function numeric(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== 'string' || !/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value.trim())) return null;
  const amount = Number(value.replaceAll(',', ''));
  return Number.isFinite(amount) ? amount : null;
}
export function priceDisplay(car) {
  const price = car.priceCAD ?? car.returnedPrice;
  return price?.value != null && price.currency ? `${unknown(price.value)} ${price.currency}` : 'Unknown';
}
export function listedFeatures(car) {
  return Object.fromEntries(Object.entries(extractVehicleSpecs(car).features).map(([name, feature]) => [name, feature.value]));
}
export function powerHp(car) {
  return extractVehicleSpecs(car).specs.horsepower.value;
}

export function missingDetails(car) {
  const specs = extractVehicleSpecs(car).specs;
  const details = [
    ['Year', specs.year.value], ['Make', specs.make.value], ['Model', specs.model.value],
    ['Mileage / unit', resolveMileage(car).status === 'known' ? true : null],
    ['Transmission', specs.transmission.value],
    ['Fuel type', specs.fuelType.value],
    ['Engine displacement', specs.displacement.value], ['Horsepower', specs.horsepower.value], ['Torque', specs.torque.value],
    ['Body type', specs.bodyType.value], ['Seats', specs.seats.value],
    ['Condition', car.condition], ['Seller description', car.description],
  ];
  return details.filter(([, value]) => value == null || value === '' || Array.isArray(value)).map(([label]) => label);
}
