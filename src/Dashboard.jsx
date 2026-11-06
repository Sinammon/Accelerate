import React from 'react';
import LandingPreview from './LandingPreview.jsx';
import { researchSources } from './data/dashboard-content.js';

export default function Dashboard({ importForm, onStart }) {
  return <section className="dashboard import-workspace" aria-labelledby="import-heading">
    <div className="import-introduction"><h1 id="import-heading" tabIndex={-1}>Find the right car.</h1><p>Bring your eBay.ca finds together. Compare up to four cars, understand the trade-offs, and plan what you can afford.</p></div>
    <div className="import-surface">{importForm}</div>
    <p className="import-next">Add a listing → Compare the essentials → Choose what matters to you</p>
    <details className="workspace-help"><summary>Help · how Accelerate works</summary>
      <div className="help-content"><h2>A clearer choice, with the evidence in reach.</h2><p>Compare shows your cars side by side. Recommendation explains which fits your priorities. Costs separates the money needed to buy from the expenses of running a car.</p><p>Estimates stay labeled. Seller claims and model references do not verify a car’s condition. Confirm the details and arrange an independent inspection before buying.</p>
        <p>No account required. Your shortlist and calculator inputs stay in memory and are cleared when you refresh.</p>
        <h3>Listing and research sources</h3><ul>{researchSources.map(source => <li key={source.label}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a> — {source.note}</li>)}</ul>
        <details className="dashboard-preview"><summary>Explore the fictional walkthrough</summary><LandingPreview onStart={onStart} /></details>
      </div>
    </details>
  </section>;
}
