import { INSURANCE_REFERENCE, resolveOwnershipEstimates } from './ownership-estimates.js';
import { OWNERSHIP_ASSUMPTIONS } from '../shared/ownership-estimates.js';
import React, { useId, useState } from 'react';
import WorkspaceHeading from './WorkspaceHeading.jsx';
import WorkspaceTabs, { WorkspacePanel } from './WorkspaceTabs.jsx';
import Icon from './Icons.jsx';
import { extractVehicleSpecs, listingSource, vehicleName, vehicleTrimLine } from './vehicle-data.js';
import { VehicleImage } from './VehicleComparison.jsx';
import { resolveVehicleExperience } from './vehicle-experience.js';
import SourceLinks from './SourceLinks.jsx';
import { SCENARIO_BOUNDS, validScenarioValue } from '../shared/experience.js';
import { OWNERSHIP_BOUNDS, ownershipNumber, ownershipInputs, calculateOwnership, assessOwnership } from './ownership-calculator.js';

const ONTARIO = 'https://www.ontario.ca/page/buy-or-sell-used-vehicle-ontario';
const money = value => Number.isFinite(value) ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value) : 'Incomplete';
const blank = value => value == null || String(value).trim() === '';

function EnergySources({ energy }) {
  return <details className="ownership-energy-sources"><summary>Automatic energy estimate sources</summary><p>{energy.rationale}</p>
    {Number.isFinite(energy.litresPer100Km) && <p>{energy.litresPer100Km.toLocaleString('en-CA')} L/100 km</p>}
    {Number.isFinite(energy.kwhPer100Km) && <p>{energy.kwhPer100Km.toLocaleString('en-CA')} kWh/100 km</p>}
    {(energy.assumptions || []).map(text => <p key={text}>{text}</p>)}
    <SourceLinks sources={energy.evidence} />
  </details>;
}

function EstimateDetails({ estimate, perKm = false }) {
  const amount = n => perKm ? `$${n.toFixed(3).replace(/0$/, '')}/km` : `${money(n)}/year`;
  return estimate.low != null ? <details className="ownership-estimate-details"><summary>Planning range &amp; assumptions</summary>
    <dl className="ownership-range">{[['Low', estimate.low], ['Central', estimate.central], ['High', estimate.high]].map(([label, n]) => <div key={label}><dt>{label}</dt><dd>{amount(n)}</dd></div>)}</dl>
    <p>Planning range from {new Date(estimate.checked).toLocaleDateString('en-CA')}. The calculator uses the central amount unless you edit it.</p>
    <p>{estimate.rationale}</p>{estimate.assumptions.map(text => <p key={text}>{text}</p>)}<p>{OWNERSHIP_ASSUMPTIONS}</p>
    {perKm && <p>Routine service, tyres and a repair reserve per kilometre. Annual reserve changes with your driving distance; this is not a repair forecast.</p>}
  </details> : <small>{perKm ? 'Generic $0.10/km allowance; not a forecast for this car.' : <>Ontario average, June 2026. <a href={INSURANCE_REFERENCE.url} target="_blank" rel="noopener noreferrer">FSRA</a></>}</small>;
}

function CostField({ name, label, context, value, onChange, hint, optional = false, bounds = OWNERSHIP_BOUNDS[name], error, step = '0.01', placeholder = optional ? 'Automatic' : undefined }) {
  const id = useId();
  const [min, max] = bounds;
  const parsed = blank(value) ? null : Number(value);
  const invalid = error || (!(optional && blank(value)) && (!Number.isFinite(parsed) || parsed < min || parsed > max || step === '1' && !Number.isInteger(parsed)));
  return <div className="ownership-field">
    <label htmlFor={id}>{label}{context && <span className="sr-only"> · {context}</span>}</label>
    <input id={id} data-field={name} type="number" inputMode={step === '1' ? 'numeric' : 'decimal'} min={min} max={max} step={step} value={value} placeholder={placeholder} aria-invalid={invalid ? true : undefined} aria-describedby={hint || invalid ? `${id}-help` : undefined} onChange={e => onChange(e.target.value)} />
    {(hint || invalid) && <small id={`${id}-help`} className={invalid ? 'ownership-error' : ''}>{invalid ? error || `Enter ${min.toLocaleString('en-CA')}–${max.toLocaleString('en-CA')}${step === '1' ? ' in whole numbers' : ''}.` : hint}</small>}
  </div>;
}

export default function OwnershipCalculator({ cars, topValue, valueProvisional, scenario, setScenario, state, setState, tab: suppliedTab, onTabChange }) {
  const [localTab, setLocalTab] = useState('summary');
  const tab = suppliedTab || localTab, setTab = onTabChange || setLocalTab;
  function openTab(next) {
    setTab(next);
    requestAnimationFrame(() => document.getElementById(`costs-tab-${next}`)?.focus());
  }
  const finance = state.method === 'finance';
  const update = (key, value) => setState(previous => ({ ...previous, [key]: value }));
  const updateCar = (id, key, value) => setState(previous => ({ ...previous, vehicles: { ...previous.vehicles, [id]: { ...previous.vehicles[id], [key]: value } } }));
  // Drafts contain only invalid edits; never calculate with a value the UI rejects.
  const energyScenario = { ...scenario, ...Object.fromEntries(Object.keys(state.energyDrafts).map(key => [key, NaN])) };
  const records = cars.map(car => {
    const inputs = ownershipInputs(car, state.vehicles[car.legacyItemId]);
    const experience = resolveVehicleExperience(car, energyScenario);
    const costs = calculateOwnership({ inputs, settings: state, annualKm: energyScenario.annualKm, annualEnergyCost: experience.energy.annualCost });
    return { car, inputs, experience, costs, estimates: resolveOwnershipEstimates(car), assessment: assessOwnership(costs.monthlyBudget, state) };
  });
  const settingField = (name, label, options = {}) => <CostField name={name} label={label} value={state[name]} onChange={value => update(name, value)} {...options} />;
  const carField = (record, name, label, hint, options = {}) => <CostField name={name} label={label} context={vehicleName(record.car)} value={record.inputs[name]} onChange={value => updateCar(record.car.legacyItemId, name, value)} hint={hint} {...options} />;
  const estimateField = (r, name, label, perKm = false) => {
    const edited = Object.hasOwn(state.vehicles[r.car.legacyItemId] || {}, name);
    return <>{carField(r, name, label, edited ? 'Your estimate or quote; automatic updates will not replace it.' : undefined, perKm ? { step: '0.001' } : {})}
      {edited && <button type="button" className="text-button ownership-reset" aria-label={`Reset ${perKm ? 'maintenance' : 'insurance'} to estimate for ${vehicleName(r.car)}`} onClick={() => setState(previous => {
        const overrides = { ...previous.vehicles[r.car.legacyItemId] }; delete overrides[name];
        return { ...previous, vehicles: { ...previous.vehicles, [r.car.legacyItemId]: overrides } };
      })}>Reset to estimate</button>}
      <EstimateDetails estimate={r.estimates[name]} perKm={perKm} /></>;
  };
  const energyField = (name, label, step = '0.01') => <CostField name={name} label={label} step={step} bounds={SCENARIO_BOUNDS[name]} value={state.energyDrafts[name] ?? scenario[name]} onChange={value => {
    const valid = !blank(value) && validScenarioValue(name, Number(value)) && (step !== '1' || Number.isInteger(Number(value)));
    setState(previous => {
      const energyDrafts = { ...previous.energyDrafts };
      if (valid) delete energyDrafts[name]; else energyDrafts[name] = value;
      return { ...previous, energyDrafts };
    });
    if (valid) setScenario(previous => ({ ...previous, [name]: Number(value) }));
  }} />;
  const value = (record, key) => <strong className="ownership-amount">{money(record.costs[key])}</strong>;
  const table = (id, rows) => <div className="ownership-table-scroll" role="region" aria-labelledby={id} tabIndex={0}>
    <table className="ownership-table" style={{ '--car-count': cars.length }}>
      <caption className="sr-only">{id === 'purchase-costs' ? 'Purchase costs' : 'Running costs'} in Canadian dollars for all shortlisted cars</caption>
      <thead><tr><th scope="col">Cost · CAD</th>{cars.map(car => <th scope="col" key={car.legacyItemId}>{vehicleName(car)}{car.demo && <small>Fictional listing</small>}</th>)}</tr></thead>
      <tbody>{rows.map(([label, render, total]) => <tr key={label} className={total ? 'ownership-total' : undefined}><th scope="row">{label}</th>{records.map(record => <td key={record.car.legacyItemId}>{render(record)}</td>)}</tr>)}</tbody>
    </table>
  </div>;
  const summaryRows = [
    [finance ? 'Down payment · upfront' : 'Cash needed · upfront', r => value(r, finance ? 'down' : 'acquisition')],
    ['Fuel / charging / year', r => <>{value(r, 'energy')}{r.inputs.energyOverride === '' && <SourceLinks sources={r.experience.energy.evidence} />}</>],
    ['Insurance / year', r => <>{value(r, 'insurance')}{!Object.hasOwn(state.vehicles[r.car.legacyItemId] || {}, 'insuranceAnnual') && <SourceLinks sources={[r.estimates.insuranceAnnual.source]} />}</>],
    ['Maintenance, tyres & repairs / year', r => value(r, 'maintenance')],
    [finance ? 'Running expenses / month' : 'Running expenses / year', r => value(r, finance ? 'monthlyRunning' : 'annualRunning')],
    ...(finance ? [['Loan payment / month', r => value(r, 'payment')]] : []),
    [finance ? 'Gross salary for comfortable loan + running costs' : 'Gross salary for comfortable running costs', r => <strong className="ownership-amount" data-summary-salary={r.car.legacyItemId}>{r.assessment.requiredSalary == null ? 'Incomplete' : `${money(Math.ceil(r.assessment.requiredSalary))}/year`}</strong>],
  ];
  const purchaseRows = [
    ['Purchase price', r => {
      const edited = Object.hasOwn(state.vehicles[r.car.legacyItemId] || {}, 'purchasePrice');
      return <>{carField(r, 'purchasePrice', 'Purchase price (CAD)', edited ? 'Your planning amount; original listing unchanged.' : r.costs.price == null ? 'Enter a CAD price; no currency conversion assumed.' : undefined)}{!edited && <SourceLinks sources={[listingSource(r.car)]} />}</>;
    }],
    ['Estimated purchase tax', r => <>{value(r, 'tax')}<small>{r.inputs.taxOverride === '' ? `${state.taxRate}% of purchase price` : 'Your tax amount override'}</small>{carField(r, 'taxOverride', 'Tax override (CAD)', 'Optional: blank uses the shared tax rate.', { optional: true })}</>],
    ['Purchase fees', r => carField(r, 'purchaseFees', 'Purchase fees (CAD)', Object.hasOwn(state.vehicles[r.car.legacyItemId] || {}, 'purchaseFees') ? 'Your estimate; confirm actual fees.' : 'Planning estimate; confirm registration, inspection and dealer fees.')],
    ['Total acquisition cost', r => value(r, 'acquisition'), true],
    ...(finance ? [
      ['Down payment · upfront', r => carField(r, 'downPayment', 'Down payment (CAD)', Object.hasOwn(state.vehicles[r.car.legacyItemId] || {}, 'downPayment') ? 'Your amount; funded separately from monthly costs.' : 'Starting assumption: 20% of purchase price.', { error: r.costs.acquisition != null && ownershipNumber(r.inputs.downPayment, 'downPayment') > r.costs.acquisition ? 'Down payment cannot exceed total acquisition cost.' : undefined })],
      ['Amount borrowed', r => <>{value(r, 'principal')}<small>Includes purchase tax and fees, less down payment.</small></>],
      ['Monthly loan payment', r => <>{value(r, 'payment')}<small>{state.apr}% annual interest · {state.termMonths} months · estimate, not a lender offer</small></>, true],
      ['Total loan interest', r => value(r, 'interest')],
      ['Total purchase repayment', r => <>{value(r, 'totalRepayment')}<small>Includes down payment, loan principal and interest. Running costs are separate.</small></>],
    ] : [['Cash needed to buy', r => <>{value(r, 'acquisition')}<small>Upfront purchase funding, separate from running expenses.</small></>]]),
  ];
  const runningRows = [
    ['Fuel / electricity · annual', r => <>{value(r, 'energy')}{carField(r, 'energyOverride', 'Annual energy override (CAD)', 'Optional: blank uses consumption and shared driving assumptions.', { optional: true })}<EnergySources energy={r.experience.energy} /></>],
    ['Insurance · annual', r => estimateField(r, 'insuranceAnnual', 'Annual insurance (CAD)')],
    ['Maintenance, tyres & repairs', r => <>{value(r, 'maintenance')}<small>Annual reserve at your driving distance</small>{estimateField(r, 'maintenancePerKm', 'Reserve (CAD/km)', true)}</>],
    ['Parking & tolls · monthly', r => carField(r, 'parkingMonthly', 'Monthly parking and tolls (CAD)', 'Starting assumption: $0. Enter your expected costs.')],
    ['Other running costs · annual', r => carField(r, 'otherAnnual', 'Other annual costs (CAD)', 'Starting assumption: $0. Include any recurring fees or other expenses.')],
    ['Annual running costs', r => value(r, 'annualRunning'), true],
    ['Monthly running average', r => <>{value(r, 'monthlyRunning')}<small>Running expenses only; excludes purchase savings and loan payments.</small></>, true],
  ];
  const rulesError = ownershipNumber(state.comfortablePercent, 'comfortablePercent') != null && ownershipNumber(state.stretchedPercent, 'stretchedPercent') != null && Number(state.stretchedPercent) <= Number(state.comfortablePercent) ? 'The stretched limit must be greater than the comfortable limit.' : undefined;
  const labels = finance ? { comfortable: 'Comfortable monthly budget', stretched: 'Stretched monthly budget', over: 'Monthly costs over budget' } : { comfortable: 'Comfortable running costs', stretched: 'Stretched running budget', over: 'Running costs over budget' };

  return <section className="page-section ownership-page">
    <WorkspaceHeading title="Cost of ownership" description="See what you need upfront and what you could spend each month.">
      <a className="back-link" href="#compare">Compare cars <Icon name="arrow" /></a>
    </WorkspaceHeading>
    {!cars.length ? <div className="empty-state"><h2>Add cars to compare their costs</h2><p>Import a listing or try the fictional demo to build your shortlist.</p><a className="primary-link" href="#import">Choose your cars <Icon name="arrow" /></a></div> : <>
      <div className="ownership-toolbar"><fieldset className="ownership-method"><legend>How will you buy?</legend><div>{[['cash', 'Cash'], ['finance', 'Finance']].map(([method, label]) => <button key={method} type="button" aria-pressed={state.method === method} onClick={() => update('method', method)}>{label}</button>)}</div></fieldset><p>Ontario starting scenario · CAD<br /><span>Every assumption is editable.</span></p></div>
      {cars.some(car => car.demo) && <p className="decision-demo-note">Fictional demo listings · These costs are planning estimates, not offers.</p>}
      <WorkspaceTabs id="costs" label="Cost views" tabs={[["summary", "Summary"], ["purchase", "Purchase"], ["running", "Running costs"], ["salary", "Salary guide"]]} value={tab} onChange={setTab} />
      <details className="ownership-assumptions"><summary>Adjust driving, tax{finance ? ' & financing' : ''} assumptions</summary><div className="ownership-fields">
        {energyField('annualKm', 'Annual driving (km)', '1')}{energyField('pricePerLitre', 'Fuel price (CAD/L)')}{energyField('pricePerKwh', 'Electricity price (CAD/kWh)')}{energyField('electricShare', 'Plug-in hybrid electric driving (%)', '1')}
        {settingField('taxRate', 'Estimated purchase tax (%)')}
        {finance && <>{settingField('apr', 'Annual loan interest (%)')}{settingField('termMonths', 'Loan term (months)', { step: '1' })}</>}
      </div><p>Valid driving and energy-price changes also apply in Compare and Recommendation. Prices are scenario assumptions, not live rates. Financing assumes fixed interest, monthly payments and purchase taxes and fees included in the loan.</p></details>

      <WorkspacePanel id="costs" value="summary" active={tab}>
        <section className="ownership-summary" aria-labelledby="cost-summary"><h2 id="cost-summary">Your costs at a glance</h2>
          <p>Planning estimates in CAD. Upfront funding is separate from monthly expenses.</p>
          <ul className="cost-vehicle-grid" role="list" style={{ '--car-count': cars.length }}>
            {records.map(record => {
              const { car, costs } = record;
              const recommended = car.legacyItemId === topValue;
              const trim = vehicleTrimLine(extractVehicleSpecs(car).specs);
              return <li className={`cost-vehicle${recommended ? ' cost-vehicle-recommended' : ''}`} key={car.legacyItemId}>
                <VehicleImage car={car} badge={recommended ? 'Best overall value' : undefined} />
                <div className="cost-vehicle-body">
                  <h3>{vehicleName(car)}</h3>
                  {trim && <p className="vehicle-trim">{trim}</p>}
                  <dl className="cost-vehicle-monthly" aria-live="polite" aria-atomic="true">
                    <dt>{finance ? 'Estimated monthly total · loan + running' : 'Estimated monthly total · running'}</dt>
                    <dd><span key={state.method} className="cost-vehicle-total">{money(costs.monthlyBudget)}</span>{costs.monthlyBudget != null && <span className="cost-vehicle-period">/mo</span>}</dd>
                  </dl>
                  <dl className="cost-vehicle-breakdown">
                    {summaryRows.map(([label, render]) => <div key={label}><dt>{label}</dt><dd>{render(record)}</dd></div>)}
                  </dl>
                </div>
              </li>;
            })}
          </ul>
          {topValue && <p className="ownership-note">The Best Value ranking considers asking price and vehicle capabilities.{valueProvisional && ' The ranking is provisional.'}</p>}
          <p className="ownership-note">Running expenses include fuel or charging, insurance, a maintenance and repair reserve, parking, and other costs. Cash purchase savings are excluded from the monthly budget.</p>
          <div className="cost-summary-actions"><button type="button" onClick={() => openTab('purchase')}>Edit purchase estimates</button><button type="button" className="text-button" onClick={() => openTab('running')}>Edit running costs</button><button type="button" className="text-button" onClick={() => openTab('salary')}>Check your salary</button></div>
          {records.some(r => r.costs.monthlyBudget == null) && <p role="status" className="ownership-error">Incomplete totals need attention. Check Purchase, Running costs, and the shared assumptions above. Missing amounts never count as zero.</p>}
        </section>
      </WorkspacePanel>
      <WorkspacePanel id="costs" value="purchase" active={tab}>
      <section className="ownership-section" aria-labelledby="purchase-costs"><h2 id="purchase-costs">Purchase costs</h2><p>Start with the seller’s price, then adjust your acquisition estimates. Ontario private-sale tax may use wholesale value instead of purchase price; use a tax override when needed. <a href={ONTARIO} target="_blank" rel="noopener noreferrer">Ontario tax guidance</a>.</p>
        {table('purchase-costs', purchaseRows)}
        {!finance && <details className="ownership-assumptions ownership-savings"><summary>Save toward this purchase</summary><p>This is a future purchase savings goal, not an expense after buying with cash. It is excluded from running totals and the salary assessment.</p>{settingField('savingsMonths', 'Savings period (months)', { step: '1' })}<dl>{records.map(r => <div key={r.car.legacyItemId}><dt>{vehicleName(r.car)}</dt><dd>{money(r.costs.savingsTarget)}<small>per month toward {money(r.costs.acquisition)} upfront</small></dd></div>)}</dl></details>}
      </section>
      </WorkspacePanel>
      <WorkspacePanel id="costs" value="running" active={tab}>
      <section className="ownership-section" aria-labelledby="running-costs"><h2 id="running-costs">Running costs</h2><p>These are editable estimates, not guaranteed bills. Insurance depends on the driver and coverage; maintenance and repairs depend on condition and use. Totals include your repair reserve.</p>{table('running-costs', runningRows)}<p className="ownership-note">“Incomplete” means a required amount or driving assumption needs attention. Missing costs never count as zero. Resale value and depreciation are not modeled.</p></section>

      </WorkspacePanel>
      <WorkspacePanel id="costs" value="salary" active={tab}>
      <section className="ownership-section ownership-salary" aria-labelledby="salary-heading"><h2 id="salary-heading">How does it fit your salary?</h2><p>{finance ? 'Compare loan payments plus running expenses with your estimated take-home pay. Your down payment needs separate savings.' : 'Check whether your income covers running expenses. Buying with cash still requires the full purchase amount in separate savings.'} This income-based guide excludes housing, debt and other household commitments.</p>
        <div className="ownership-fields ownership-income">{settingField('salary', 'Your gross yearly salary (CAD)', { optional: blank(state.salary), placeholder: 'Enter yearly salary', hint: 'Optional. Stays in memory in this browser; not saved or sent.' })}{settingField('takeHomePercent', 'Estimated take-home pay (%)', { hint: '70% is a starting assumption, not a tax calculation.' })}</div>
        <details className="ownership-assumptions"><summary>Adjust the salary guide</summary><div className="ownership-fields">{settingField('comfortablePercent', 'Comfortable limit (% of take-home)')}{settingField('stretchedPercent', 'Stretched limit (% of take-home)', { error: rulesError })}</div><p>Comfortable: up to {state.comfortablePercent}% of take-home pay. Stretched: above {state.comfortablePercent}% through {state.stretchedPercent}%. Over budget: above {state.stretchedPercent}%. These are editable budgeting rules, not a lending assessment.</p></details>
        <ul className="ownership-results" aria-label="Salary guide for each car" aria-live="polite" aria-atomic="false">{records.map(({ car, costs, assessment: a }) => <li key={car.legacyItemId}>
          <div><h3>{vehicleName(car)}</h3><p className="ownership-result-status">{a.status === 'incomplete' ? 'Complete the estimates to assess this car' : a.status === 'no-salary' ? 'Enter your salary to see your situation' : labels[a.status]}</p></div>
          <dl><div><dt>{finance ? 'Loan + running costs / month' : 'Running costs / month'}</dt><dd>{money(costs.monthlyBudget)}</dd></div><div><dt>{finance ? 'Gross salary for comfortable loan + running costs' : 'Gross salary for comfortable running costs'}</dt><dd>{a.requiredSalary == null ? 'Incomplete' : `${money(Math.ceil(a.requiredSalary))}/year`}<small>Using your take-home and budget assumptions</small></dd></div><div><dt>{finance ? 'Down payment needed separately' : 'Cash purchase needed separately'}</dt><dd>{money(finance ? costs.down : costs.acquisition)}</dd></div></dl>
          {a.share != null && <p className="ownership-personal">{a.share.toFixed(1)}% of estimated take-home pay · {money(Math.abs(a.margin))}/month {a.margin >= 0 ? 'below' : 'above'} your comfortable limit.</p>}
          {!finance && <p className="ownership-note">This result covers running costs. It does not establish whether your purchase savings are sufficient.</p>}
        </li>)}</ul>
      </section>
      </WorkspacePanel>
    </>}
  </section>;
}
