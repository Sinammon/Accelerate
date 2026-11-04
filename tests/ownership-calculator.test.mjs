import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnershipState, ownershipInputs, ownershipNumber, monthlyLoanPayment, calculateOwnership, assessOwnership } from '../src/ownership-calculator.js';

const car = { legacyItemId: 'cost-test', priceCAD: { value: '20,000', currency: 'CAD' } };
const calculate = (overrides = {}, settings = {}, annualEnergyCost = 1530, annualKm = 15000) => calculateOwnership({
  inputs: ownershipInputs(car, overrides), settings: { ...createOwnershipState(), ...settings }, annualEnergyCost, annualKm,
});
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);

test('cash defaults separate acquisition, running costs and a future savings target without mutating inputs', () => {
  const settings = createOwnershipState(), inputs = ownershipInputs(car);
  const before = structuredClone({ car, inputs, settings });
  const costs = calculateOwnership({ inputs, settings, annualKm: 15000, annualEnergyCost: 1530 });
  assert.equal(settings.method, 'cash');
  assert.equal(costs.tax, 2600);
  assert.equal(costs.acquisition, 23100);
  assert.equal(costs.annualRunning, 5248);
  close(costs.monthlyRunning, 5248 / 12);
  assert.equal(costs.monthlyBudget, costs.monthlyRunning);
  assert.equal(costs.savingsTarget, 385);
  assert.equal(calculate({}, { savingsMonths: '12' }).monthlyBudget, costs.monthlyBudget);
  assert.deepEqual({ car, inputs, settings }, before);
});

test('finance totals count principal, taxes and interest once and keep down payment separate', () => {
  const costs = calculate({ parkingMonthly: '100', otherAnnual: '200' }, { method: 'finance' });
  assert.equal(costs.down, 4000);
  assert.equal(costs.principal, 19100);
  assert.equal(costs.annualRunning, 6648);
  close(costs.monthlyBudget, costs.monthlyRunning + costs.payment);
  close(costs.totalRepayment, costs.down + costs.payment * 60);
  close(costs.totalRepayment, costs.acquisition + costs.interest);
  close(monthlyLoanPayment(10000, 12, 12), 888.487886783416);
  close(monthlyLoanPayment(10000, 0, 60), 10000 / 60);
  assert.equal(monthlyLoanPayment(0, 8, 60), 0);
  assert.equal(monthlyLoanPayment(10, NaN, 60), null);
  assert.equal(monthlyLoanPayment(10, 8, 0), null);
  const funded = calculate({ downPayment: '23100' }, { method: 'finance' });
  assert.equal(funded.payment, 0);
  assert.equal(funded.interest, 0);
  assert.equal(funded.monthlyBudget, funded.monthlyRunning);
});

test('tax and energy overrides replace automatic calculations and distance scales reserves', () => {
  const costs = calculate({ taxOverride: '3000', energyOverride: '1000' }, { taxRate: '' }, null, 20000);
  assert.equal(costs.tax, 3000);
  assert.equal(costs.acquisition, 23500);
  assert.equal(costs.energy, 1000);
  assert.equal(costs.maintenance, 2000);
  assert.equal(costs.annualRunning, 5218);
  assert.equal(calculate({ taxOverride: '0', energyOverride: '0', maintenancePerKm: '0', insuranceAnnual: '0' }).annualRunning, 0);
});

test('missing, invalid and non-CAD amounts stay incomplete rather than becoming zero', () => {
  for (const key of ['purchasePrice', 'purchaseFees', 'insuranceAnnual', 'maintenancePerKm', 'parkingMonthly', 'otherAnnual']) {
    for (const invalid of ['', '-1', 'NaN', 'Infinity', '1e20']) assert.equal(calculate({ [key]: invalid }).monthlyBudget, null, `${key}=${invalid}`);
  }
  assert.equal(calculate({}, { taxRate: '' }).monthlyBudget, null);
  assert.equal(calculate({}, {}, null).monthlyBudget, null);
  assert.equal(calculate({}, {}, Infinity).monthlyBudget, null);
  assert.equal(calculate({}, {}, 100, NaN).monthlyBudget, null);
  assert.equal(calculate({ downPayment: '23101' }, { method: 'finance' }).monthlyBudget, null);
  for (const settings of [{ apr: '' }, { termMonths: '0' }, { termMonths: '1.5' }]) assert.equal(calculate({}, { method: 'finance', ...settings }).monthlyBudget, null);
  assert.equal(calculate({}, { savingsMonths: '' }).monthlyBudget, 5248 / 12, 'savings errors do not contaminate running affordability');
  assert.equal(calculate({}, { savingsMonths: '' }).savingsTarget, null);
  assert.equal(ownershipInputs({ priceCAD: { value: '10000', currency: 'USD' } }).purchasePrice, '');
  assert.equal(ownershipInputs({ returnedPrice: { value: '10000', currency: 'USD' } }).purchasePrice, '');
  assert.equal(ownershipNumber('1e3', 'purchasePrice'), 1000);
  assert.equal(ownershipNumber(true, 'purchasePrice'), null);
});

test('salary guide uses gross-to-net assumptions, exact inclusive limits and meaningful incomplete states', () => {
  const settings = { ...createOwnershipState(), salary: '120000', takeHomePercent: '80' };
  const comfortable = assessOwnership(1200, settings);
  assert.equal(comfortable.monthlyTakeHome, 8000);
  assert.equal(comfortable.requiredSalary, 120000);
  assert.equal(comfortable.share, 15);
  assert.equal(comfortable.margin, 0);
  assert.equal(comfortable.status, 'comfortable');
  assert.equal(assessOwnership(1200.01, settings).status, 'stretched');
  assert.equal(assessOwnership(1600, settings).status, 'stretched');
  assert.equal(assessOwnership(1600.01, settings).status, 'over');
  assert.equal(assessOwnership(0, settings).status, 'comfortable');
  assert.equal(assessOwnership(1200, { ...settings, salary: '' }).status, 'no-salary');
  assert.equal(assessOwnership(1200, { ...settings, salary: '0' }).status, 'no-salary');
  for (const invalid of [{ takeHomePercent: '' }, { comfortablePercent: '0' }, { stretchedPercent: '15' }, { comfortablePercent: '21' }]) {
    assert.equal(assessOwnership(1200, { ...settings, ...invalid }).status, 'incomplete');
  }
  for (const budget of [null, NaN, Infinity, -1]) assert.equal(assessOwnership(budget, settings).status, 'incomplete');
});
