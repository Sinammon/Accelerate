import React from 'react';
import { annualFuelCost } from './fuel-data.js';
import { priceDisplay, vehicleName } from './vehicle-data.js';
import { ResearchClaim } from './ModelResearch.jsx';

const money = amount => `$${amount.toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD`;
const budgetFactors = [
  ['Insurance', 'Get a quote for each exact vehicle using the same coverage and deductible. Premiums depend on the vehicle, where you live, your driving record and how you use the car.'],
  ['Servicing, tyres and repairs', 'Check the service history and maintenance schedule. Budget for routine servicing, tyres and brakes, plus a reserve for unexpected repairs. Get an inspection and quotes for disclosed problems.'],
  ['Taxes and purchase fees', 'Check the taxes, registration, inspection, dealer and import charges that apply to your purchase and where you will register the car. These are extra to the asking price.'],
  ['Financing', 'If borrowing, compare the interest rate, loan term, fees and total repayment. A smaller monthly payment can still mean paying more overall.'],
  ['Parking and charging', 'Include parking, permits and tolls for your routine. For an EV or plug-in hybrid, consider electricity, public charging and any home-charger installation you would need.'],
  ['Depreciation and resale', 'Consider how long you will keep the car and its uncertain resale value. Count purchase price minus resale value, or depreciation, once when estimating ownership cost.'],
];

export default function OwnershipCosts({ cars, scenario, research = [], onAdjustFuel }) {
  const validScenario = Number.isFinite(scenario.annualKm) && scenario.annualKm >= 1 && scenario.annualKm <= 200000 && Number.isFinite(scenario.pricePerLitre) && scenario.pricePerLitre >= 0.01 && scenario.pricePerLitre <= 10;
  return <section className="ownership-costs" aria-labelledby="ownership-costs-heading">
    <h2 id="ownership-costs-heading">Beyond the asking price</h2>
    <p>A cheaper listing can cost more to own. Get an insurance quote and budget for servicing, repairs, taxes, financing and resale value before choosing.</p>
    <p className="ownership-scope"><strong>What this score includes:</strong> asking price and comparable fuel scenarios. Insurance and the other ownership costs below are not estimated or included in the ranking, so this result does not establish the cheapest car to own.</p>
    <div className="ownership-scenario"><p>{validScenario ? `Fuel estimates use ${scenario.annualKm.toLocaleString('en-CA')} km/year and $${scenario.pricePerLitre.toFixed(2)} CAD/L. The monthly figure is an annual average for fuel only.` : 'Enter annual driving from 1 to 200,000 km and a fuel price from $0.01 to $10 CAD/L to calculate a fuel scenario.'}</p>{onAdjustFuel && <button type="button" className="text-button" onClick={onAdjustFuel}>Adjust fuel assumptions</button>}</div>
    <ul className="ownership-vehicles">{cars.map(car => {
      const calculatedFuel = validScenario ? annualFuelCost(car.enrichment?.fuel, scenario) : null;
      const fuel = Number.isFinite(calculatedFuel) ? calculatedFuel : null;
      const notes = research.find(entry => entry.car === car)?.guidance?.claims || [];
      return <li key={car.legacyItemId}>
        <h3>{vehicleName(car)}</h3>
        <dl className="ownership-facts">
          <div><dt>Asking price · seller</dt><dd>{priceDisplay(car)}</dd></div>
          <div><dt>Fuel only · scenario estimate</dt><dd>{fuel == null ? 'Estimate unavailable' : <>{money(fuel)}/year<small>{money(fuel / 12)}/month average · NRCan reference</small></>}</dd></div>
          <div><dt>Insurance</dt><dd>Personal quote needed<small>No premium has been estimated.</small></dd></div>
        </dl>
        {fuel == null && <p className="ownership-note">Fuel or charging costs still need supported consumption data and valid driving and price assumptions. Unavailable costs are not zero.</p>}
        {!!notes.length && <details className="ownership-model-notes"><summary>Model-specific ownership notes</summary><p>Source-backed model context, not a repair quote or a check of this car’s condition.</p>{notes.slice(0, 2).map(claim => <ResearchClaim key={claim.id} claim={claim} />)}</details>}
      </li>;
    })}</ul>
    <details className="ownership-checklist"><summary>Insurance, repairs and other costs to budget for</summary><dl>{budgetFactors.map(([label, description]) => <div key={label}><dt>{label}</dt><dd>{description}</dd></div>)}</dl><p className="ownership-guides">Further guidance: <a href="https://www.fsrao.ca/consumers/auto-insurance/understanding-auto-insurance-rates/what-determines-your-auto-insurance-rate" target="_blank" rel="noopener noreferrer">Ontario insurance factors · FSRA</a>, <a href="https://carcosts.caa.ca/" target="_blank" rel="noopener noreferrer">ownership-cost calculator · CAA</a>, and <a href="https://www.canada.ca/en/financial-consumer-agency/services/loans/financing-car/shop-around.html" target="_blank" rel="noopener noreferrer">comparing car financing · FCAC</a>.</p></details>
  </section>;
}
