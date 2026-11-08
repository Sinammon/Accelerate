import React, { useRef, useState } from 'react';
import { decisionSummary, entrySummary, PRIMARY_MODES } from './decision-summary.js';
import { vehicleName } from './vehicle-data.js';
import { VehicleImage, vehicleImageUrl } from './VehicleComparison.jsx';
import Icon from './Icons.jsx';
import WorkspaceHeading from './WorkspaceHeading.jsx';
import SourceLinks from './SourceLinks.jsx';

function DecisionItems({ items, label }) {
  return <ol className="decision-reasons" aria-label={label}>{items.map(item => {
    const prefix = `${item.topic}: `;
    const text = item.text.startsWith(prefix) ? item.text.slice(prefix.length) : item.text;
    return <li key={`${item.kind}-${item.key || item.text}`} data-kind={item.kind} className={item.kind === 'warning' ? 'decision-warning-item' : undefined}>
      {item.topic && <><strong className="decision-item-topic">{item.topic}</strong>{' '}</>}{text}
      <SourceLinks sources={item.sources?.length ? item.sources : [item.source]} />
    </li>;
  })}</ol>;
}

function MatchCard({ summary, selectedId, onSelect, onViewSources, onAdjustCosts, onAdjustPracticalNeeds }) {
  const index = Math.max(0, summary.ranking.ranked.findIndex(entry => entry.car.legacyItemId === selectedId));
  const entry = summary.ranking.ranked[index], { car } = entry;
  const endorsed = summary.ranking.best.includes(entry);
  const move = delta => onSelect(summary.ranking.ranked[(index + delta + summary.ranking.ranked.length) % summary.ranking.ranked.length].car.legacyItemId);
  const dialog = useRef(null);
  const photoOpener = useRef(null);
  const notes = entrySummary(summary, entry);
  const mode = summary.requested.mode.id;
  const mainItems = [...notes.reasons.slice(0, 3), ...notes.items.slice(notes.reasons.length)];
  const extraItems = notes.reasons.slice(3);
  const label = entry.identityMismatch ? 'Resolve configuration' : entry.score == null ? 'More information needed' : entry.reviewRequired ? 'Review before choosing'
    : summary.single ? 'Only contender' : !endorsed ? 'Other contender' : summary.provisional ? 'Provisional match' : summary.shared ? 'Equal match' : 'Best category fit';
  const canView = (car.images || []).some((_, i) => vehicleImageUrl(car, i));
  const navigate = (event, action) => { if (action) { event.preventDefault(); action(car); } };
  return <>
    <article className={`decision-match ${endorsed ? 'best-match' : ''}`} data-basis={summary.kind} data-car-id={car.legacyItemId}>
      <div className="decision-photo"><VehicleImage key={car.legacyItemId} car={car} adaptiveFit />{canView && <button ref={photoOpener} type="button" className="view-photo" onClick={() => dialog.current?.showModal()}><Icon name="expand" />View larger photo</button>}{car.demo && <a className="decision-photo-credit" href="/images/preview/credits.html" target="_blank" rel="noreferrer">Model-example photo &middot; credits</a>}</div>
      <div className="decision-match-copy">
        <div className="match-topline"><span className={`recommendation-badge ${entry.reviewRequired || entry.identityMismatch ? 'caution' : ''}`}>{label}</span></div>
        <h2>{vehicleName(car)}</h2>
        {mainItems.length ? <DecisionItems items={mainItems} label={`${PRIMARY_MODES.find(item => item.id === mode).label} information`} /> : <p className="decision-reason">{notes.explanation}</p>}
        {!!extraItems.length && <details className="decision-more" key={`${mode}-${car.legacyItemId}`}><summary>More details</summary><DecisionItems items={extraItems} label="Additional reasons" /></details>}
        <p className="decision-evidence-note">Some details come from listings or estimates.{summary.provisional && ' The ranking is provisional.'}</p>
        <div className="decision-result-actions"><a className="decision-sources-link" href="#compare" onClick={event => navigate(event, onViewSources)}>Sources &amp; checks<Icon name="arrow" /></a>
          {mode === 'cost' && <a className="decision-adjust-costs" href="#ownership" onClick={event => navigate(event, onAdjustCosts)}>Adjust costs<Icon name="arrow" /></a>}
          {mode === 'practical' && <a className="decision-adjust-practical" href="#compare" onClick={event => navigate(event, onAdjustPracticalNeeds)}>Adjust practical needs<Icon name="arrow" /></a>}
        </div>
      </div>
      {summary.ranking.ranked.length > 1 && <div className="decision-card-foot"><span>{index + 1} of {summary.ranking.ranked.length} contenders</span><div className="contender-controls"><button type="button" className="decision-arrow previous" aria-label="Previous contender" onClick={() => move(-1)}><Icon name="chevron" />Previous</button><button type="button" className="decision-arrow next" aria-label="Next contender" onClick={() => move(1)}>Next<Icon name="chevron" /></button></div></div>}
    </article>
    <dialog className="decision-photo-dialog" ref={dialog} aria-label={`Larger photos of ${vehicleName(car)}`} onClose={() => photoOpener.current?.focus({ preventScroll: true })} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) dialog.current.close();
    }}><button type="button" autoFocus onClick={() => dialog.current.close()} aria-label="Close larger photo">Close<Icon name="close" /></button><VehicleImage key={`large-${car.legacyItemId}`} car={car} /></dialog>
  </>;
}

export default function DecisionDashboard({ cars, mode = 'value', setMode, scenario, view: suppliedView, onViewChange, ownership, onViewSources, onAdjustCosts, onAdjustPracticalNeeds }) {
  const [localView, setLocalView] = useState({ selectedId: null });
  const view = suppliedView || localView, changeView = onViewChange || setLocalView;
  const summary = decisionSummary(cars, mode, new Date().getFullYear(), scenario, ownership);
  return <section className="page-section decision-page focused-decision">
    <WorkspaceHeading className="decision-heading" title="Your recommendation" description="Choose a priority to see the points that matter.">
      <a className="back-link" href="#ownership">Cost of Ownership<Icon name="arrow" /></a>
    </WorkspaceHeading>
    <div className="priority-picker"><span id="priority-label">What matters most?</span><div className="mode-grid" role="group" aria-labelledby="priority-label">{PRIMARY_MODES.map(item => <button type="button" key={item.id} className={`mode-card ${summary.requested.mode.id === item.id ? 'selected' : ''}`} data-mode={item.id} aria-pressed={summary.requested.mode.id === item.id} onClick={() => setMode?.(item.id)}><strong>{item.label}</strong></button>)}</div></div>
    <div className="decision-result" aria-live="polite" aria-atomic="false">
      {!cars.length ? <div className="decision-empty result-banner"><h2>Your shortlist comes first</h2><p>Add a vehicle or use the fictional demo to explore your options.</p><a className="primary-link" href="#compare">Choose your cars<Icon name="arrow" /></a></div>
        : <MatchCard summary={summary} selectedId={view.selectedId} onSelect={selectedId => changeView(previous => ({ ...previous, selectedId }))} onViewSources={onViewSources} onAdjustCosts={onAdjustCosts} onAdjustPracticalNeeds={onAdjustPracticalNeeds} />}
    </div>
  </section>;
}
