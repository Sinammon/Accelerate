import React, { useState } from 'react';
import { vehicleName, priceDisplay } from './vehicle-data.js';
import { VehicleImage } from './VehicleComparison.jsx';
import { detectWarnings } from './decision-engine.js';
import Icon from './Icons.jsx';

export default function Shortlist({ cars, onAdd, onRemove, onDetails, loading }) {
  const [expanded, setExpanded] = useState(false);
  return <aside className={`shortlist-rail ${expanded ? 'is-expanded' : ''}`} aria-label="Your shortlist">
    <div className="shortlist-heading"><h2>Your shortlist <span>{cars.length}/4</span></h2><button type="button" className="shortlist-toggle text-button" aria-expanded={expanded} aria-controls="shortlist-content" onClick={() => setExpanded(open => !open)}>{expanded ? 'Hide cars' : 'Show cars'}<Icon name="chevron" size={16} /></button></div>
    <div id="shortlist-content" className="shortlist-content">
      {cars.length ? <ul className="shortlist-list">{cars.map(car => {
        const warnings = detectWarnings(car);
        return <li key={car.legacyItemId} data-shortlist-id={car.legacyItemId}>
          <VehicleImage key={car.legacyItemId} car={car} />
          <div className="shortlist-car-copy"><button type="button" className="shortlist-car-name" onClick={() => onDetails(car)}>{vehicleName(car)}</button><strong>{priceDisplay(car)}</strong>
            {warnings.length > 0 && <button type="button" className="shortlist-warning" onClick={() => onDetails(car)}>{warnings.length} {warnings.length === 1 ? 'concern' : 'concerns'} to review</button>}
            {['loading', 'loading-model'].includes(car.enrichment?.status) && <small role="status">Checking details…</small>}
          </div>
          <button type="button" className="shortlist-remove remove-button" aria-label={`Remove ${vehicleName(car)}`} onClick={() => onRemove(car.legacyItemId)}><Icon name="close" size={16} /></button>
        </li>;
      })}</ul> : <p className="shortlist-empty">Add a few cars you’re considering. They’ll stay here as you compare.</p>}
      <button type="button" className="shortlist-add add-car" onClick={onAdd} disabled={cars.length >= 4 || loading}><Icon name="link" size={17} />{cars.length >= 4 ? 'Shortlist full' : 'Add a car'}</button>
      {cars.length >= 4 && <p className="shortlist-hint">Remove a car to add another.</p>}
      <p className="shortlist-hint">Temporary shortlist. Refreshing clears your cars and calculator inputs.</p>
      {cars.some(car => car.demo) && <a className="shortlist-credits" href="/images/preview/credits.html" target="_blank" rel="noreferrer">Demo photo credits</a>}
    </div>
  </aside>;
}
