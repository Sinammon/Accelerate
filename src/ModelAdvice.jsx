import React from 'react';
import { modelAdviceSummary } from './model-advice.js';
import SourceLinks from './SourceLinks.jsx';

export default function ModelAdvice({ car }) {
  const observations = modelAdviceSummary(car);
  return <section className="model-advice" aria-label="Model advice">
    <h3>Model advice</h3>
    {observations.length ? <><ul>{observations.map(note => <li key={note.text}><strong>{note.topic}</strong><p>{note.text}</p>{note.checked && <small>Checked {new Date(note.checked).toLocaleDateString('en-CA')}</small>}<SourceLinks sources={note.sources} /></li>)}</ul></>
      : <p>Model guidance is not available yet. Confirm service history, engine variant and condition with the seller and an independent inspection.</p>}
  </section>;
}
