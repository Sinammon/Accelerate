import React, { useEffect, useRef, useState } from 'react';
import { unknown, vehicleName, vehicleTrimLine, safeUrl, listingSource, mileageDisplay, priceDisplay, ratingDisplay, resolveMileage, canFillPhotoFrame } from './vehicle-data.js';
import { m, useReducedMotion } from 'motion/react';
import { emptyComparisonView, reconcileComparisonView } from './comparison-view.js';
import { extractVehicleSpecs, FIELD_LABELS } from './vehicle-specs.js';
import { SpecValue } from './VehicleEvidence.jsx';
import VehicleSummary from './VehicleSummary.jsx';
import Icon from './Icons.jsx';
import { detectWarnings, rankDecisionMode } from './decision-engine.js';
import { resolveVehicleExperience, DEFAULT_SCENARIO } from './vehicle-experience.js';
import { ExperienceCost, ComfortDetail, PracticalitySummary, ExperienceAssumptions, COMFORT_TOPICS } from './VehicleExperience.jsx';
import ScenarioFields from './ScenarioFields.jsx';
import WorkspaceHeading from './WorkspaceHeading.jsx';
import SourceLinks from './SourceLinks.jsx';

export function vehicleImageUrl(car, index = 0) {
  const value = (car.images || [])[index];
  return safeUrl(value) || (car.demo === true && /^\/images\/preview\/(civic|corolla|mazda3|jetta)\.jpg$/.test(value) ? value : null);
}
export function VehicleImage({ car, badge, adaptiveFit = false, thumbnail = false }) {
  const [index, setIndex] = useState(0);
  const [coverUrl, setCoverUrl] = useState(null);
  const frame = useRef(null);
  const images = car.images || [];
  const url = vehicleImageUrl(car, index);
  useEffect(() => {
    if (!adaptiveFit || !url) return;
    const container = frame.current;
    const image = container.querySelector('img');
    function updateFit() {
      setCoverUrl(canFillPhotoFrame(image.naturalWidth, image.naturalHeight, container.clientWidth, container.clientHeight) ? url : null);
    }
    updateFit();
    image.addEventListener('load', updateFit);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updateFit) : null;
    observer?.observe(container);
    return () => {
      observer?.disconnect();
      image.removeEventListener('load', updateFit);
    };
  }, [adaptiveFit, url]);
  const alt = car.demo ? `${vehicleName(car)} model-example photo; fictional vehicle details` : `${vehicleName(car)} seller listing photo`;
  return <div className="vehicle-image" ref={frame} data-fit={adaptiveFit && url && coverUrl === url ? 'cover' : undefined}>
    {url ? <img key={url} src={url} alt={thumbnail ? '' : alt} referrerPolicy="no-referrer" onError={() => setIndex(i => i + 1)} />
      : <div className="image-placeholder"><Icon name="engine" />{!thumbnail && 'Image unavailable'}</div>}
    {badge && <span className="vehicle-photo-badge"><Icon name="sparkle" size={14} />{badge}</span>}
    {!thumbnail && <>
      <span className="source-pill">{car.demo ? 'Model photo · fictional details' : 'Seller listing · eBay'}</span>
      {images.length > 1 && url && <button className="photo-next" aria-label={`Next photo of ${vehicleName(car)}`} onClick={() => setIndex(i => (i + 1) % images.length)}><Icon name="chevron" /></button>}
    </>}
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

export default function VehicleComparison({ cars, valueRanking, topValue, ownership, removeCar, clearCars, importForm, importLoading = false, navigate, retryResearch, clearSavedSpecs, onSaveDetails, view: suppliedView, onViewChange, notice, scenario: suppliedScenario, setScenario: suppliedSetScenario }) {
  const [localScenario, setLocalScenario] = useState(DEFAULT_SCENARIO);
  const scenario = suppliedScenario || localScenario, setScenario = suppliedSetScenario || setLocalScenario;
  const [localView, setLocalView] = useState(emptyComparisonView);
  const view = reconcileComparisonView(suppliedView || localView, cars);
  const changeView = onViewChange || setLocalView;
  const [focusRequest, setFocusRequest] = useState(null);
  const reduced = useReducedMotion();
  const evidenceRegion = useRef(null), tabRegion = useRef(null), importRegion = useRef(null), addButton = useRef(null);
  const importShown = !cars.length || view.importOpen;
  useEffect(() => {
    if (view.importOpen) importRegion.current?.querySelector('input')?.focus();
  }, [view.importOpen]);
  function openImport() {
    changeView({ ...view, importOpen: true });
    requestAnimationFrame(() => importRegion.current?.querySelector('input')?.focus());
  }
  function closeImport() {
    changeView({ ...view, importOpen: false });
    addButton.current?.focus();
  }
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
  const pairClass = car => view.pair.includes(car.legacyItemId) ? `pair-visible pair-${view.pair.indexOf(car.legacyItemId)}` : 'pair-hidden';
  const cellClass = car => `${pairClass(car)}${car.legacyItemId === topValue ? ' comparison-top-match' : ''}`;
  const spec = (car, key) => <SpecValue spec={records.get(car).specs[key]} car={car} compact onViewEvidence={records.get(car).specs[key].status === 'conflict' ? () => showSources(car, true) : undefined} />;
  const sharedGaps = KEY_FIELDS.filter(key => cars.every(car => records.get(car).specs[key].status === 'unknown'));
  const hasEnergy = car => car.enrichment?.fuel?.status === 'matched' || car.enrichment?.catalog?.energy;
  const fuelRow = ['Fuel / energy use', car => {
    const { fuel, catalog } = car.enrichment || {};
    if (fuel?.status === 'matched') return <>{fuel.combined.toFixed(1)} L/100 km<SourceLinks sources={[{ url: fuel.source, publisher: 'NRCan' }]} /></>;
    if (!catalog?.energy) return 'Unknown';
    const { value, unit, secondaryFuel } = catalog.energy;
    return <>{value.toFixed(1)} {unit}{secondaryFuel && ` · Primary fuel only, also uses ${secondaryFuel}`}<SourceLinks sources={[catalog.source]} /></>;
  }];
  const experiences = new Map(cars.map(car => [car, resolveVehicleExperience(car, scenario)]));
  const experienceRows = [['Annual fuel / charging cost', car => <ExperienceCost experience={experiences.get(car)} scenario={scenario} />], ...COMFORT_TOPICS.map(([key, label]) => [label, car => <ComfortDetail experience={experiences.get(car)} topic={key} />]), ['Practicality', car => <PracticalitySummary experience={experiences.get(car)} />], ['Estimate details', car => <ExperienceAssumptions experience={experiences.get(car)} />]];
  const year = new Date().getFullYear();
  const showScores = view.tab === 'overview' && cars.length > 0;
  const affordability = showScores ? rankDecisionMode(cars, 'cost', year, scenario, ownership) : null;
  const performance = showScores ? rankDecisionMode(cars, 'performance', year, scenario) : null;
  const scoreFor = (ranking, car) => {
    const score = ranking?.ranked.find(entry => entry.car === car)?.score;
    if (score == null) return 'Insufficient evidence';
    const scores = ranking.ranked.map(entry => entry.score).filter(Number.isFinite);
    const highest = scores.length > 1 && score === Math.max(...scores);
    return <strong className={`comparison-match-score${highest ? ' is-highest' : ''}`} title={highest ? 'Highest score among comparable contenders' : undefined}>{score}<span> / 100</span></strong>;
  };
  const provisionalScores = [valueRanking, affordability, performance].filter(ranking => ranking?.provisional && ranking.best.length)
    .map(ranking => ({ value: 'Best Value', cost: 'Affordability', performance: 'Performance' })[ranking.mode.id]);
  const overviewRows = [
    ['Asking price', priceDisplay], ['Mileage', mileageDisplay],
    ...(valueRanking ? [['Best Value match score', car => scoreFor(valueRanking, car)]] : []),
    ['Affordability score', car => scoreFor(affordability, car)],
    ['Performance score', car => scoreFor(performance, car)],
    ['Comfort', car => {
      const e = experiences.get(car);
      return <>
        <strong className="comparison-factor-pair">
          <span>Ride {ratingDisplay(e.ratings.rideQuality.rating)}/5</span>
          <span>Seats {ratingDisplay(e.seatComfort)}/5</span>
        </strong>
        <SourceLinks sources={[e.ratings.rideQuality, e.ratings.frontSeatComfort, e.ratings.rearSeatComfort].flatMap(rating => rating?.evidence || [])} />
      </>;
    }],
    ['Practicality', car => {
      const e = experiences.get(car);
      return <>
        <strong className="comparison-factor-pair">
          <span>Room {ratingDisplay(e.passengerSpace)}/5</span>
          <span>Cargo {ratingDisplay(e.ratings.cargoSpace.rating)}/5</span>
        </strong>
        <SourceLinks sources={[e.ratings.frontPassengerSpace, e.ratings.rearPassengerSpace, e.ratings.cargoSpace].flatMap(rating => rating?.evidence || [])} />
      </>;
    }],
  ];
  const rows = [['Asking price', priceDisplay], ['Mileage and unit', mileageDisplay],
    ...KEY_FIELDS.filter(key => !sharedGaps.includes(key)).map(key => [FIELD_LABELS[key], car => spec(car, key)]),
    ...(cars.some(hasEnergy) ? [fuelRow] : []), ...experienceRows];
  const reviewCars = cars.filter(car => detectWarnings(car).length);
  function table(tableRows, label) {
    const layout = cars.length === 1 ? ' comparison-single' : cars.length === 2 ? ' comparison-pair' : '';
    return <>{cars.length > 1 && <p className="comparison-scroll-hint"><Icon name="chevron" size={14} /> Scroll sideways to see both cars</p>}
    <div className={`table-scroll comparison-table${layout}`} role="region" aria-label={label} tabIndex={0}>
      <table role="table" style={{ '--columns': cars.length, '--mobile-columns': Math.min(cars.length, 2) }}>
        <caption className="sr-only">{label}</caption>
        <thead role="rowgroup"><tr role="row">
          <th role="columnheader" scope="col">{view.tab === 'overview' ? 'At a glance' : 'Detail'}</th>
          {cars.map(car => {
            const name = vehicleName(car);
            const trim = vehicleTrimLine(records.get(car).specs);
            const warnings = detectWarnings(car);
            return <th role="columnheader" scope="col" className={cellClass(car)} key={car.legacyItemId}>
              <article className={`car-card ${pairClass(car)}`} tabIndex={-1} data-car-id={car.legacyItemId}>
                <VehicleImage car={car} badge={car.legacyItemId === topValue ? 'Top match' : undefined} />
                <h2 className="vehicle-name">{name}</h2>
                {trim && <p className="vehicle-trim">{trim}</p>}
                <SourceLinks sources={[listingSource(car)]} />
                <div className="comparison-car-actions">
                  <button type="button" className="view-details text-button" onClick={() => showSources(car, true)} aria-label={`Details for ${name}`}>Details</button>
                  <button type="button" className="text-button compare-remove" disabled={!removeCar} aria-label={`Remove ${name} from comparison`} onClick={() => removeCar?.(car.legacyItemId, true)}>Remove</button>
                </div>
                {!!warnings.length && <details className="card-warnings"><summary>Review before choosing · {warnings.map(warning => warning.label).join(', ')}</summary><ComparisonWarnings car={car} /></details>}
              </article>
            </th>;
          })}
        </tr></thead>
        <tbody role="rowgroup">{tableRows.map(([label, format]) => <tr role="row" key={label}><th role="rowheader" scope="row">{label}</th>{cars.map(car => <td role="cell" className={cellClass(car)} key={car.legacyItemId}>{format(car)}</td>)}</tr>)}</tbody>
      </table>
    </div></>;
  }
  const decisionButton = <button type="button" className="compare-decide" onClick={() => navigate?.('decide')}>Help me decide <Icon name="arrow" /></button>;
  return <section className="comparison-section page-section">
    <WorkspaceHeading className="section-heading" title="Compare cars" description="The essentials side by side. Open a tab for the full picture.">
      <div className="comparison-management"><button ref={addButton} type="button" className="compare-add" onClick={openImport} disabled={cars.length >= 4 || importLoading} aria-expanded={!!importShown} aria-controls="comparison-import" aria-describedby={cars.length >= 4 ? 'comparison-full-note' : undefined}>Add car <Icon name="link" /></button><span className="shortlist-count">{cars.length} of 4 cars</span><details className="comparison-options"><summary>Comparison options</summary><div>{!!cars.length && <button type="button" className="text-button" data-action="clear-comparison" onClick={clearCars}>Clear comparison</button>}{clearSavedSpecs && <button type="button" className="text-button" data-action="clear-saved-specs" onClick={clearSavedSpecs}>Clear saved model specs</button>}<p>Listing details stay temporary. Only model references may be saved on this device.</p></div></details></div>
    </WorkspaceHeading>
    {notice && !cars.some(car => car.demo) && <p className="comparison-notice" role="status">{notice}</p>}
    {cars.length >= 4 && <p id="comparison-full-note" className="comparison-notice">Your comparison is full. Remove a car to add another.</p>}
    <div id="comparison-import" className="comparison-import" ref={importRegion} hidden={!importShown}>{importShown && <>{importForm}{!!cars.length && <button type="button" className="text-button comparison-import-cancel" onClick={closeImport} disabled={importLoading}>Cancel</button>}</>}</div>
    {!cars.length ? <div className="empty-state"><Icon name="compare" /><h2>Your shortlist starts with one car</h2><p>Paste an eBay.ca link above, then add another car to see them side by side. You can keep up to four.</p></div> : <>
      <div className="compare-toolbar" ref={tabRegion}><div className="compare-tabs" role="tablist" aria-label="Comparison views">{TABS.map(([id, label], index) => <button type="button" key={id} id={`compare-tab-${id}`} role="tab" aria-selected={view.tab === id} aria-controls={`compare-panel-${id}`} tabIndex={view.tab === id ? 0 : -1} onClick={() => selectTab(id)} onKeyDown={event => tabKey(event, index)}>{label}</button>)}</div><div className="desktop-decide">{decisionButton}</div></div>
      {!!reviewCars.length && <div className="shortlist-review"><Icon name="shield" /><span>{reviewCars.length} {reviewCars.length === 1 ? 'car needs' : 'cars need'} review before choosing.</span><button className="text-button" type="button" onClick={() => showSources(reviewCars[0])}>Review concerns</button></div>}
      {cars.some(car => car.demo) && <p className="demo-notice" role="status">Fictional demo · Prices, mileage and listing claims are examples. Model references are real.</p>}
      {cars.length > 2 && <div className="mobile-pair" role="group" aria-label="Choose two cars to compare">{[0, 1].map(index => <label key={index}>{index === 0 ? 'First car' : 'Second car'}<select value={view.pair[index]} onChange={event => selectPair(index, event.target.value)}>{cars.map(car => <option key={car.legacyItemId} value={car.legacyItemId}>{vehicleName(car)}</option>)}</select></label>)}</div>}
      {TABS.filter(([id]) => id !== view.tab).map(([id]) => <div key={id} id={`compare-panel-${id}`} role="tabpanel" aria-labelledby={`compare-tab-${id}`} hidden />)}
      <m.div key={view.tab} id={`compare-panel-${view.tab}`} role="tabpanel" aria-labelledby={`compare-tab-${view.tab}`} tabIndex={0} className="compare-panel" initial={reduced ? false : { opacity: 0.7 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}>
        {view.tab === 'overview' && <>
          {table(overviewRows, 'Vehicle overview')}
          <p className="overview-note">Some details come from listings or model estimates.{provisionalScores.length > 0 && ` Provisional scores: ${provisionalScores.join(', ')}.`}</p>
          <details className="decision-details">
            <summary>How Performance and Affordability are scored</summary>
            <p><strong>Performance</strong> uses comparable acceleration and power-to-weight when available, plus horsepower or torque depending on the evidence.</p>
            <p><strong>Affordability</strong> weighs asking price (80%) and estimated annual running costs (20%). Running costs include your edits in Costs. Financing is separate.</p>
            <p>Scores compare your shortlist. A typical result starts near 50, and small differences move the score only a little. Factors without comparable data are left out.</p>
          </details>
          <details className="decision-details scenario-panel"><summary>Adjust fuel assumptions &amp; practical needs</summary><ScenarioFields scenario={scenario} setScenario={setScenario} /></details>
        </>}
        {view.tab === 'specifications' && <><div className="table-heading"><h2>All supported specifications</h2></div>{table(rows, 'Vehicle comparison table')}{!!sharedGaps.length && <details className="missing-specs"><summary>Details still missing</summary><p className="shared-gaps">Not documented for any contender: {sharedGaps.map(key => FIELD_LABELS[key]).join(', ')}. Model lookup may fill gaps when suitable sources are available.</p></details>}</>}
        {view.tab === 'sources' && sourceCar && <div className="sources-workspace" ref={evidenceRegion}><div className="source-photo"><VehicleImage key={sourceCar.legacyItemId} car={sourceCar} /></div><div className="source-selection"><label htmlFor="evidence-vehicle">Sources and checks for</label><select id="evidence-vehicle" value={sourceCar.legacyItemId} onChange={event => changeView({ ...view, sourceId: event.target.value })}>{cars.map(car => <option key={car.legacyItemId} value={car.legacyItemId}>{vehicleName(car)}</option>)}</select><ListingLink car={sourceCar} /><button type="button" className="text-button compare-remove" disabled={!removeCar} aria-label={`Remove ${vehicleName(sourceCar)} from comparison`} onClick={() => removeCar?.(sourceCar.legacyItemId, true)}>Remove this car</button></div><p className="car-meta source-listing-context"><strong>Listing location:</strong> {locationDisplay(sourceCar)} · <strong>Mileage:</strong> {mileageDisplay(sourceCar)}</p><ComparisonWarnings car={sourceCar} /><div className="source-status-grid"><VehicleSummary onSaveDetails={onSaveDetails} key={sourceCar.legacyItemId} car={sourceCar} retryResearch={retryResearch} onViewResults={() => showSources(sourceCar, true)} /></div><details className="specifics"><summary>All available seller specifications</summary><dl className="seller-specifics">{sourceCar.itemSpecifics?.length ? sourceCar.itemSpecifics.map((aspect, index) => <div key={index}><dt>{aspect.name}</dt><dd>{unknown([aspect.value].flat().join(', '))}</dd></div>) : <p>No item specifics supplied.</p>}</dl></details><details className="seller-description"><summary>Seller description &amp; mileage evidence</summary><div className="seller-context"><p><strong>Original headline:</strong> {unknown(sourceCar.title)}</p><p>{sourceCar.description || 'Unknown'}</p><p><strong>Mileage:</strong> {resolveMileage(sourceCar).reason}</p>{resolveMileage(sourceCar).evidence.map((item, index) => <p key={index}>{item.source}: “{item.quote}” → {item.amount ?? ''} {item.unit || 'unit unclear'}</p>)}</div></details></div>}
      </m.div>
    </>}
  </section>;
}
