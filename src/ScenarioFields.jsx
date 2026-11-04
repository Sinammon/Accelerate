import React, { useEffect, useId, useState } from 'react';
import { SCENARIO_BOUNDS, validScenarioValue } from '../shared/experience.js';

function ScenarioInput({ name, label, scenario, setScenario, step = '1' }) {
  const id = useId(), [draft, setDraft] = useState(String(scenario[name]));
  useEffect(() => setDraft(String(scenario[name])), [scenario[name]]);
  const invalid = draft.trim() === '' || !validScenarioValue(name, Number(draft));
  const [min, max] = SCENARIO_BOUNDS[name];
  return <label>{label}<input type="number" min={min} max={max} step={step} value={draft} aria-invalid={invalid || undefined} aria-describedby={invalid ? id : undefined} onChange={event => {
    const value = event.target.value; setDraft(value);
    if (value.trim() && validScenarioValue(name, Number(value))) setScenario({ ...scenario, [name]: Number(value) });
  }} />{invalid && <small id={id} className="scenario-error">Enter {min.toLocaleString('en-CA')}–{max.toLocaleString('en-CA')}. Using your last valid value.</small>}</label>;
}

export default function ScenarioFields({ scenario, setScenario }) {
  return <><div className="scenario-fields">
    <ScenarioInput name="annualKm" label="Annual driving (km)" scenario={scenario} setScenario={setScenario} />
    <ScenarioInput name="pricePerLitre" label="Fuel price (CAD/L)" step="0.01" scenario={scenario} setScenario={setScenario} />
    <ScenarioInput name="pricePerKwh" label="Electricity price (CAD/kWh)" step="0.01" scenario={scenario} setScenario={setScenario} />
    <ScenarioInput name="electricShare" label="Plug-in hybrid electric driving (%)" scenario={scenario} setScenario={setScenario} />
    <label>Seats needed<select value={scenario.minSeats} onChange={e => setScenario({ ...scenario, minSeats: Number(e.target.value) })}>{[2, 4, 5, 6, 7, 8].map(n => <option key={n}>{n}</option>)}</select></label>
    <label>Preferred body<select value={scenario.bodyType} onChange={e => setScenario({ ...scenario, bodyType: e.target.value })}><option value="">No preference</option>{['Sedan', 'Hatchback', 'SUV', 'Wagon', 'Coupe', 'Convertible', 'Pickup', 'Van'].map(body => <option key={body}>{body}</option>)}</select></label>
  </div><p>Editable scenario assumptions, not current energy prices or total ownership costs. The fuel price applies to all liquid fuels. Plug-in hybrids split annual distance between fuel and electric driving. Changes apply in Compare and Decide.</p></>;
}
