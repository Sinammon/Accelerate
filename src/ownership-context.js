import { sellerText } from './mileage.js';
import { researchGuidance } from './model-research.js';

export function sellerHistoryContext(car) {
  const clauses = [car.title, car.description, ...(car.itemSpecifics || []).map(a => `${a.name}: ${[a.value].flat().join(', ')}`)]
    .filter(value => typeof value === 'string').flatMap(value => sellerText(value).split(/[.!?;\n]/)).map(value => value.trim()).filter(Boolean);
  const positive = clauses.find(clause => /\b(?:clean\s+carfax|carfax(?:\s+(?:history|report))?\s+(?:is\s+)?clean)\b/i.test(clause)
    && !/\b(?:no|not|never|without|isn['’]t|doesn['’]t|does not|cannot|can['’]t)\b.*\b(?:clean|carfax)\b/i.test(clause)
    && !/\b(?:carfax|clean)\b.*\b(?:not provided|not available|unavailable|unconfirmed|not clean)\b/i.test(clause));
  const problem = /\b(?:not clean|isn['’]t clean|no clean|salvage|rebuilt|branded|accident (?:reported|history)|(?:shows?|reports?|had|has)\s+(?:(?:an?|previous|reported)\s+)*(?:accident|damage))\b/gi;
  const adverse = clauses.find(clause => /\b(?:carfax|accident|salvage|rebuilt|branded)\b/i.test(clause)
    && [...clause.matchAll(problem)].some(match => !/\b(?:no|not|never|without|free of)\s+(?:(?:reported|known|any|a)\s+)*$/i.test(clause.slice(0, match.index))));
  const unavailable = clauses.find(clause => /\b(?:no|without)\s+(?:a\s+)?carfax\b|\bcarfax(?:\s+report)?\s+(?:is\s+)?(?:not (?:available|provided|supplied)|unavailable)\b/i.test(clause));
  const concern = adverse || (positive && unavailable);
  const quote = text => text.length > 320 ? `${text.slice(0, 317)}…` : text;
  if (concern) return { text: `${positive ? 'Conflicting seller history claims' : 'Seller history concern'}: “${quote(concern)}”${positive ? `; also “${quote(positive)}”` : ''}. Check the actual report.`, label: 'Seller-reported · report not verified', context: true };
  if (positive) return { text: `Seller states: “${quote(positive)}”. Ask to see the full Carfax report.`, label: 'Seller-reported · report not verified', context: true };
  return null;
}

export function ownershipContext(car, mode) {
  const claims = researchGuidance(car, mode).claims.filter(claim => !claim.contextOnly && claim.categories?.includes('reliability'));
  const claim = claims.find(item => item.tone === 'caution') || claims[0];
  return [claim && { text: claim.text, label: 'Sourced reliability / maintenance context · not scored', source: claim.sources[0] }, sellerHistoryContext(car)].filter(Boolean);
}
