export const ESSENTIAL_SPEC_FIELDS = ['displacement', 'cylinders', 'engineType', 'horsepower', 'torque', 'curbWeightKg', 'transmission', 'transmissionSpeeds', 'drivetrain', 'fuelType', 'bodyType', 'seats'];
export function inapplicableSpec(field, specs) {
  if (['displacement', 'cylinders'].includes(field) && specs.fuelType?.value === 'Electric') return 'Battery-electric vehicles have no combustion engine.';
  if (field === 'transmissionSpeeds' && specs.transmission?.value === 'CVT') return 'CVTs have no fixed gear count.';
  return null;
}
