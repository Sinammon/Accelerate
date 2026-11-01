import React, { useEffect, useRef, useState } from 'react';
import { unknown, vehicleName, safeUrl, mileageDisplay, priceDisplay, resolveMileage } from './vehicle-data.js';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { emptyComparisonView, reconcileComparisonView } from './comparison-view.js';
import { extractVehicleSpecs, FIELD_LABELS } from './vehicle-specs.js';
import { SpecValue, ResearchAction } from './VehicleEvidence.jsx';
import VehicleSummary from './VehicleSummary.jsx';
import Icon from './Icons.jsx';
import { detectWarnings } from './decision-engine.js';

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

export default function VehicleComparison({ cars, removeCar, clearCars, importForm, navigate, retryResearch, clearSavedSpecs, view: suppliedView, onViewChange, notice }) {
  const [localView, setLocalView] = useState(emptyComparisonView);
  const view = reconcileComparisonView(suppliedView || localView, cars);
  const changeView = onViewChange || setLocalView;
  const [adding, setAdding] = useState(false);
  const [focusRequest, setFocusRequest] = useState(null);
  const reduced = useReducedMotion();
  const importRegion = useRef(null), evidenceRegion = useRef(null), tabRegion = useRef(null);
  const previousIds = useRef(cars.map(car => car.legacyItemId));
  const shortlistKey = cars.map(car => car.legacyItemId).join('|');
  useEffect(() => {
    const ids = cars.map(car => car.legacyItemId);
    const addedId = ids.find(id => !previousIds.current.includes(id));
    if (addedId) {
      setAdding(false);
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
    if (adding) importRegion.current?.querySelector('input')?.focus();
  }, [adding]);
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
  function remove(id) {
    removeCar?.(id);
    requestAnimationFrame(() => {
      const next = [...document.querySelectorAll('.car-card.pair-visible')].find(card => card.dataset.carId !== id);
      (next?.querySelector('.remove-button') || document.querySelector('.add-car:not(:disabled)') || document.getElementById('listing-url'))?.focus();
    });
  }
  const records = new Map(cars.map(car => [car, extractVehicleSpecs(car)]));
  const sourceCar = cars.find(car => car.legacyItemId === view.sourceId) || cars[0];
  const cellClass = car => view.pair.includes(car.legacyItemId) ? `pair-visible pair-${view.pair.indexOf(car.legacyItemId)}` : 'pair-hidden';
  const spec = (car, key, compact = false) => <SpecValue spec={records.get(car).specs[key]} compact={compact} onViewEvidence={compact ? () => showSources(car) : undefined} />;
  const sharedGaps = KEY_FIELDS.filter(key => cars.every(car => records.get(car).specs[key].status === 'unknown'));
  const overviewFields = ['transmission', 'fuelType', 'seats', 'bodyType'].filter(key => !sharedGaps.includes(key));
  const fuelRow = ['Fuel use (L/100 km)', car => car.enrichment?.fuel?.status === 'matched' ? `${car.enrichment.fuel.combined.toFixed(1)} · NRCan reference` : 'Unknown'];
  const overviewRows = overviewFields.map(key => [FIELD_LABELS[key], car => spec(car, key, true)]);
  if (cars.some(car => car.enrichment?.fuel?.status === 'matched')) overviewRows.push(fuelRow);
  const rows = [['Asking price · seller', priceDisplay], ['Mileage and unit · seller', mileageDisplay],
    ...KEY_FIELDS.filter(key => !sharedGaps.includes(key)).map(key => [FIELD_LABELS[key], car => spec(car, key)]),
    ...(cars.some(car => car.enrichment?.fuel?.status === 'matched') ? [fuelRow] : [])];
  const reviewCars = cars.filter(car => detectWarnings(car).length);
  function table(tableRows, label) {
    return <div className="table-scroll comparison-table" role="region" aria-label={label} tabIndex={0}><table role="table" style={{ '--columns': cars.length }}><caption className="sr-only">{label}</caption><thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Detail</th>{cars.map(car => <th role="columnheader" scope="col" className={cellClass(car)} key={car.legacyItemId}>{vehicleName(car)}</th>)}</tr></thead><tbody role="rowgroup">{tableRows.map(([label, format]) => <tr role="row" key={label}><th role="rowheader" scope="row">{label}</th>{cars.map(car => <td role="cell" className={cellClass(car)} key={car.legacyItemId}>{format(car)}</td>)}</tr>)}</tbody></table></div>;
  }
  const decisionButton = <button type="button" className="compare-decide" onClick={() => navigate?.('decide')}>Help me decide <Icon name="arrow" size={18} /></button>;
  return <section className="comparison-section page-section">
    <div className="section-heading"><div><h1 tabIndex={-1}>Compare Your Vehicles</h1><p className="page-intro">Start with the essentials. Explore the details when you need them.</p></div><div className="comparison-management"><span className="shortlist-count">{cars.length} of 4 cars</span>{!!cars.length && <button type="button" className="text-button add-car" disabled={cars.length >= 4} aria-expanded={adding} aria-controls="comparison-import" onClick={() => setAdding(open => !open)}>{adding ? 'Close form' : 'Add car'}<Icon name={adding ? 'close' : 'link'} size={17} /></button>}<details className="comparison-options"><summary>Comparison options</summary><div>{!!cars.length && <button type="button" className="text-button" data-action="clear-comparison" onClick={clearCars}>Clear comparison</button>}{clearSavedSpecs && <button type="button" className="text-button" data-action="clear-saved-specs" onClick={clearSavedSpecs}>Clear saved model specs</button>}<p>Listing details stay temporary. Only model references may be saved on this device.</p></div></details></div></div>
    {cars.length >= 4 && <p className="shortlist-limit">Your shortlist is full. Remove a car to add another.</p>}
    {notice && <p className="comparison-notice" role="status">{notice}</p>}
    <div id="comparison-import" ref={importRegion} className="comparison-import" hidden={!!cars.length && !adding}>{importForm}</div>
    {!cars.length ? <div className="empty-state"><Icon name="compare" size={32} /><h2>Your shortlist starts with one car.</h2><p>Paste an eBay.ca link above, then add another car to see them side by side. You can keep up to four.</p></div> : <>
      <div className="compare-toolbar" ref={tabRegion}><div className="compare-tabs" role="tablist" aria-label="Comparison views">{TABS.map(([id, label], index) => <button type="button" key={id} id={`compare-tab-${id}`} role="tab" aria-selected={view.tab === id} aria-controls={`compare-panel-${id}`} tabIndex={view.tab === id ? 0 : -1} onClick={() => selectTab(id)} onKeyDown={event => tabKey(event, index)}>{label}</button>)}</div><div className="desktop-decide">{decisionButton}</div></div>
      {!!reviewCars.length && <div className="shortlist-review"><Icon name="shield" size={18} /><span>{reviewCars.length} {reviewCars.length === 1 ? 'car needs' : 'cars need'} review before choosing.</span><button className="text-button" type="button" onClick={() => showSources(reviewCars[0])}>Review concerns</button></div>}
      {cars.some(car => car.demo) && <p className="demo-notice" role="status">Fictional demo · Prices, mileage and listing claims are examples. Model references are real.</p>}
      {cars.length > 2 && <div className="mobile-pair" role="group" aria-label="Choose two cars to compare">{[0, 1].map(index => <label key={index}>{index === 0 ? 'First car' : 'Second car'}<select value={view.pair[index]} onChange={event => selectPair(index, event.target.value)}>{cars.map(car => <option key={car.legacyItemId} value={car.legacyItemId}>{vehicleName(car)}</option>)}</select></label>)}</div>}
      <div className="car-grid compact-cars" style={{ '--columns': cars.length }}><AnimatePresence initial={false}>{cars.map(car => <m.article initial={reduced ? false : { opacity: 0 }} exit={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.2 }} className={`car-card ${cellClass(car)}`} tabIndex={-1} data-car-id={car.legacyItemId} key={car.legacyItemId}><VehicleImage car={car} /><div className="car-card-body"><div className="card-topline"><h2 className="vehicle-name">{vehicleName(car)}</h2><button type="button" className="remove-button" aria-label={`Remove ${vehicleName(car)}`} onClick={() => remove(car.legacyItemId)}><Icon name="close" size={17} /></button></div><p className="car-price">{priceDisplay(car)}</p><p className="car-meta"><Icon name="mileage" size={15} />{mileageDisplay(car)}</p><p className="car-meta"><Icon name="location" size={15} />{locationDisplay(car)}</p><ComparisonWarnings car={car} /><ResearchAction car={car} retryResearch={retryResearch} compact onViewResults={() => showSources(car, true)} /><button type="button" className="view-details text-button" onClick={() => showSources(car, true)}>View details <Icon name="arrow" size={16} /></button></div></m.article>)}</AnimatePresence></div>
      {TABS.filter(([id]) => id !== view.tab).map(([id]) => <div key={id} id={`compare-panel-${id}`} role="tabpanel" aria-labelledby={`compare-tab-${id}`} hidden />)}
      <m.div key={view.tab} id={`compare-panel-${view.tab}`} role="tabpanel" aria-labelledby={`compare-tab-${view.tab}`} tabIndex={0} className="compare-panel" initial={reduced ? false : { opacity: 0.7 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.18 }}>
        {view.tab === 'overview' && <><div className="table-heading"><h2>The essentials, side by side</h2><p>Unknown means we haven't found a supported value. Open a source label to learn more.</p></div>{overviewRows.length ? table(overviewRows, 'Vehicle overview') : <div className="overview-guidance"><Icon name="info" size={24} /><div><h3>More details are on the way.</h3><p>Compare price and mileage above. Check Specifications for the details available so far.</p></div></div>}<p className="overview-next">Want a closer look? <button type="button" className="inline-button" onClick={() => selectTab('specifications', true)}>See all specifications</button></p></>}
        {view.tab === 'specifications' && <><div className="table-heading"><h2>All supported specifications</h2><p>Seller claims, original records and model references stay clearly labeled.</p></div>{table(rows, 'Vehicle comparison table')}{!!sharedGaps.length && <details className="missing-specs"><summary>Details still missing</summary><p className="shared-gaps">Not documented for any contender: {sharedGaps.map(key => FIELD_LABELS[key]).join(', ')}. Model lookup may fill gaps when suitable sources are available.</p></details>}</>}
        {view.tab === 'sources' && sourceCar && <div className="sources-workspace" ref={evidenceRegion}><div className="source-selection"><label htmlFor="evidence-vehicle">Sources and checks for</label><select id="evidence-vehicle" value={sourceCar.legacyItemId} onChange={event => changeView({ ...view, sourceId: event.target.value })}>{cars.map(car => <option key={car.legacyItemId} value={car.legacyItemId}>{vehicleName(car)}</option>)}</select><ListingLink car={sourceCar} /></div><ComparisonWarnings car={sourceCar} /><div className="source-status-grid"><VehicleSummary key={sourceCar.legacyItemId} car={sourceCar} retryResearch={retryResearch} onViewResults={() => showSources(sourceCar, true)} /></div><details className="specifics"><summary>All available seller specifications</summary><dl className="seller-specifics">{sourceCar.itemSpecifics?.length ? sourceCar.itemSpecifics.map((aspect, index) => <div key={index}><dt>{aspect.name}</dt><dd>{unknown([aspect.value].flat().join(', '))}</dd></div>) : <p>No item specifics supplied.</p>}</dl></details><details className="seller-description"><summary>Seller description &amp; mileage evidence</summary><div className="seller-context"><p><strong>Original headline:</strong> {unknown(sourceCar.title)}</p><p>{sourceCar.description || 'Unknown'}</p><p><strong>Mileage:</strong> {resolveMileage(sourceCar).reason}</p>{resolveMileage(sourceCar).evidence.map((item, index) => <p key={index}>{item.source}: “{item.quote}” → {item.amount ?? ''} {item.unit || 'unit unclear'}</p>)}</div></details></div>}
      </m.div>
      <div className="mobile-decide"><span>{cars.length} cars in your shortlist</span>{decisionButton}</div>
    </>}
    <p className="data-note">Confirm seller claims before buying. Refreshing clears this shortlist.</p>
  </section>;
}
