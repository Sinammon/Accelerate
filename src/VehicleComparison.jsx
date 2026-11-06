import React, { useEffect, useRef, useState } from 'react';
import { unknown, vehicleName, safeUrl, mileageDisplay, priceDisplay, resolveMileage } from './vehicle-data.js';
import { m, useReducedMotion } from 'motion/react';
import { emptyComparisonView, reconcileComparisonView } from './comparison-view.js';
import { extractVehicleSpecs, FIELD_LABELS } from './vehicle-specs.js';
import { SpecValue } from './VehicleEvidence.jsx';
import VehicleSummary from './VehicleSummary.jsx';
import Icon from './Icons.jsx';
import { detectWarnings } from './decision-engine.js';
import { resolveVehicleExperience, experienceLabel, DEFAULT_SCENARIO } from './vehicle-experience.js';
import { ExperienceCost, ComfortDetail, PracticalitySummary, ExperienceAssumptions, COMFORT_TOPICS } from './VehicleExperience.jsx';
import ScenarioFields from './ScenarioFields.jsx';
import WorkspaceHeading from './WorkspaceHeading.jsx';

export function vehicleImageUrl(car, index = 0) {
  const value = (car.images || [])[index];
  return safeUrl(value) || (car.demo === true && /^\/images\/preview\/(civic|corolla|mazda3|jetta)\.jpg$/.test(value) ? value : null);
}
export function VehicleImage({ car }) {
  const [index, setIndex] = useState(0);
  const images = car.images || [];
  const url = vehicleImageUrl(car, index);
  return <div className="vehicle-image">{url ? <img src={url} alt={car.demo ? `${car.make} ${car.model} model-example photo; fictional vehicle details` : vehicleName(car)} referrerPolicy="no-referrer" onError={() => setIndex(i => i + 1)} /> : <div className="image-placeholder"><Icon name="engine" size={32} />Image unavailable</div>}
    <span className="source-pill">{car.demo ? 'Model photo · fictional details' : 'Seller listing · eBay'}</span>
    {images.length > 1 && url && <button className="photo-next" aria-label={`Next photo of ${vehicleName(car)}`} onClick={() => setIndex(i => (i + 1) % images.length)}><Icon name="chevron" size={20} /></button>}
  </div>;
}
export const locationDisplay = car => [car.location?.city, car.location?.stateOrProvince, car.location?.postalCode, car.location?.country].filter(Boolean).join(', ') || 'Unknown';
export function ListingLink({ car }) {
  if (car.demo) return <span className="car-meta">Fictional demo · not an eBay listing</span>;
  const url = safeUrl(car.sourceUrl);
  return url ? <a className="source-link" href={url} target="_blank" rel="noopener noreferrer">Original eBay listing ↗</a> : <span className="car-meta">Listing link unknown</span>;
}
function ComparisonWarnings({ car }) {
  const warnings = detectWarnings(car);
  return warnings.length > 0 && <div className="warning-details" role="note"><strong>Review before choosing</strong>{warnings.map((warning, index) => <p key={index}>{warning.label}: {warning.evidence}</p>)}</div>;
}
const TABS = [['overview', 'Overview'], ['specifications', 'Specifications'], ['sources', 'Sources & checks']];
const KEY_FIELDS = ['transmission', 'transmissionSpeeds', 'displacement', 'engineType', 'induction', 'cylinders', 'horsepower', 'torque', 'curbWeightKg', 'zeroTo100KphSeconds', 'zeroTo60MphSeconds', 'drivetrain', 'fuelType', 'bodyType', 'seats'];

export default function VehicleComparison({ cars, clearCars, importForm, navigate, retryResearch, clearSavedSpecs, onSaveDetails, view: suppliedView, onViewChange, notice, scenario: suppliedScenario, setScenario: suppliedSetScenario }) {
  const [localScenario, setLocalScenario] = useState(DEFAULT_SCENARIO);
  const scenario = suppliedScenario || localScenario, setScenario = suppliedSetScenario || setLocalScenario;
  const [localView, setLocalView] = useState(emptyComparisonView);
  const view = reconcileComparisonView(suppliedView || localView, cars);
  const changeView = onViewChange || setLocalView;
  const [focusRequest, setFocusRequest] = useState(null);
  const reduced = useReducedMotion();
  const evidenceRegion = useRef(null), tabRegion = useRef(null);
  const previousIds = useRef(cars.map(car => car.legacyItemId));
  const shortlistKey = cars.map(car => car.legacyItemId).join('|');
  useEffect(() => {
    const ids = cars.map(car => car.legacyItemId);
    const addedId = ids.find(id => !previousIds.current.includes(id));
    if (addedId) {
      const frame = requestAnimationFrame(() => {
        const card = [...document.querySelectorAll('.car-card')].find(element => element.dataset.carId === addedId);
        card?.focus({ preventScroll: true });
        card?.scrollIntoView?.({ block: 'nearest', behavior: reduced ? 'instant' : 'smooth' });
      });
      previousIds.current = ids;
      return () => cancelAnimationFrame(frame);
    }
    previousIds.current = ids;
  }, [shortlistKey, reduced]);
  useEffect(() => {
    if (!focusRequest || view.tab !== 'sources') return;
    const target = evidenceRegion.current?.querySelector('.vehicle-summary');
    if (!target) return;
    if (focusRequest.research) {
      const research = target.querySelector('.model-research');
      if (research) research.open = true;
    }
    const details = target.querySelector('.vehicle-evidence');
    if (details) details.open = true;
    target.focus({ preventScroll: true });
    target.scrollIntoView?.({ block: 'start', behavior: reduced ? 'instant' : 'smooth' });
  }, [focusRequest, view.tab, view.sourceId, reduced]);
  function showSources(car, research = false) {
    changeView({ ...view, tab: 'sources', sourceId: car.legacyItemId });
    setFocusRequest({ research });
  }
  function selectTab(tab, focus = false) {
    setFocusRequest(null);
    changeView({ ...view, tab });
    if (focus) tabRegion.current?.querySelector(`#compare-tab-${tab}`)?.focus();
  }
  function tabKey(event, index) {
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : offset ? (index + offset + TABS.length) % TABS.length : null;
    if (next != null) { event.preventDefault(); selectTab(TABS[next][0], true); }
  }
  function selectPair(index, id) {
    const pair = [...view.pair];
    const old = pair[index], other = index === 0 ? 1 : 0;
    if (pair[other] === id) pair[other] = old;
    pair[index] = id;
    changeView({ ...view, pair });
  }
  const records = new Map(cars.map(car => [car, extractVehicleSpecs(car)]));
  const sourceCar = cars.find(car => car.legacyItemId === view.sourceId) || cars[0];
  const cellClass = car => view.pair.includes(car.legacyItemId) ? `pair-visible pair-${view.pair.indexOf(car.legacyItemId)}` : 'pair-hidden';
  const spec = (car, key, compact = false) => <SpecValue spec={records.get(car).specs[key]} compact={compact} onViewEvidence={compact ? () => showSources(car) : undefined} />;
  const sharedGaps = KEY_FIELDS.filter(key => cars.every(car => records.get(car).specs[key].status === 'unknown'));
  const hasEnergy = car => car.enrichment?.fuel?.status === 'matched' || car.enrichment?.catalog?.energy;
  const fuelRow = ['Fuel / energy use', car => car.enrichment?.fuel?.status === 'matched' ? `${car.enrichment.fuel.combined.toFixed(1)} L/100 km - NRCan reference` : car.enrichment?.catalog?.energy ? `${car.enrichment.catalog.energy.value.toFixed(1)} ${car.enrichment.catalog.energy.unit} - ${car.enrichment.catalog.source.publisher} reference${car.enrichment.catalog.energy.secondaryFuel ? ' - primary fuel only; also uses ' + car.enrichment.catalog.energy.secondaryFuel : ''}` : 'Unknown'];
  const experiences = new Map(cars.map(car => [car, resolveVehicleExperience(car, scenario)]));
  const experienceRows = [['Annual fuel / charging cost', car => <ExperienceCost experience={experiences.get(car)} scenario={scenario} />], ...COMFORT_TOPICS.map(([key, label]) => [label, car => <ComfortDetail experience={experiences.get(car)} topic={key} />]), ['Practicality', car => <PracticalitySummary experience={experiences.get(car)} />], ['Estimate details', car => <ExperienceAssumptions experience={experiences.get(car)} />]];
  const overviewRows = [
    ['Asking price · seller', priceDisplay], ['Mileage · seller', mileageDisplay],
    ['Annual fuel / charging cost', car => {
      const energy = experiences.get(car).energy;
      return <><strong>{Number.isFinite(energy.annualCost) ? `$${energy.annualCost.toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD/year` : 'Check assumptions'}</strong><small>{experienceLabel(energy)}</small></>;
    }],
    ['Comfort', car => {
      const e = experiences.get(car);
      return <><strong>Ride {e.ratings.rideQuality.rating.toFixed(1)}/5 · Seats {e.seatComfort.toFixed(1)}/5</strong><small>{[...new Set([e.ratings.rideQuality, e.ratings.frontSeatComfort, e.ratings.rearSeatComfort].filter(Boolean).map(experienceLabel))].join(' + ')}</small></>;
    }],
    ['Practicality', car => {
      const e = experiences.get(car);
      return <><strong>Room {e.passengerSpace.toFixed(1)}/5 · Cargo {e.ratings.cargoSpace.rating.toFixed(1)}/5</strong><small>{[...new Set([e.ratings.frontPassengerSpace, e.ratings.rearPassengerSpace, e.ratings.cargoSpace].filter(Boolean).map(experienceLabel))].join(' + ')}</small></>;
    }],
    ['Horsepower', car => spec(car, 'horsepower', true)],
  ];
  const rows = [['Asking price · seller', priceDisplay], ['Mileage and unit · seller', mileageDisplay],
    ...KEY_FIELDS.filter(key => !sharedGaps.includes(key)).map(key => [FIELD_LABELS[key], car => spec(car, key)]),
    ...(cars.some(hasEnergy) ? [fuelRow] : []), ...experienceRows];
  const reviewCars = cars.filter(car => detectWarnings(car).length);
  function table(tableRows, label) {
    return <div className="table-scroll comparison-table" role="region" aria-label={label} tabIndex={0}><table role="table" style={{ '--columns': cars.length }}><caption className="sr-only">{label}</caption><thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Detail</th>{cars.map(car => <th role="columnheader" scope="col" className={cellClass(car)} key={car.legacyItemId}><article className={`car-card ${cellClass(car)}`} tabIndex={-1} data-car-id={car.legacyItemId}><h2 className="vehicle-name">{vehicleName(car)}</h2><button type="button" className="view-details text-button" onClick={() => showSources(car, true)} aria-label={`Details for ${vehicleName(car)}`}>Details</button>{detectWarnings(car).length > 0 && <details className="card-warnings"><summary>Review before choosing · {detectWarnings(car).map(warning => warning.label).join(', ')}</summary><ComparisonWarnings car={car} /></details>}</article></th>)}</tr></thead><tbody role="rowgroup">{tableRows.map(([label, format]) => <tr role="row" key={label}><th role="rowheader" scope="row">{label}</th>{cars.map(car => <td role="cell" className={cellClass(car)} key={car.legacyItemId}>{format(car)}</td>)}</tr>)}</tbody></table></div>;
  }
  const decisionButton = <button type="button" className="compare-decide" onClick={() => navigate?.('decide')}>Help me decide <Icon name="arrow" size={18} /></button>;
  return <section className="comparison-section page-section">
    <WorkspaceHeading className="section-heading" title="Compare cars" description="The essentials side by side. Open a tab for the full picture.">
      <div className="comparison-management"><span className="shortlist-count">{cars.length} of 4 cars</span><details className="comparison-options"><summary>Comparison options</summary><div>{!!cars.length && <button type="button" className="text-button" data-action="clear-comparison" onClick={clearCars}>Clear comparison</button>}{clearSavedSpecs && <button type="button" className="text-button" data-action="clear-saved-specs" onClick={clearSavedSpecs}>Clear saved model specs</button>}<p>Listing details stay temporary. Only model references may be saved on this device.</p></div></details></div>
    </WorkspaceHeading>
    {notice && !cars.some(car => car.demo) && <p className="comparison-notice" role="status">{notice}</p>}
    {!cars.length && <div id="comparison-import" className="comparison-import">{importForm}</div>}
    {!cars.length ? <div className="empty-state"><Icon name="compare" size={32} /><h2>Your shortlist starts with one car.</h2><p>Paste an eBay.ca link above, then add another car to see them side by side. You can keep up to four.</p></div> : <>
      <div className="compare-toolbar" ref={tabRegion}><div className="compare-tabs" role="tablist" aria-label="Comparison views">{TABS.map(([id, label], index) => <button type="button" key={id} id={`compare-tab-${id}`} role="tab" aria-selected={view.tab === id} aria-controls={`compare-panel-${id}`} tabIndex={view.tab === id ? 0 : -1} onClick={() => selectTab(id)} onKeyDown={event => tabKey(event, index)}>{label}</button>)}</div><div className="desktop-decide">{decisionButton}</div></div>
      {!!reviewCars.length && <div className="shortlist-review"><Icon name="shield" size={18} /><span>{reviewCars.length} {reviewCars.length === 1 ? 'car needs' : 'cars need'} review before choosing.</span><button className="text-button" type="button" onClick={() => showSources(reviewCars[0])}>Review concerns</button></div>}
      {cars.some(car => car.demo) && <p className="demo-notice" role="status">Fictional demo · Prices, mileage and listing claims are examples. Model references are real.</p>}
      {cars.length > 2 && <div className="mobile-pair" role="group" aria-label="Choose two cars to compare">{[0, 1].map(index => <label key={index}>{index === 0 ? 'First car' : 'Second car'}<select value={view.pair[index]} onChange={event => selectPair(index, event.target.value)}>{cars.map(car => <option key={car.legacyItemId} value={car.legacyItemId}>{vehicleName(car)}</option>)}</select></label>)}</div>}
      {TABS.filter(([id]) => id !== view.tab).map(([id]) => <div key={id} id={`compare-panel-${id}`} role="tabpanel" aria-labelledby={`compare-tab-${id}`} hidden />)}
      <m.div key={view.tab} id={`compare-panel-${view.tab}`} role="tabpanel" aria-labelledby={`compare-tab-${view.tab}`} tabIndex={0} className="compare-panel" initial={reduced ? false : { opacity: 0.7 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.18 }}>
        {view.tab === 'overview' && <>{table(overviewRows, 'Vehicle overview')}<p className="overview-note">Comfort and running costs include labeled estimates. Ratings describe the model, not this car’s condition.</p><details className="decision-details scenario-panel"><summary>Adjust fuel assumptions &amp; practical needs</summary><ScenarioFields scenario={scenario} setScenario={setScenario} /></details></>}
        {view.tab === 'specifications' && <><div className="table-heading"><h2>All supported specifications</h2><p>Seller claims, original records and model references stay clearly labeled.</p></div>{table(rows, 'Vehicle comparison table')}{!!sharedGaps.length && <details className="missing-specs"><summary>Details still missing</summary><p className="shared-gaps">Not documented for any contender: {sharedGaps.map(key => FIELD_LABELS[key]).join(', ')}. Model lookup may fill gaps when suitable sources are available.</p></details>}</>}
        {view.tab === 'sources' && sourceCar && <div className="sources-workspace" ref={evidenceRegion}><div className="source-photo"><VehicleImage key={sourceCar.legacyItemId} car={sourceCar} /></div><div className="source-selection"><label htmlFor="evidence-vehicle">Sources and checks for</label><select id="evidence-vehicle" value={sourceCar.legacyItemId} onChange={event => changeView({ ...view, sourceId: event.target.value })}>{cars.map(car => <option key={car.legacyItemId} value={car.legacyItemId}>{vehicleName(car)}</option>)}</select><ListingLink car={sourceCar} /></div><p className="car-meta source-listing-context"><strong>Listing location:</strong> {locationDisplay(sourceCar)} · <strong>Mileage:</strong> {mileageDisplay(sourceCar)}</p><ComparisonWarnings car={sourceCar} /><div className="source-status-grid"><VehicleSummary onSaveDetails={onSaveDetails} key={sourceCar.legacyItemId} car={sourceCar} retryResearch={retryResearch} onViewResults={() => showSources(sourceCar, true)} /></div><details className="specifics"><summary>All available seller specifications</summary><dl className="seller-specifics">{sourceCar.itemSpecifics?.length ? sourceCar.itemSpecifics.map((aspect, index) => <div key={index}><dt>{aspect.name}</dt><dd>{unknown([aspect.value].flat().join(', '))}</dd></div>) : <p>No item specifics supplied.</p>}</dl></details><details className="seller-description"><summary>Seller description &amp; mileage evidence</summary><div className="seller-context"><p><strong>Original headline:</strong> {unknown(sourceCar.title)}</p><p>{sourceCar.description || 'Unknown'}</p><p><strong>Mileage:</strong> {resolveMileage(sourceCar).reason}</p>{resolveMileage(sourceCar).evidence.map((item, index) => <p key={index}>{item.source}: “{item.quote}” → {item.amount ?? ''} {item.unit || 'unit unclear'}</p>)}</div></details></div>}
      </m.div>
    </>}
  </section>;
}
