import React, { useRef, useState } from 'react';
import { DEFAULT_SCENARIO } from './decision-engine.js';
import { decisionSummary, entrySummary, keyFacts, PRIMARY_MODES } from './decision-summary.js';
import VehicleEvidence from './VehicleEvidence.jsx';
import { priceDisplay, vehicleName } from './vehicle-data.js';
import { ListingLink, VehicleImage, vehicleImageUrl } from './VehicleComparison.jsx';
import { DecisionResearch } from './ModelResearch.jsx';
import Icon from './Icons.jsx';
import WorkspaceHeading from './WorkspaceHeading.jsx';
import { DIMENSION_LABELS } from './capability-scoring.js';
import { FIELD_LABELS, specEvidenceLabel } from './vehicle-specs.js';
import { SpecCitations } from './VehicleEvidence.jsx';
import OwnershipCosts from './OwnershipCosts.jsx';
import VehicleExperience from './VehicleExperience.jsx';
import ScenarioFields from './ScenarioFields.jsx';

function CategoryDetails({ entry, mode }) {
  const rows = mode === 'comfort' ? ['rideQuality', 'cabinQuietness', 'seatComfort', 'seatHeating'].map(key => ({ key, label: DIMENSION_LABELS[key], value: entry.values[key] == null ? 'Unknown' : `${entry.values[key]} / 5`, evidence: entry.evidence[key] }))
    : mode === 'performance' ? ['horsepower', 'torque', 'curbWeightKg', 'zeroTo100KphSeconds', 'zeroTo60MphSeconds'].map(key => ({ key, label: FIELD_LABELS[key], value: entry.specs[key].value?.toLocaleString('en-CA', { maximumFractionDigits: 2 }) ?? 'Unknown', evidence: entry.specs[key].evidence, source: entry.specs[key].value != null ? `${specEvidenceLabel(entry.specs[key])}${entry.specs[key].measurementMethod ? ` · ${entry.specs[key].measurementMethod}` : ''}` : '' }))
      : ['seats', 'body', 'passengerSpace', 'cargoSpace'].map(key => ({ key, label: DIMENSION_LABELS[key] || (key === 'seats' ? 'Meets seating need' : 'Preferred body style'), value: entry.values[key] ?? 'Unknown', evidence: entry.evidence[key] }));
  if (mode === 'performance') rows.push({ key: 'ratio', label: 'Power-to-weight (hp/tonne)', value: entry.values.powerToWeight?.toFixed(1) ?? 'Unknown', evidence: entry.evidence.powerToWeight, source: 'Derived from compatible power and curb weight' });
  return <dl className="capability-details" aria-label={`${mode} evidence`}>{rows.map(row => <div key={row.key}><dt>{row.label}</dt><dd><strong>{row.value}</strong>{row.source && <small>{row.source}</small>}<SpecCitations evidence={row.evidence} />{mode === 'comfort' && (row.key === 'seatComfort' ? ['frontSeatComfort', 'rearSeatComfort'] : row.key === 'passengerSpace' ? ['frontPassengerSpace', 'rearPassengerSpace'] : [row.key]).map(key => entry.ratings[key] && <small key={key}>{DIMENSION_LABELS[key]}: {entry.ratings[key].rationale}</small>)}</dd></div>)}</dl>;
}

function CapabilityComponents({ entry, result }) {
  if (result.mode.id === 'cost') return null;
  if (!['value', 'balanced'].includes(result.mode.id)) return <CategoryDetails entry={entry} mode={result.mode.id} />;
  return <details><summary>Capability components &amp; evidence</summary>{['comfort', 'performance', 'practical'].map(key => {
    const group = result.componentScores[key], component = group.entries.find(item => item.car === entry.car);
    return <section key={key}><h4>{key === 'practical' ? 'Practicality' : key[0].toUpperCase() + key.slice(1)} · {component.score == null ? 'Unscored' : `${component.score.toFixed(1)} / 100`} · {(group.coverage * 100).toFixed(0)}% coverage</h4><CategoryDetails entry={component} mode={key} /></section>;
  })}</details>;
}

function ModeButton({ item, mode, setMode }) {
  return <button type="button" className={`mode-card ${mode === item.id ? 'selected' : ''}`} data-mode={item.id} aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>
    <span className="mode-icon"><Icon name={mode === item.id ? 'check-circle' : item.icon || 'compare'} size={24} /></span>
    <strong>{item.label || item.title}</strong>
  </button>;
}
function ListingWarnings({ entry }) {
  return !!entry.warnings.length && <div className="warning-details" role="note"><strong>Review before choosing</strong>{entry.warnings.map((warning, index) => <p key={index}><b>{warning.label}:</b> {warning.evidence}</p>)}</div>;
}
function MatchCard({ summary }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef(null);
  const entry = summary.ranking.ranked[index % summary.ranking.ranked.length];
  const { car } = entry;
  const endorsed = summary.ranking.best.includes(entry);
  const notes = entrySummary(summary, entry);
  const facts = keyFacts(car, summary.requested.mode.id).filter(fact => !notes.reasons.some(reason => reason.text.includes(fact.value)));
  const label = entry.score == null ? 'What we know so far' : entry.reviewRequired ? 'Review before choosing'
    : !endorsed ? 'Other contender' : summary.provisional ? 'Provisional match' : summary.shared ? 'Equal match' : 'Best category fit';
  const explanation = notes.explanation;
  const canView = (car.images || []).some((_, i) => vehicleImageUrl(car, i));
  return <>
    <article className={`decision-match ${endorsed ? 'best-match' : ''}`} data-basis={summary.kind}>
      <div className="decision-photo"><VehicleImage key={car.legacyItemId} car={car} />{canView && <button type="button" className="view-photo" onClick={() => dialog.current?.showModal()}><Icon name="expand" size={17} />View larger photo</button>}</div>
      <div className="decision-match-copy"><div className="match-topline"><span className={`recommendation-badge ${!endorsed ? 'neutral' : ''} ${entry.warnings.length ? 'caution' : ''}`}><Icon name={endorsed && summary.kind === 'supported' && !entry.warnings.length ? 'trophy' : 'info'} size={18} />{summary.requested.mode.title.toLowerCase()} &middot; {label}</span></div>
        <h2>{vehicleName(car)}</h2><p className="decision-reason">{explanation}</p>
        <p className="evidence-coverage">{entry.score == null ? 'Available details and next checks' : summary.provisional ? 'Tentative recommendation · more comparable evidence would help' : 'Based on comparable vehicle details'}{summary.requested.usesApproximation && ' · Includes estimates or older saved details'} · Reviews describe the model; confirm comfort and condition in this car.</p>
        <ul className="decision-reasons">{notes.reasons.map(reason => <li key={reason.text} className={reason.source ? 'model-context' : ''}><Icon name={reason.source ? 'book' : 'check-circle'} size={21} /><span>{reason.text}<small>{reason.label}{reason.source && <> &middot; <a href={reason.source.url} target="_blank" rel="noopener noreferrer">{reason.source.publisher} <Icon name="arrow" size={14} /></a></>}</small></span></li>)}</ul>
        <div className="decision-tradeoff"><Icon name="balance" size={23} /><b>Trade-off</b><span>{notes.tradeoff}{notes.tradeoffSource && <small><a href={notes.tradeoffSource.url} target="_blank" rel="noopener noreferrer">{notes.tradeoffSource.publisher} <Icon name="arrow" size={14} /></a></small>}</span></div>
        <ListingWarnings entry={entry} />
      </div>
      {!!facts.length && <div className="decision-key-facts">{facts.map(fact => <div key={fact.label}><span className="fact-icon"><Icon name={fact.icon} size={28} /></span><div><span>{fact.label}</span><strong>{fact.value}</strong><small>{fact.sourceUrl ? <a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">{fact.source}</a> : fact.source}</small></div></div>)}</div>}
      <VehicleExperience car={car} scenario={summary.requested.scenario} showPracticality={summary.requested.mode.id === 'practical'} />
      {summary.ranking.ranked.length > 1 && <div className="contender-controls"><button type="button" className="decision-arrow previous" aria-label="Previous contender" onClick={() => setIndex(i => (i + summary.ranking.ranked.length - 1) % summary.ranking.ranked.length)}><Icon name="chevron" size={20} />Previous</button><button type="button" className="decision-arrow next" aria-label="Next contender" onClick={() => setIndex(i => (i + 1) % summary.ranking.ranked.length)}>Next<Icon name="chevron" size={20} /></button></div>}
      <div className="decision-card-foot"><span>{index % summary.ranking.ranked.length + 1} of {summary.ranking.ranked.length} contenders</span>{car.demo && <a href="/images/preview/credits.html" target="_blank" rel="noreferrer">Photo credits</a>}<ListingLink car={car} /></div>
    </article>
    <dialog className="decision-photo-dialog" ref={dialog} aria-label={`Larger photos of ${vehicleName(car)}`} onClick={e => { if (e.target === e.currentTarget) dialog.current.close(); }}><button type="button" autoFocus onClick={() => dialog.current.close()} aria-label="Close larger photo">Close ×</button><VehicleImage key={`large-${car.legacyItemId}`} car={car} /></dialog>
  </>;
}

export default function DecisionDashboard({ cars, mode = 'value', setMode, retryResearch, scenario: suppliedScenario, setScenario: suppliedSetScenario }) {
  const [localScenario, setLocalScenario] = useState(DEFAULT_SCENARIO);
  const scenario = suppliedScenario || localScenario, setScenario = suppliedSetScenario || setLocalScenario;
  const scenarioPanel = useRef(null);
  const summary = decisionSummary(cars, mode, new Date().getFullYear(), scenario);
  const result = summary.requested;
  const missing = result.criteria.filter(c => c.weight > 0 && !c.active);
  return <section className="page-section decision-page">
    <WorkspaceHeading className="decision-heading" title={<>Let's Find Your <em className="hero-italic">Best Match</em></>} description="Choose what matters most. See your match, the reasons, and the trade-off.">
      <a className="back-link" href="#compare">Back to comparison <Icon name="arrow" size={18} /></a>
    </WorkspaceHeading>
    <div className="mode-grid" role="group" aria-label="Decision priority">{PRIMARY_MODES.map(item => <ModeButton key={item.id} item={item} mode={mode} setMode={setMode} />)}</div>
    <p className="mode-explanation">{result.mode.description} {mode === 'value' ? 'See what you get for the asking price, with the strengths and trade-offs explained.' : ''}</p>
    {cars.some(car => car.demo) && <p className="decision-demo-note">Fictional demo cars · Listing details are examples; linked model research is real.</p>}
    {cars.some(car => ['loading', 'loading-model'].includes(car.enrichment?.status)) && <p className="decision-status" role="status">Checking specifications and typical model sources… Your result may update.</p>}
    <div className="decision-result" aria-live="polite" aria-atomic="false">
      {summary.kind === 'empty' ? <div className="decision-empty result-banner"><Icon name="compare" size={35} /><h2>Your shortlist comes first.</h2><p>Add a vehicle or use the fictional demo to explore your options.</p><a className="primary-link" href="#compare">Choose your cars <Icon name="arrow" size={18} /></a></div>
        : <MatchCard key={`${mode}:${JSON.stringify(scenario)}`} summary={summary} />}
    </div>
    {!!cars.length && <>
      {mode === 'cost' && <OwnershipCosts cars={cars} scenario={scenario} research={result.research} onAdjustFuel={() => {
        const panel = scenarioPanel.current;
        if (!panel) return;
        panel.open = true;
        panel.querySelector('input')?.focus({ preventScroll: true });
        panel.scrollIntoView?.({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }} />}
      <div className="decision-actions"><a className="decision-primary" href="#compare">Compare Your Cars <Icon name="arrow" size={21} /></a></div>
      <details className="decision-details"><summary>Why this result? Sources &amp; checks</summary><div className="decision-detail-content">
        <p>{result.limitation}</p>
        {!!missing.length && <p className="missing-measurements"><strong>Not compared:</strong> {missing.map(c => c.label).join(', ')}. Missing details never count as absent equipment.</p>}
        <DecisionResearch result={result} />
        <div className="ranking-list">{summary.ranking.ranked.map(entry => <article className="ranking-row" key={entry.car.legacyItemId}><div className="ranking-main"><div><h3>{vehicleName(entry.car)}</h3><p>{priceDisplay(entry.car)}</p></div><strong className="ranking-score">{entry.score == null ? 'Unscored' : `${entry.score.toFixed(2)} / 100`}</strong></div><p className="score-basis">{`Preference score | ${(result.evidenceCoverage * 100).toFixed(0)}% evidence coverage${result.provisional ? ' | provisional' : ''}. Not a market valuation or condition rating.`}</p><div className="score-parts">{entry.breakdown.map(c => <span key={c.key}>{c.label}: {c.points.toFixed(1)} × {(c.share * 100).toFixed(1)}% = {c.contribution.toFixed(2)} · {c.evidenceLabel}</span>)}</div><CapabilityComponents entry={entry} result={result} /><ListingWarnings entry={entry} /><VehicleEvidence car={entry.car} scenario={scenario} retryResearch={retryResearch} /><details><summary>Original seller description</summary><p className="inline-description">{entry.car.description || 'No description supplied.'}</p><ListingLink car={entry.car} /></details></article>)}</div>
        <p className="evidence-legend">Model reviews describe tested or typical configurations. They do not verify equipment, condition, accident history or recall completion on these cars.</p>
      </div></details>
      <details className="decision-details scenario-panel" ref={scenarioPanel}><summary>Adjust fuel assumptions &amp; practical needs</summary><ScenarioFields scenario={scenario} setScenario={setScenario} /></details>
    </>}
    <details className="decision-details more-priorities"><summary>How the scoring works</summary><p>{result.limitation}</p><p>Sourced information, model estimates and general baselines contribute to scores. Every eligible car uses the same category factors. Comfort and energy gaps receive labeled estimates; other unavailable factors are excluded. Comfort and Performance never switch to a price-based winner. Coverage is the share of intended scoring weight, not an accuracy estimate. Under 80% of the intended evidence, an unranked contender or a single contender makes the comparison provisional.</p><p>Comfort uses one cross-class scale: 0 severe deficiency, 1 poor, 2 basic, 3 good mainstream, 4 premium, 5 exceptional. Front and rear cushioning count equally where rear seats exist. Passenger and cargo space belong to Practicality. Heating has a neutral allowance when availability is unresolved. Brand, price, marketing and gadget counts do not establish refinement. Broad review sentiment adds no bonus points.</p><p>Category scores and purchase warnings are separate. Seating discrepancies do not demote comfort; serious mechanical concerns mark a category leader review required. Identity/configuration conflicts remain excluded. Unconfirmed equipment is labeled as estimated; no installed equipment is implied. Scores are neither market valuations nor condition inspections.</p></details>
    <p className="decision-footnote">Confirm seller claims and arrange an independent inspection before buying.</p>
  </section>;
}
