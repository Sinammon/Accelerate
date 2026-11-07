import ModelAdvice from './ModelAdvice.jsx';
import React from 'react';
import VehicleDetailsEditor from './VehicleDetailsEditor.jsx';
import { extractVehicleSpecs, FIELD_LABELS } from './vehicle-specs.js';
import VehicleEvidence, { SpecValue, SourceStatus } from './VehicleEvidence.jsx';
import ModelResearch from './ModelResearch.jsx';
import RecallResearch from './RecallResearch.jsx';

const summaryKeys = ['displacement', 'horsepower', 'torque', 'transmission', 'drivetrain', 'bodyType', 'seats'];
export const INDIVIDUAL_CHECKS = 'Current mechanical condition, accident history, maintenance, modifications and recall completion are not verified by these sources. Confirm installed equipment and arrange an independent inspection.';

export default function VehicleSummary({ car, retryResearch, onViewResults, onSaveDetails }) {
  const { specs, features } = extractVehicleSpecs(car);
  const documented = summaryKeys.filter(key => ['vin-record', 'corroborated', 'factory-reference', 'catalog-reference', 'user-entered'].includes(specs[key].status));
  const seller = summaryKeys.filter(key => specs[key].status === 'seller-reported');
  const gaps = summaryKeys.filter(key => specs[key].value == null && specs[key].status !== 'not-applicable');
  const typical = summaryKeys.filter(key => ['model-reference', 'model-context', 'model-estimate'].includes(specs[key].status));
  const amenities = Object.entries(features).filter(([, item]) => item.value === true).map(([name]) => name);
  return <div className="vehicle-summary" data-research-car={car.legacyItemId} tabIndex={-1}>
    <VehicleDetailsEditor car={car} onSaveDetails={onSaveDetails} />
    <SourceStatus car={car} retryResearch={retryResearch} onViewResults={onViewResults} />
    <h3>Reference specifications and your entries</h3>
    {documented.length ? <dl className="summary-specs">{documented.map(key => <div key={key}><dt>{FIELD_LABELS[key]}</dt><dd><SpecValue spec={specs[key]} /></dd></div>)}</dl> : <p>No supported VIN, factory or government reference specifications or user entries for these key details yet.</p>}
    <h3>Listing claims</h3>
    {seller.length ? <dl className="summary-specs">{seller.map(key => <div key={key}><dt>{FIELD_LABELS[key]}</dt><dd><SpecValue spec={specs[key]} /></dd></div>)}</dl> : <p>No uncorroborated key specification claims available.</p>}
    <p>Amenities reported present or standard for this model: {amenities.join(', ') || 'none documented'}. Missing mentions do not mean equipment is absent.</p>
    {!!typical.length && <><h3>Typical and estimated model specifications</h3><dl className="summary-specs">{typical.map(key => <div key={key}><dt>{FIELD_LABELS[key]}</dt><dd><SpecValue spec={specs[key]} /></dd></div>)}</dl><p>Sourced references include citations below. Unverified estimates state their assumptions. Ranges and alternatives are excluded from rankings.</p></>}
    <ModelAdvice car={car} /><ModelResearch car={car} /><RecallResearch key={car.legacyItemId} car={car} />
    <h3>Still to verify on this car</h3><p>{gaps.length ? `Missing or conflicting specifications: ${gaps.map(key => FIELD_LABELS[key]).join(', ')}. ` : ''}{INDIVIDUAL_CHECKS}</p>
    {gaps.some(key => ['horsepower', 'torque'].includes(key)) && <p>{specs.horsepower.reason || specs.torque.reason || 'Power specifications conflict; review the cited claims and confirm the engine with the seller.'}</p>}
    <VehicleEvidence car={car} retryResearch={retryResearch} showStatus={false} />
  </div>;
}
