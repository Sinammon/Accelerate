import React, { useRef } from 'react';
import Icon from './Icons.jsx';
import LandingPreview from './LandingPreview.jsx';
import { dashboardMetrics, researchSources } from './data/dashboard-content.js';

export function Atmosphere({ horizon = false }) {
  return <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${horizon ? 'horizon-atmosphere' : 'hero-atmosphere'}`}>
    {!horizon && <div className="atmospheric-bloom absolute -inset-x-1/4 -top-1/2 h-full rounded-full opacity-60 blur-3xl dark:opacity-40" />}
  </div>;
}

function SourceStrip() {
  return <section className="source-strip mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8 lg:pb-16" aria-label="Listing and research sources"><p className="mb-6 text-center text-sm text-subdued">Listings, references and research in one place</p><div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-6 sm:gap-x-16 lg:justify-between">{researchSources.map(source => <a key={source.label} href={source.url} target="_blank" rel="noopener noreferrer" className="group flex min-h-11 flex-col items-center gap-1 text-subdued no-underline transition-colors hover:text-content"><span className="font-sans text-lg font-medium sm:text-xl">{source.label}</span><span className="text-xs text-subdued">{source.note}</span></a>)}</div></section>;
}

function MetricGrid() {
  return <dl className="grid grid-cols-2" aria-label="What Accelerate offers">{dashboardMetrics.map((metric, index) => <div key={metric.label} className={`flex min-w-0 flex-col py-6 ${index < 2 ? 'border-b' : ''} ${index % 2 === 0 ? 'border-r pr-6 sm:pr-8' : 'pl-6 sm:pl-8'} border-divider`}><dt className="order-2 mt-3 max-w-52 text-sm leading-relaxed text-subdued">{metric.label}</dt><dd className="order-1 m-0 font-sans text-4xl font-medium leading-none text-content tabular-nums sm:text-5xl">{metric.value}</dd></div>)}</dl>;
}

export default function Dashboard({ importForm, onStart, onShowCosts }) {
  const preview = useRef(null);
  function explore() {
    if (!preview.current) return;
    preview.current.open = true;
    preview.current.querySelector('summary')?.focus({ preventScroll: true });
    preview.current.scrollIntoView?.({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <div className="dashboard bg-neutral-50 text-secondary-950 dark:bg-secondary-950 dark:text-neutral-50">
    <section className="dashboard-hero relative isolate overflow-hidden bg-secondary-950 px-5 pb-16 pt-28 text-white sm:px-8 lg:pb-20 lg:pt-32" aria-label="Find your next car">
      <Atmosphere />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        <h1 tabIndex={-1} className="hero-headline mb-6 font-sans font-medium text-white">Compare your eBay.ca shortlist</h1>
        <p className="hero-intro mx-auto mb-8 max-w-lg text-base leading-relaxed text-neutral-200">Bring up to four listings together. Compare seller details, running costs and the evidence behind each recommendation.</p>
        <div className="w-full max-w-2xl text-left">{importForm}</div>
      </div>
    </section>
    <SourceStrip />
    <section id="how-it-works" className="value-section mx-auto max-w-7xl scroll-mt-28 px-5 pb-16 pt-10 sm:px-8 lg:pb-24 lg:pt-16" aria-labelledby="perspective-heading">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="pt-4"><h2 id="perspective-heading" className="mb-6 max-w-lg font-sans text-4xl font-medium leading-tight tracking-tight text-content sm:text-5xl">Compare the cars you’re considering</h2><p className="mb-6 max-w-md text-base text-subdued">Keep the asking price, everyday costs and model research together, with sources and estimates clearly labeled.</p><div className="editorial-actions"><button type="button" className="text-button" onClick={explore}>Explore the comparison<Icon name="arrow" /></button><button type="button" className="inline-button" onClick={onShowCosts}>Fuel and comfort estimates<Icon name="arrow" /></button></div></div>
        <MetricGrid />
      </div>
      <details ref={preview} className="dashboard-preview mt-16 border-t border-divider pt-4"><summary className="min-h-11 px-0 py-4 text-sm font-medium text-subdued">How it works · explore the fictional demo</summary><div className="preview-intro mb-6 mt-8"><h2>From listings to a shortlist</h2><p>Explore Import → Compare → Decide with fictional vehicles.</p></div><LandingPreview onStart={onStart} /></details>
    </section>
    <div className="relative h-56 overflow-hidden bg-secondary-950 sm:h-72 lg:h-80"><Atmosphere horizon /></div>
  </div>;
}
