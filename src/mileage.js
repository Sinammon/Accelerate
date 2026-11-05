import { decodeHTML } from 'entities/decode';

const numberPattern = '(?:\\d{1,3}(?:,\\d{3})+|\\d{1,3}(?: \\d{3})+|\\d+)(?:\\.\\d+)?';
const unitPattern = '(?:kilometres?|kilometers?|miles?|kms?|mi)';
const shortSuffix = `(k(?=[ \\t]|$|${unitPattern}|[.!?;]))?`;
const readingPattern = new RegExp(`^(${numberPattern})(k(?=[ \\t]|$|${unitPattern}))?[ \\t]*(${unitPattern})?$`, 'i');
const measurementPattern = new RegExp(`(?<![\\w.,+\\-])(${numberPattern})(k(?=[ \\t]|${unitPattern}))?[ \\t]*(${unitPattern})\\b(?!:)`, 'gi');
const labelledPattern = new RegExp(`\\b(?:mileage|odometer(?:[ \\t]+reading)?)\\b[ \\t]*(?:(?:is|reads?|shows?|at)[ \\t]*|[:=][ \\t]*)?(?:\\n[ \\t]*){0,4}(${numberPattern})${shortSuffix}(?:[ \\t]*(${unitPattern})\\b(?!:))?(?![\\w,]|\\.\\d)`, 'gi');
const unitLabelPattern = new RegExp(`\\b(${unitPattern})[ \\t]*[:=][ \\t]*(?:\\n[ \\t]*){0,4}(${numberPattern})${shortSuffix}(?![\\w,]|\\.\\d)`, 'gi');
const declarationPattern = new RegExp(`\\b(?:mileage|odometer(?: reading)?)[ \\t]+(?:(?:is|are)[ \\t]+)?(?:in|units?[ \\t]*(?:is|are|[:=])?)[ \\t]+(${unitPattern})\\b`, 'gi');
const mileageField = /^(mileage|odometer|odometer reading|kilom[e\u00e9]trage)(?:\s*\(([^)]+)\))?$/i;
export const unitType = unit => typeof unit !== 'string' ? null : /^(kms?|kilomet(?:er|re)s?)$/i.test(unit.trim()) ? 'km' : /^(mi|miles?)$/i.test(unit.trim()) ? 'mi' : null;

// Analyze visible text only; never render seller HTML.
export function sellerText(value) {
  if (typeof value !== 'string') return '';
  return decodeHTML(value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?(?:p|div|li|h[1-6]|tr|td|th|ul|ol|table|section)\b[^>]*>|<br\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, ''))
    .replace(/\r\n?/g, '\n').replace(/[\u00a0\u2007\u202f]/g, ' ');
}

function reading(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim().replace(/[\u00a0\u2007\u202f]/g, ' ');
  const match = text.match(readingPattern);
  if (!match) return null;
  const amount = Number(match[1].replaceAll(',', '').replaceAll(' ', '')) * (match[2] ? 1000 : 1);
  return Number.isFinite(amount) && amount >= 0 && amount <= Number.MAX_SAFE_INTEGER ? { amount, unit: unitType(match[3]) } : null;
}

function relevantContext(text, match) {
  const before = text.slice(Math.max(0, match.index - 100), match.index).split(/[;\n!?]|\.(?!\d)/).at(-1);
  const after = text.slice(match.index + match[0].length, match.index + match[0].length + 70);
  return !/\b(?:warranty|guarantee|service|serviced|oil|changed|shipping|delivery|range|allowance|trip|gas|fuel|not|no|unknown)\b/i.test(before)
    && !/\b(?:call|phone|text)\b|\d[)\-][\d -]*$/i.test(before)
    && !/^\s*(?:ago|since|remaining|per\b|\/|a year|annually|warranty|not actual|unknown|exempt|before\b)/i.test(after)
    && !/(?:\bL|litres?|liters?)\s*\/\s*$/i.test(before);
}

function proseReadings(text, source, title = false) {
  const candidates = [];
  const add = (match, raw, unitStatement = false) => {
    if (!relevantContext(text, match)) return;
    const parsed = reading(raw);
    if (parsed) candidates.push({ ...parsed, raw, source, quote: match[0], unitStatement, sellerReported: true });
  };
  for (const match of text.matchAll(labelledPattern)) add(match, `${match[1]}${match[2] || ''}${match[3] ? ` ${match[3]}` : ''}`);
  for (const match of text.matchAll(unitLabelPattern)) add(match, `${match[2]}${match[3] || ''} ${match[1]}`, true);
  // A vehicle headline may contain mileage without a label. Free-form descriptions
  // require an odometer/mileage label, never the first distance or number found.
  if (title) for (const match of text.matchAll(measurementPattern)) add(match, match[0]);
  return candidates;
}

const units = values => [...new Set(values.flat().map(unitType).filter(Boolean))];
const km = candidate => candidate.amount * (candidate.unit === 'mi' ? 1.609344 : 1);

export function resolveMileage(car) {
  const override = car.mileageOverride;
  if (override && typeof override.amount === 'number' && Number.isFinite(override.amount) && override.amount >= 0 && override.amount <= Number.MAX_SAFE_INTEGER && ['km', 'mi'].includes(override.unit)) {
    const original = resolveMileage({ ...car, mileageOverride: undefined });
    return { raw: String(override.amount), originalRaw: original.originalRaw, amount: override.amount, unit: override.unit, status: 'known', source: 'Your details', userEntered: true, sellerReported: false, assumedUnit: false,
      evidence: [{ ...override, source: 'Your details', quote: `${override.amount} ${override.unit}`, sellerReported: false }], originalEvidence: original.evidence,
      reason: 'User-entered odometer reading and unit. Original imported evidence is preserved.' };
  }
  const aspects = (car.itemSpecifics || []).filter(aspect => mileageField.test(aspect.name?.trim()));
  const structured = [
    ...[car.mileage?.raw].flat().map(raw => ({ raw, source: 'Original mileage' })),
    ...aspects.flatMap(aspect => [aspect.value].flat().map(raw => ({ raw, source: `Mileage specification: ${aspect.name}`, fieldUnit: unitType(aspect.name.trim().match(mileageField)?.[2]) }))),
  ].filter(item => item.raw != null && item.raw !== '');
  const originalRaw = car.mileage?.raw ?? structured[0]?.raw ?? null;
  const texts = [['Seller description', sellerText(car.description)], ['Listing title', sellerText(car.title)]];
  const descriptions = proseReadings(texts[0][1], texts[0][0]);
  const titles = proseReadings(texts[1][1], texts[1][0], true);
  const explicitUnits = units([car.mileage?.unit, ...(car.itemSpecifics || []).filter(aspect => /^(?:mileage|odometer) units?$/i.test(aspect.name?.trim())).flatMap(aspect => [aspect.value].flat())]);
  const declarations = texts.flatMap(([source, text]) => [...text.matchAll(declarationPattern)].filter(match => relevantContext(text, match)
    && !/^\s*(?:or|and|\/)/i.test(text.slice(match.index + match[0].length))).map(match => ({ unit: unitType(match[1]), source, quote: match[0], sellerReported: true })));
  const sameListedAmount = claim => structured.some(item => reading(item.raw)?.amount === claim.amount);
  const claimedUnits = [...declarations, ...descriptions.filter(item => item.unit && (item.unitStatement || sameListedAmount(item))),
    ...titles.filter(item => item.unit && sameListedAmount(item))];
  const impliedUnits = [...new Set(claimedUnits.map(item => item.unit))];
  const candidates = structured.flatMap(item => {
    const parsed = reading(item.raw);
    if (!parsed) return [];
    const stated = [...new Set([parsed.unit, item.fieldUnit, ...explicitUnits].filter(Boolean))];
    const inferred = !stated.length && impliedUnits.length === 1 ? claimedUnits[0] : null;
    return [{ ...item, amount: parsed.amount, unit: stated[0] || inferred?.unit || null, unitConflict: stated.length > 1,
      unitEvidence: inferred, quote: String(item.raw), sellerReported: true }];
  });
  // Dedicated listing fields win. Description/title claims are fallbacks, not a
  // chance to overwrite a supplied reading with a phone number or service interval.
  const fallback = descriptions.length ? descriptions : titles;
  const selected = candidates.length ? candidates : fallback.map(item => ({ ...item,
    unit: item.unit || (explicitUnits.length === 1 ? explicitUnits[0] : null),
    unitConflict: explicitUnits.length > 1 || item.unit && explicitUnits.length === 1 && item.unit !== explicitUnits[0] }));
  const unknown = { raw: null, originalRaw, amount: null, unit: null, status: 'unknown', source: null, evidence: [], sellerReported: true, assumedUnit: false, reason: 'No explicit vehicle mileage reading was found.' };
  if (!selected.length) return unknown;
  const declaredUnits = [...new Set(declarations.map(item => item.unit))];
  const resolved = selected.map(item => item.unit || declaredUnits.length !== 1 ? item : { ...item, unit: declaredUnits[0], unitEvidence: declarations[0] });
  const chosen = resolved.find(item => item.unit) || resolved[0];
  const evidence = resolved.map(item => ({ amount: item.amount, unit: item.unit, quote: item.quote, source: item.source, sellerReported: true }));
  if (chosen.unitEvidence) evidence.push(chosen.unitEvidence);
  const conflicts = resolved.some(item => item.unitConflict || (item.unit && chosen.unit ? Math.abs(km(item) - km(chosen)) > 1 : item.amount !== chosen.amount));
  if (conflicts) return { ...unknown, status: 'conflict', evidence, reason: 'The listing supplies conflicting mileage readings or units. Confirm the odometer reading and unit with the seller.' };
  return { raw: chosen.raw, originalRaw, amount: chosen.amount, unit: chosen.unit || 'km', status: 'known', source: chosen.source,
    sellerReported: true, assumedUnit: !chosen.unit, evidence, reason: !chosen.unit ? 'The seller supplies a mileage reading without a unit. Kilometres are assumed; confirm the unit with the seller.'
      : chosen.unitEvidence ? `Mileage selected from ${chosen.source.toLowerCase()}; the unit comes from an explicit seller mileage statement.`
      : `Mileage selected from ${chosen.source.toLowerCase()}. Seller-reported, not independently verified.` };
}

export function mileageDisplay(car) {
  const result = resolveMileage(car);
  if (result.status === 'conflict') return 'Conflicting mileage';
  if (result.amount == null) return 'Unknown';
  if (!result.unit) return `${String(result.raw)} \u00b7 unit not stated`;
  const parsed = reading(result.raw);
  const value = parsed ? `${String(result.raw)}${parsed.unit ? '' : ` ${result.unit}`}` : `${result.amount.toLocaleString('en-CA')} ${result.unit}`;
  return `${value}${result.assumedUnit ? ' (assumed)' : ''}${result.userEntered ? ' · User-entered' : ''}`;
}

export const mileageEvidenceLabel = result => result.userEntered ? 'User-entered mileage' : result.assumedUnit ? 'Seller reading · kilometres assumed' : 'Seller-reported mileage';
