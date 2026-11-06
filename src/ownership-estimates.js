import { extractVehicleSpecs } from './vehicle-specs.js';
import { ownershipScope, validatedOwnershipEstimates, validatedModelAdvice } from '../shared/ownership-estimates.js';

export function ownershipModelData(car, now = Date.now()) {
  const { specs } = extractVehicleSpecs({ ...car, enrichment: { ...car.enrichment, modelSpecs: undefined, catalog: undefined } });
  const input = ownershipScope(Object.fromEntries(Object.entries(specs).filter(([, spec]) => spec?.value != null && spec.status !== 'conflict').map(([name, spec]) => [name, spec.value])));
  if (Object.values(specs).some(spec => spec?.status === 'conflict')) return {};
  return { estimates: validatedOwnershipEstimates(car.enrichment?.modelSpecs?.ownershipEstimates, input, now), advice: validatedModelAdvice(car.enrichment?.modelSpecs?.modelAdvice, input, now) };
}
export function resolveOwnershipEstimates(car, now = Date.now()) {
  const { estimates } = ownershipModelData(car, now);
  return {
    insuranceAnnual: estimates?.insuranceAnnual ? { ...estimates.insuranceAnnual, label: 'AI model estimate · not a quote', estimated: true } : { central: 2218, label: 'Generic Ontario average · June 2026 · not car-specific', estimated: true },
    maintenancePerKm: estimates?.maintenancePerKm ? { ...estimates.maintenancePerKm, label: 'AI maintenance/tyres/repair reserve', estimated: true } : { central: 0.10, label: 'Generic planning allowance · not car-specific', estimated: true },
  };
}
