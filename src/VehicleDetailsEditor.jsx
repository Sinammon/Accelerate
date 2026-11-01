import React, { useState } from 'react';
import { extractVehicleSpecs, FIELD_LABELS } from './vehicle-specs.js';
import { ESSENTIAL_SPEC_FIELDS } from './spec-applicability.js';
import { validateOverrides } from './vehicle-overrides.js';

const options = { market: ['CA', 'US'], engineType: ['V', 'Inline', 'Boxer / flat', 'rotary', 'electric motor'], transmission: ['Automatic', 'Manual', 'CVT', 'Dual-clutch / automated manual'], drivetrain: ['AWD', '4WD', 'FWD', 'RWD'], fuelType: ['Gasoline', 'Diesel', 'Electric', 'Ethanol / flex fuel'], bodyType: ['SUV', 'Hatchback', 'Sedan', 'Coupe', 'Convertible', 'Wagon', 'Pickup', 'Van'] };
const numeric = { year: [1886, new Date().getFullYear() + 1, 1], displacement: [0.1, 20, 0.1], cylinders: [1, 24, 1], horsepower: [1, 3000, 1], torque: [1, 10000, 0.1], curbWeightKg: [100, 20000, 1], transmissionSpeeds: [1, 20, 1], seats: [1, 100, 1] };
export default function VehicleDetailsEditor({ car, onSaveDetails }) {
  const [draft, setDraft] = useState(car.specOverrides || {});
  const [selection, setSelection] = useState(car.catalogSelection || '');
  const [error, setError] = useState('');
  const { specs } = extractVehicleSpecs(car);
  const catalog = car.enrichment?.catalog;
  if (!onSaveDetails || car.demo) return null;
  function save(event) {
    event.preventDefault();
    try {
      const overrides = validateOverrides(draft, Object.fromEntries(['year', 'make', 'model'].map(field => [field, specs[field].value])));
      onSaveDetails(car, overrides, selection || undefined);
      setError('');
    } catch (failure) { setError(failure.message); }
  }
  return <details className="vehicle-details-editor" open={catalog?.status === 'ambiguous' || undefined}><summary>Edit details &amp; confirm configuration</summary><div className="details-editor-content">
    <p>{catalog?.reason || 'Fill missing details or correct the import. Your changes stay in this comparison; the original listing remains in Sources.'}</p>
    <form onSubmit={save}>
      {!!catalog?.candidates?.length && <div className="configuration-choice"><label htmlFor={`configuration-${car.legacyItemId}`}>Which reference configuration matches this car?</label><select id={`configuration-${car.legacyItemId}`} value={selection} onChange={event => setSelection(event.target.value)}><option value="">Keep only shared specifications</option>{catalog.candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.market} reference · {candidate.model} · {candidate.values.displacement ? `${candidate.values.displacement} L` : candidate.values.engineType || 'engine unspecified'} · {candidate.values.transmission || 'transmission unspecified'} {candidate.values.transmissionSpeeds || ''} · {candidate.values.drivetrain || 'drive unspecified'} · {candidate.powertrain || candidate.values.fuelType} · {candidate.id}</option>)}</select><small>Reference market describes the dataset. Confirm the car’s original market separately below.</small></div>}
      <div className="details-fields">{['year', 'make', 'model', 'trim', 'market', ...ESSENTIAL_SPEC_FIELDS].map(field => {
        const id = `edit-${car.legacyItemId}-${field}`, current = specs[field];
        if (current.status === 'not-applicable') return <p key={field}>{FIELD_LABELS[field]}: not applicable. {current.reason}</p>;
        const hint = current.value == null ? 'Not supplied' : `${current.value} · ${current.status.replaceAll('-', ' ')}`;
        return <div key={field}><label htmlFor={id}>{FIELD_LABELS[field]}</label>{options[field] ? <select id={id} value={draft[field] ?? ''} onChange={event => setDraft({ ...draft, [field]: event.target.value })}><option value="">Keep current: {hint}</option>{options[field].map(value => <option key={value}>{value}</option>)}</select> : <input id={id} type={numeric[field] ? 'number' : 'text'} min={numeric[field]?.[0]} max={numeric[field]?.[1]} step={numeric[field]?.[2]} maxLength={100} placeholder={hint} value={draft[field] ?? ''} onChange={event => setDraft({ ...draft, [field]: event.target.value })} />}</div>;
      })}</div>
      {error && <p role="alert">{error}</p>}
      <div className="details-actions"><button type="submit" className="primary-button">Save details &amp; find specifications</button><button type="button" className="text-button" onClick={() => { setDraft({}); setSelection(''); onSaveDetails(car, {}, undefined); }}>Reset to original import</button></div>
      <p><small>Edited values are labeled User-entered. Verify units before saving. We never estimate mileage, accident history or installed options.</small></p>
    </form>
  </div></details>;
}
