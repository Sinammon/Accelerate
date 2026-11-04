import React from 'react';
import { resolveVehicleExperience, experienceLabel } from './vehicle-experience.js';
import { safeUrl } from './vehicle-data.js';
import { DEFAULT_SCENARIO } from '../shared/experience.js';

export const COMFORT_TOPICS = [['rideQuality', 'Ride quality'], ['seatComfort', 'Seat cushioning'], ['seatHeating', 'Seat heating'], ['cabinQuietness', 'Cabin quietness']];
const money = amount => `$${amount.toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD`;
export const annualCostLabel = energy => energy.powertrain === 'electric' ? 'Estimated annual charging cost' : energy.powertrain === 'phev' ? 'Estimated annual fuel + charging cost' : energy.powertrain === 'mixed' ? 'Estimated annual fuel / charging cost' : 'Estimated annual fuel cost';

export function ExperienceCost({ experience, scenario = DEFAULT_SCENARIO }) {
  const { energy } = experience;
  const s = { ...DEFAULT_SCENARIO, ...scenario };
  return <div className="experience-cost"><strong>{Number.isFinite(energy.annualCost) ? `${money(energy.annualCost)}/year` : 'Check driving and price assumptions'}</strong><small>{experienceLabel(energy)} · {s.annualKm.toLocaleString('en-CA')} km/year</small><small>{energy.powertrain !== 'electric' && `$${s.pricePerLitre.toFixed(2)}/L`}{energy.powertrain === 'phev' || energy.powertrain === 'mixed' ? ' + ' : ''}{energy.powertrain !== 'liquid' && `$${s.pricePerKwh.toFixed(2)}/kWh`}{energy.powertrain === 'phev' && ` · ${s.electricShare}% electric driving`}</small></div>;
}

export function ComfortDetail({ experience, topic }) {
  if (topic === 'seatComfort') {
    const front = experience.ratings.frontSeatComfort, rear = experience.ratings.rearSeatComfort;
    return <><strong>{experience.seatComfort.toFixed(1)} / 5</strong><small>{[...new Set([front, rear].filter(Boolean).map(experienceLabel))].join(' + ')}</small><p>Front: {front.rationale}{rear && <> Rear: {rear.rationale}</>}</p></>;
  }
  const rating = experience.ratings[topic];
  return <><strong>{topic === 'seatHeating' ? ({ present: 'Reported present', absent: 'Absent / not working', likely: 'Likely available', unlikely: 'Unlikely available', 'trim-dependent': 'Trim-dependent' })[rating.availability] : `${rating.rating.toFixed(1)} / 5`}</strong><small>{experienceLabel(rating)}</small><p>{rating.rationale}</p></>;
}

export function PracticalitySummary({ experience }) {
  return <div className="experience-practicality"><strong>Passenger room {experience.passengerSpace.toFixed(1)} / 5 · Cargo {experience.ratings.cargoSpace.rating.toFixed(1)} / 5</strong><small>{[...new Set([experience.ratings.frontPassengerSpace, experience.ratings.rearPassengerSpace, experience.ratings.cargoSpace, experience.practicality].filter(Boolean).map(experienceLabel))].join(' + ')}</small><p>{experience.ratings.frontPassengerSpace.rationale}{experience.ratings.rearPassengerSpace && <> {experience.ratings.rearPassengerSpace.rationale}</>} {experience.ratings.cargoSpace.rationale}</p><p>{experience.practicality.rationale}</p></div>;
}

export function ExperienceAssumptions({ experience }) {
  const records = [experience.energy, ...Object.values(experience.ratings), experience.practicality];
  const assumptions = [...new Set(records.flatMap(record => record.assumptions || []))];
  const sources = [...new Map(records.flatMap(record => record.evidence || []).filter(e => safeUrl(e.url)).map(e => [e.url, e])).values()];
  return <details className="experience-assumptions"><summary>Estimate assumptions &amp; sources</summary><p>{experience.energy.rationale}</p>{assumptions.map(text => <p key={text}>{text}</p>)}<p>Model estimates and general baselines fill gaps and can affect rankings. They do not verify installed equipment or current condition.</p>{sources.map(source => <p key={source.url}><a href={safeUrl(source.url)} target="_blank" rel="noopener noreferrer">{source.source || source.publisher || 'Reference source'}</a></p>)}</details>;
}

export default function VehicleExperience({ car, scenario = DEFAULT_SCENARIO, showPracticality = false }) {
  const experience = resolveVehicleExperience(car, scenario);
  return <section className="vehicle-experience" aria-label="Running costs and comfort">
    <h3>{annualCostLabel(experience.energy)}</h3><ExperienceCost experience={experience} scenario={scenario} />
    <h3>Comfort</h3><dl className="experience-comfort">{COMFORT_TOPICS.map(([topic, label]) => <div key={topic}><dt>{label}</dt><dd><ComfortDetail experience={experience} topic={topic} /></dd></div>)}</dl>
    {showPracticality && <><h3>Practicality</h3><PracticalitySummary experience={experience} /></>}
    <ExperienceAssumptions experience={experience} />
  </section>;
}
