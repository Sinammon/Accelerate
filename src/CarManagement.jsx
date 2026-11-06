import React, { useRef } from 'react';
import Icon from './Icons.jsx';
import { vehicleName } from './vehicle-data.js';

export default function CarManagement({ cars, onRemove, onDetails }) {
  const panel = useRef(null);
  return <details className="car-management" ref={panel} onKeyDown={event => {
    if (event.key === 'Escape') { panel.current.open = false; panel.current.querySelector('summary')?.focus(); }
  }}><summary aria-label={`Manage ${cars.length} cars`}>Cars ({cars.length}/4)</summary><div className="car-management-popover">
    <ul>{cars.map(car => <li key={car.legacyItemId} data-shortlist-id={car.legacyItemId}><button type="button" className="managed-car-name text-button" onClick={() => { panel.current.open = false; onDetails(car); }}>{vehicleName(car)}</button><button type="button" className="managed-car-remove remove-button" aria-label={`Remove ${vehicleName(car)}`} onClick={() => onRemove(car.legacyItemId)}><Icon name="close" /></button></li>)}</ul>
    {!cars.length && <p>No cars added yet.</p>}<p>Temporary comparison. Refreshing clears your cars and calculator inputs.</p>
  </div></details>;
}
