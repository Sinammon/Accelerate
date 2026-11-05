import React, { useState } from 'react';
import { extractVehicleSpecs, FIELD_LABELS } from './vehicle-specs.js';
import { ESSENTIAL_SPEC_FIELDS } from './spec-applicability.js';
import { validateOverrides, validateDetailOptions } from './vehicle-overrides.js';
import { resolveMileage } from './mileage.js';
import { referenceMarket, sellerMarket } from './reference-market.js';
import { matchSpecCatalog } from './spec-catalog.js';

const options = { market: ['CA', 'US'], engineType: ['V', 'Inline', 'Boxer / flat', 'rotary', 'electric motor'], transmission: ['Automatic', 'Manual', 'CVT', 'Dual-clutch / automated manual'], drivetrain: ['AWD', '4WD', 'FWD', 'RWD'], fuelType: ['Gasoline', 'Diesel', 'Electric', 'Ethanol / flex fuel'], bodyType: ['SUV', 'Hatchback', 'Sedan', 'Coupe', 'Convertible', 'Wagon', 'Pickup', 'Van'] };
const numeric = { year: [1886, new Date().getFullYear() + 1, 1], displacement: [0.1, 20, 0.1], cylinders: [1, 24, 1], horsepower: [1, 3000, 1], torque: [1, 10000, 0.1], curbWeightKg: [100, 20000, 1], transmissionSpeeds: [1, 20, 1], seats: [1, 100, 1] };
export default function VehicleDetailsEditor({ car, onSaveDetails }) {
  const [draft, setDraft] = useState(car.specOverrides || {});
  const [selection, setSelection] = useState(car.catalogSelection || '');
  const [market, setMarket] = useState(car.referenceMarket || '');
  const mileage = resolveMileage(car);
  const [amount, setAmount] = useState(mileage.amount == null ? '' : String(mileage.amount));
  const [unit, setUnit] = useState(mileage.assumedUnit ? '' : mileage.unit || '');
  const [mileageDirty, setMileageDirty] = useState(false);
  const [error, setError] = useState('');
  const { specs } = extractVehicleSpecs(car);
  const catalog = car.enrichment?.catalog;
  const draftSpecs = extractVehicleSpecs({ ...car, specOverrides: draft, enrichment: { vin: car.enrichment?.vin } }).specs;
  const preferredMarket = referenceMarket({ ...car, referenceMarket: market }, draftSpecs);
  const automaticMarket = referenceMarket({ ...car, referenceMarket: undefined }, draftSpecs);
  const candidates = matchSpecCatalog(draftSpecs, car.enrichment?.catalogRows || catalog?.candidates || [], undefined, preferredMarket).candidates;
  const changeDetail = (field, value) => {
    const next = { ...draft, [field]: value };
    const nextSpecs = extractVehicleSpecs({ ...car, specOverrides: next, enrichment: { vin: car.enrichment?.vin } }).specs;
    const nextMatch = matchSpecCatalog(nextSpecs, car.enrichment?.catalogRows || catalog?.candidates || [], selection, referenceMarket({ ...car, referenceMarket: market }, nextSpecs));
    setDraft(next);
    if (selection && !nextMatch.candidates.some(candidate => candidate.id === selection)) setSelection('');
  };
  if (!onSaveDetails || car.demo) return null;
  function save(event) {
    event.preventDefault();
    try {
      const overrides = validateOverrides(draft, Object.fromEntries(['year', 'make', 'model'].map(field => [field, specs[field].value])));
      const choices = validateDetailOptions({ referenceMarket: market, mileageOverride: mileageDirty ? { amount, unit } : car.mileageOverride });
      onSaveDetails(car, overrides, selection || undefined, choices);
      setError('');
    } catch (failure) { setError(failure.message); }
  }
  return <details className="vehicle-details-editor" open={catalog?.status === 'ambiguous' || undefined}><summary>Edit details &amp; confirm configuration</summary><div className="details-editor-content">
    <p>{catalog?.reason || 'Fill missing details or correct the import. Your changes stay in this comparison; the original listing remains in Sources.'}</p>
    <form onSubmit={save}>
      <div className="configuration-choice"><label htmlFor={`reference-market-${car.legacyItemId}`}>Reference market</label><select id={`reference-market-${car.legacyItemId}`} value={market} onChange={event => { setMarket(event.target.value); setSelection(''); }}><option value="">Automatic{automaticMarket ? ` · ${automaticMarket}` : ' · CA and US'}</option><option value="CA">CA · Canada</option><option value="US">US · United States</option></select><small>Defaults to the original market when supplied, otherwise the seller’s country{sellerMarket(car) ? ` (${sellerMarket(car)})` : ''}. This chooses a dataset; it does not establish the car’s original market.</small></div>
      {!!candidates.length && <div className="configuration-choice"><label htmlFor={`configuration-${car.legacyItemId}`}>Which reference configuration matches this car?</label><select id={`configuration-${car.legacyItemId}`} value={selection} onChange={event => setSelection(event.target.value)}><option value="">Keep only shared specifications</option>{candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.market} reference · {candidate.model} · {candidate.values.displacement ? `${candidate.values.displacement} L` : candidate.values.engineType || 'engine unspecified'} · {candidate.values.transmission || 'transmission unspecified'} {candidate.values.transmissionSpeeds || ''} · {candidate.values.drivetrain || 'drive unspecified'} · {candidate.powertrain || candidate.values.fuelType} · {candidate.id}</option>)}</select><small>Reference market describes the dataset. Confirm the car’s original market separately below.</small></div>}
      <div className="details-fields"><div><label htmlFor={`mileage-${car.legacyItemId}`}>Mileage / odometer reading</label><input id={`mileage-${car.legacyItemId}`} type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="any" value={amount} onChange={event => { setAmount(event.target.value); setMileageDirty(true); }} /></div><div><label htmlFor={`mileage-unit-${car.legacyItemId}`}>Mileage unit</label><select id={`mileage-unit-${car.legacyItemId}`} value={unit} onChange={event => { setUnit(event.target.value); setMileageDirty(true); }}><option value="">Choose unit</option><option value="km">km</option><option value="mi">miles</option></select></div></div>
      <small>{mileage.userEntered ? 'User-entered mileage. Reset to restore the imported reading.' : mileage.reason} Editing the reading or unit saves a User-entered correction.</small>
      <div className="details-fields">{['year', 'make', 'model', 'trim', 'market', ...ESSENTIAL_SPEC_FIELDS].map(field => {
        const id = `edit-${car.legacyItemId}-${field}`, current = specs[field];
        if (current.status === 'not-applicable') return <p key={field}>{FIELD_LABELS[field]}: not applicable. {current.reason}</p>;
        const hint = current.value == null ? 'Not supplied' : `${current.value} · ${current.status.replaceAll('-', ' ')}`;
        return <div key={field}><label htmlFor={id}>{FIELD_LABELS[field]}</label>{options[field] ? <select id={id} value={draft[field] ?? ''} onChange={event => changeDetail(field, event.target.value)}><option value="">Keep current: {hint}</option>{options[field].map(value => <option key={value}>{value}</option>)}</select> : <input id={id} type={numeric[field] ? 'number' : 'text'} min={numeric[field]?.[0]} max={numeric[field]?.[1]} step={numeric[field]?.[2]} maxLength={100} placeholder={hint} value={draft[field] ?? ''} onChange={event => changeDetail(field, event.target.value)} />}</div>;
      })}</div>
      {error && <p role="alert">{error}</p>}
      <div className="details-actions"><button type="submit" className="primary-button">Save details &amp; find specifications</button><button type="button" className="text-button" onClick={() => { const original = resolveMileage({ ...car, mileageOverride: undefined }); setDraft({}); setSelection(''); setMarket(''); setAmount(original.amount == null ? '' : String(original.amount)); setUnit(original.assumedUnit ? '' : original.unit || ''); setMileageDirty(false); setError(''); onSaveDetails(car, {}, undefined, {}); }}>Reset to original import</button></div>
      <p><small>Edited values are labeled User-entered. Verify units before saving. We never estimate mileage, accident history or installed options.</small></p>
    </form>
  </div></details>;
}
