import { ownershipModelData } from './ownership-estimates.js';
import { researchForCar, liveResearchForCar, liveResearchClaim } from './model-research.js';
import { extractVehicleSpecs } from './vehicle-specs.js';

const normalized = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');
export function modelAdviceSummary(car, excluded = []) {
  const ai = ownershipModelData(car).advice;
  const live = liveResearchForCar(car);
  const claims = [...live.insights.map(c => liveResearchClaim(c, live.checked)), ...researchForCar(car).claims].filter(c => !c.contextOnly);
  const seen = new Set(excluded.map(normalized));
  const observations = [];
  const add = (text, topic, claim) => {
    if (!text || seen.has(normalized(text))) return;
    seen.add(normalized(text));
    observations.push({ text, topic, context: true, label: claim?.sources?.length ? 'Sourced model context · not a condition check' : claim ? 'Configuration unresolved · model-level guidance' : 'AI model guidance—not independently verified',
      source: claim?.sources?.[0], sources: claim?.sources, checked: !claim ? ai?.checked : undefined });
  };
  const benefits = claims.filter(c => c.tone === 'positive');
  const problems = claims.filter(c => c.tone === 'caution' || c.category === 'issues' || c.categories?.includes('issues'));
  const reliability = claims.filter(c => c.categories?.includes('reliability'));
  add(ai?.overview, 'Model overview');
  for (const [topic, sourced, fallback] of [['Benefits', benefits, ai?.benefits], ['Problems to investigate', problems, ai?.problemsToCheck], ['Engine & reliability context', reliability, ai?.engineAndReliability ? [ai.engineAndReliability] : []]]) {
    if (sourced.length) sourced.slice(0, 2).forEach(c => add(c.text, topic, c));
    else (fallback || []).forEach(text => add(text, topic));
  }
  const { specs } = extractVehicleSpecs(car);
  const engineKnown = specs.fuelType.value === 'Electric' || specs.displacement.value != null && specs.cylinders.value != null;
  if (!engineKnown && (ai || claims.length)) add('Exact engine variant unresolved. Guidance stays at model level; confirm the engine before applying variant-specific reliability advice.', 'Engine scope', { sources: [] });
  return observations;
}
