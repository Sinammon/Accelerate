import { OWNERSHIP_VERSION, OWNERSHIP_SCENARIO_ID, ownershipYear } from '../../shared/ownership-estimates.js';
export const ownershipInput = { year: 2018, make: 'Example', model: 'Tourer', fields: [] };
export function planningData(input = ownershipInput, { insurance = 2600, maintenance = .14, now = Date.now() } = {}) {
  const checked = new Date(now).toISOString();
  const meta = { version: OWNERSHIP_VERSION, scenarioId: OWNERSHIP_SCENARIO_ID, region: 'ON', currency: 'CAD', referenceYear: ownershipYear(now), scope: Object.fromEntries(Object.entries(input).filter(([k]) => k !== 'fields')) };
  return { status: 'partial', fields: {}, ownershipEstimates: { ...meta,
    insuranceAnnual: { unit: 'CAD/year', low: insurance * .7, central: insurance, high: insurance * 1.5, checked, rationale: 'Synthetic vehicle-class planning fixture, not a real premium.', assumptions: ['Experienced driver, personal use, clean record.'] },
    maintenancePerKm: { unit: 'CAD/km', low: maintenance * .7, central: maintenance, high: maintenance * 1.5, checked, rationale: 'Synthetic routine service, tyre and repair reserve for testing.', assumptions: ['Reference driving of 15,000 km per year.'] } },
    modelAdvice: { ...meta, checked, overview: 'This model can suit a shopper who values a relaxed daily drive.', benefits: ['The useful load area can make everyday errands easier.'],
      problemsToCheck: ['Inspect service records and check for cooling-system leaks.'], engineAndReliability: 'Engine durability depends on the exact variant and documented servicing; arrange a mechanical inspection.' } };
}
export function ownershipCar(id = 'a', options = {}) {
  return { legacyItemId: id, year: '2018', make: 'Example', model: 'Tourer', description: '2.0 L 4-cylinder engine.', priceCAD: { value: '20000', currency: 'CAD' },
    enrichment: { fuel: { status: 'matched', combined: 6 }, modelSpecs: planningData(ownershipInput, options) } };
}
