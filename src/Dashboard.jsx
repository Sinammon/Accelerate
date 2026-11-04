import React, { useRef } from 'react';
import Icon from './Icons.jsx';
import LandingPreview from './LandingPreview.jsx';
import { dashboardMetrics, researchSources, lightPoints } from './data/dashboard-content.js';

export function Atmosphere({ horizon = false }) {
  return <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${horizon ? 'horizon-atmosphere' : 'hero-atmosphere'}`}>
    {!horizon && <><div className="atmospheric-bloom absolute -inset-x-1/4 -top-1/2 h-full rounded-full opacity-60 blur-3xl motion-reduce:animate-none dark:opacity-40" />{lightPoints.map((position, index) => <span key={position} className={`absolute size-px rounded-full bg-primary-100 ${index % 2 ? 'opacity-30' : 'opacity-50'} ${position}`} />)}</>}
  </div>;
}

function SourceStrip() {
  return <section className="source-strip mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 lg:pb-24" aria-label="Listing and research sources"><p className="mb-7 text-center text-xs text-subdued">Listings, references and research in one place</p><div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-7 sm:gap-x-16 lg:justify-between">{researchSources.map(source => <a key={source.label} href={source.url} target="_blank" rel="noopener noreferrer" className="group flex min-h-11 flex-col items-center gap-1 text-secondary-500 no-underline transition-colors hover:text-primary-700 dark:text-secondary-300 dark:hover:text-primary-300"><span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{source.label}</span><span className="text-xs text-subdued">{source.note}</span></a>)}</div></section>;
}

function MetricGrid() {
  return <dl className="relative grid grid-cols-2 after:pointer-events-none after:absolute after:left-1/2 after:top-1/2 after:size-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-45 after:bg-primary-200 dark:after:bg-secondary-400" aria-label="What Accelerate offers">{dashboardMetrics.map((metric, index) => <div key={metric.label} className={`flex min-w-0 flex-col py-6 ${index < 2 ? 'border-b' : ''} ${index % 2 === 0 ? 'border-r pr-6 sm:pr-10' : 'pl-6 sm:pl-10'} border-neutral-200 dark:border-secondary-700`}><span aria-hidden="true" className="mb-6 block size-2 rounded-full bg-primary-600 dark:bg-primary-400" /><dt className="order-2 mt-4 max-w-52 text-sm leading-relaxed text-subdued">{metric.label}</dt><dd className="order-1 m-0 font-sans text-5xl font-medium leading-none tracking-tight text-secondary-950 sm:text-6xl dark:text-neutral-white">{metric.value}</dd></div>)}</dl>;
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
    <section className="dashboard-hero relative isolate overflow-hidden bg-secondary-950 px-5 pb-24 pt-32 text-white sm:px-8 lg:pt-36" aria-label="Find your next car">
      <Atmosphere />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        <button className="hero-announcement mb-7 inline-flex min-h-11 gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-normal text-white hover:bg-white/10" type="button" onClick={onShowCosts}><span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-secondary-950">NEW</span>Fuel &amp; comfort, estimated<Icon name="arrow" size={14} /></button>
        <h1 tabIndex={-1} className="mb-5 max-w-5xl font-sans text-5xl font-medium leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">Find the right car.<br /><em className="hero-italic font-normal">Without the guesswork.</em></h1>
        <p className="hero-intro mx-auto mb-8 max-w-lg text-base leading-relaxed text-neutral-200">Bring your eBay.ca finds together. Compare fuel costs, comfort and the details that matter to you.</p>
        <div className="w-full max-w-2xl text-left">{importForm}</div>
      </div>
    </section>
    <SourceStrip />
    <section id="how-it-works" className="value-section mx-auto max-w-7xl scroll-mt-28 px-5 pb-16 pt-10 sm:px-8 lg:pb-24 lg:pt-16" aria-labelledby="perspective-heading">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="pt-4"><h2 id="perspective-heading" className="mb-8 max-w-lg font-sans text-4xl font-medium leading-tight tracking-tight text-secondary-950 sm:text-5xl dark:text-neutral-50">The full picture.<br /><em className="hero-italic font-normal text-primary-700 dark:text-primary-400">Your next car,</em><br />in perspective.</h2><button type="button" className="rounded-full border border-neutral-200 bg-transparent px-5 py-3 text-sm font-medium text-secondary-950 hover:bg-neutral-100 dark:border-secondary-700 dark:text-neutral-50 dark:hover:bg-secondary-800" onClick={explore}>Explore the comparison<Icon name="arrow" size={16} /></button></div>
        <MetricGrid />
      </div>
      <details ref={preview} className="dashboard-preview mt-16 border-t border-divider pt-4"><summary className="min-h-11 px-0 py-4 text-sm font-medium text-subdued">How it works · explore the fictional demo</summary><div className="preview-intro mb-6 mt-8"><h2>From a few tabs to a clear choice.</h2><p>Explore Import → Compare → Decide with fictional vehicles.</p></div><LandingPreview onStart={onStart} /></details>
    </section>
    <div className="relative h-56 overflow-hidden bg-secondary-950 sm:h-72 lg:h-80"><Atmosphere horizon /></div>
  </div>;
}
