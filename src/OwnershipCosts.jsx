import React from 'react';
import { resolveRunningCosts, runningScenario } from './ownership-calculator.js';
import { experienceLabel } from './vehicle-experience.js';
import { priceDisplay, vehicleName } from './vehicle-data.js';
import { OWNERSHIP_ASSUMPTIONS } from '../shared/ownership-estimates.js';

const money = amount => Number.isFinite(amount) ? `$${amount.toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD` : 'Incomplete';
export default function OwnershipCosts({ cars, scenario, ownership = {}, onAdjustFuel }) {
  return <section className="ownership-costs" aria-labelledby="ownership-costs-heading">
    <h2 id="ownership-costs-heading">Beyond the asking price</h2>
    <p className="ownership-scope">Affordability compares asking price (80%) and annual running expenses (20%). These planning estimates make the result provisional. Financing, purchase savings, taxes, depreciation and resale are outside this ranking.</p>
    <p>{OWNERSHIP_ASSUMPTIONS}</p>
    <div className="ownership-scenario"><p>{Number.isFinite(scenario.annualKm) ? `${scenario.annualKm.toLocaleString('en-CA')} km/year. ` : 'Check annual driving. '}{Number.isFinite(scenario.pricePerLitre) ? `$${scenario.pricePerLitre.toFixed(2)} CAD/L. ` : 'Check fuel price. '}Uses shared driving assumptions and your running-cost edits in Costs. Missing or invalid amounts are never zero; an incomplete running total excludes that factor for every contender.</p>{onAdjustFuel && <button type="button" className="text-button" onClick={onAdjustFuel}>Adjust fuel assumptions</button>}<a className="text-button" href="#ownership">Edit all running costs</a></div>
    <ul className="ownership-vehicles">{cars.map(car => {
      const overrides = ownership.vehicles?.[car.legacyItemId] || {};
      const r = resolveRunningCosts(car, runningScenario(scenario, ownership), overrides);
      return <li key={car.legacyItemId}><h3>{vehicleName(car)}</h3><dl className="ownership-facts">
        <div><dt>Asking price · seller</dt><dd>{priceDisplay(car)}</dd></div>
        <div><dt>Fuel / charging · annual</dt><dd>{money(r.energy)}<small>{r.inputs.energyOverride !== '' ? 'Your energy override' : experienceLabel(r.experience.energy)}</small></dd></div>
        <div><dt>Insurance · annual</dt><dd>{money(r.insurance)}<small>{Object.hasOwn(overrides, 'insuranceAnnual') ? 'Your estimate or quote' : r.estimates.insuranceAnnual.label}</small></dd></div>
        <div><dt>Maintenance, tyres & repairs · annual</dt><dd>{money(r.maintenance)}<small>{Object.hasOwn(overrides, 'maintenancePerKm') ? 'Your reserve per km × annual driving' : r.estimates.maintenancePerKm.label}</small></dd></div>
        <div><dt>Parking / tolls · annual</dt><dd>{money(r.parking == null ? null : r.parking * 12)}</dd></div>
        <div><dt>Other · annual</dt><dd>{money(r.other)}</dd></div>
        <div><dt>Annual running expenses</dt><dd>{money(r.annualRunning)}<small>{money(r.monthlyRunning)}/month average · running expenses only</small></dd></div>
      </dl></li>;
    })}</ul>
    <details className="ownership-checklist"><summary>What to confirm before buying</summary><p>Get insurance quotes for each exact vehicle with the same coverage and deductibles. Review service records, tyres, brakes and the manufacturer’s schedule, and arrange an independent inspection. Reserves are not repair forecasts. Confirm purchase taxes, fees and any financing separately.</p><p><a href="https://www.fsrao.ca/consumers/auto-insurance/understanding-auto-insurance-rates/your-average-premium" target="_blank" rel="noopener noreferrer">FSRA Ontario average-premium reference</a></p></details>
  </section>;
}
