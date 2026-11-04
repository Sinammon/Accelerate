import { numeric } from './vehicle-data.js';

export const OWNERSHIP_DEFAULTS = Object.freeze({
  method: 'cash', salary: '', takeHomePercent: '70', comfortablePercent: '15', stretchedPercent: '20',
  taxRate: '13', apr: '8', termMonths: '60', savingsMonths: '60',
});
export const OWNERSHIP_BOUNDS = {
  purchasePrice: [0, 1e9], taxOverride: [0, 1e9], purchaseFees: [0, 1e9], downPayment: [0, 1e9],
  insuranceAnnual: [0, 1e9], maintenancePerKm: [0, 100], parkingMonthly: [0, 1e9], otherAnnual: [0, 1e9], energyOverride: [0, 1e9],
  salary: [0.01, 1e9], takeHomePercent: [0.01, 100], comfortablePercent: [0.01, 100], stretchedPercent: [0.01, 100],
  taxRate: [0, 100], apr: [0, 100], termMonths: [1, 120], savingsMonths: [1, 600],
};
export const createOwnershipState = () => ({ ...OWNERSHIP_DEFAULTS, vehicles: {}, energyDrafts: {} });

export function ownershipNumber(value, key) {
  if (value == null || typeof value === 'string' && !value.trim()) return null;
  const n = typeof value === 'number' ? value : typeof value === 'string' && /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()) ? Number(value) : null;
  const [min, max] = OWNERSHIP_BOUNDS[key];
  return Number.isFinite(n) && n >= min && n <= max && (!['termMonths', 'savingsMonths'].includes(key) || Number.isInteger(n)) ? n : null;
}

export function ownershipInputs(car, overrides = {}) {
  const price = car.priceCAD?.currency === 'CAD' ? numeric(car.priceCAD.value) : null;
  const purchasePrice = overrides.purchasePrice ?? (price == null ? '' : String(price));
  const parsedPrice = ownershipNumber(purchasePrice, 'purchasePrice');
  return { purchasePrice, taxOverride: '', purchaseFees: '500',
    downPayment: parsedPrice == null ? '' : String(Math.round(parsedPrice * 20) / 100),
    insuranceAnnual: '2218', maintenancePerKm: '0.10', parkingMonthly: '0', otherAnnual: '0', energyOverride: '', ...overrides };
}

export function monthlyLoanPayment(principal, apr, months) {
  if (![principal, apr, months].every(Number.isFinite) || principal < 0 || apr < 0 || months <= 0 || !Number.isInteger(months)) return null;
  if (principal === 0) return 0;
  if (apr === 0) return principal / months;
  const r = apr / 1200;
  const payment = principal * r / -Math.expm1(-months * Math.log1p(r));
  return Number.isFinite(payment) ? payment : null;
}

export function calculateOwnership({ inputs, settings, annualKm, annualEnergyCost }) {
  const value = key => ownershipNumber(inputs[key], key);
  const price = value('purchasePrice'), fees = value('purchaseFees');
  const rate = ownershipNumber(settings.taxRate, 'taxRate');
  const tax = inputs.taxOverride === '' ? price != null && rate != null ? price * rate / 100 : null : value('taxOverride');
  const acquisition = [price, fees, tax].every(n => n != null) ? price + fees + tax : null;
  const suppliedDown = value('downPayment');
  const down = acquisition != null && suppliedDown != null && suppliedDown <= acquisition ? suppliedDown : null;
  const principal = down != null ? acquisition - down : null;
  const apr = ownershipNumber(settings.apr, 'apr'), months = ownershipNumber(settings.termMonths, 'termMonths');
  const payment = principal != null && apr != null && months != null ? monthlyLoanPayment(principal, apr, months) : null;
  const interest = payment == null ? null : Math.max(0, payment * months - principal);
  const energy = inputs.energyOverride === '' ? Number.isFinite(annualEnergyCost) && annualEnergyCost >= 0 ? annualEnergyCost : null : value('energyOverride');
  const maintenanceRate = value('maintenancePerKm');
  const maintenance = maintenanceRate != null && Number.isFinite(annualKm) && annualKm >= 1 && annualKm <= 200000 ? maintenanceRate * annualKm : null;
  const insurance = value('insuranceAnnual'), parking = value('parkingMonthly'), other = value('otherAnnual');
  const annualRunning = [energy, maintenance, insurance, parking, other].every(n => n != null) ? energy + maintenance + insurance + parking * 12 + other : null;
  const monthlyRunning = annualRunning == null ? null : annualRunning / 12;
  const savingsMonths = ownershipNumber(settings.savingsMonths, 'savingsMonths');
  const savingsTarget = acquisition != null && savingsMonths != null ? acquisition / savingsMonths : null;
  const monthlyBudget = acquisition == null || monthlyRunning == null ? null : settings.method === 'cash' ? monthlyRunning : payment == null ? null : monthlyRunning + payment;
  return { price, fees, tax, acquisition, down, principal, payment, interest,
    totalRepayment: interest != null && acquisition != null ? acquisition + interest : null,
    energy, maintenance, insurance, parking, other, annualRunning, monthlyRunning, monthlyBudget, savingsTarget };
}

export function assessOwnership(monthlyBudget, settings) {
  const takeHome = ownershipNumber(settings.takeHomePercent, 'takeHomePercent');
  const comfortable = ownershipNumber(settings.comfortablePercent, 'comfortablePercent');
  const stretched = ownershipNumber(settings.stretchedPercent, 'stretchedPercent');
  const validRules = takeHome != null && comfortable != null && stretched != null && stretched > comfortable;
  if (!validRules || !Number.isFinite(monthlyBudget) || monthlyBudget < 0) return { requiredSalary: null, status: 'incomplete' };
  const requiredSalary = monthlyBudget * 12 / (takeHome / 100) / (comfortable / 100);
  const salary = ownershipNumber(settings.salary, 'salary');
  if (salary == null) return { requiredSalary, status: 'no-salary' };
  const monthlyTakeHome = salary * takeHome / 100 / 12;
  const share = monthlyBudget / monthlyTakeHome * 100;
  // Compare money amounts so values at the exact percentage boundary stay inclusive.
  const comfortableBudget = monthlyTakeHome * comfortable / 100;
  const stretchedBudget = monthlyTakeHome * stretched / 100;
  const within = budget => monthlyBudget <= budget + Number.EPSILON * Math.max(monthlyBudget, budget, 1) * 4;
  return { requiredSalary, monthlyTakeHome, share, margin: comfortableBudget - monthlyBudget,
    status: within(comfortableBudget) ? 'comfortable' : within(stretchedBudget) ? 'stretched' : 'over' };
}
