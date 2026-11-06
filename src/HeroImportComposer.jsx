import React from 'react';
import Icon from './Icons.jsx';

export default function HeroImportComposer({ cars, page, url, setUrl, loading, error, notice, onSubmit, onDemo }) {
  const hero = page === 'import';
  const full = cars.length >= 4;
  const input = <input id="listing-url" type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="Paste an eBay.ca car link…" required maxLength={2048} disabled={loading || full} aria-invalid={!!error} aria-describedby="input-note import-error" className={hero ? 'min-h-12 w-full bg-transparent py-2 text-base text-secondary-950 placeholder:text-neutral-600 focus-visible:outline-none dark:text-neutral-50 dark:placeholder:text-neutral-300' : ''} />;
  const submitLabel = loading ? 'Importing…' : full ? 'Shortlist full' : hero ? 'Import' : 'Import car';
  return <form className={`url-form ${hero ? 'hero-composer' : ''}`} onSubmit={onSubmit} aria-busy={loading}>
    <label htmlFor="listing-url" className={hero ? 'sr-only' : ''}>{cars.length ? 'Add another car to your shortlist' : 'Your next car starts with a link'}</label>
    {hero ? <div className="input-row flex flex-col items-stretch gap-2 rounded-3xl border-0 bg-neutral-white p-4 shadow-xl shadow-secondary-950/20 focus-within:ring-2 focus-within:ring-primary-600 dark:bg-secondary-800 dark:shadow-black/20 dark:focus-within:ring-primary-400">
      <div className="flex min-w-0 items-center gap-3 px-1"><Icon name="link" size={20} className="text-neutral-500 dark:text-neutral-300" />{input}</div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-neutral-100 px-3 text-xs font-medium text-secondary-900 dark:bg-secondary-700 dark:text-neutral-100"><Icon name="shield" size={13} />eBay.ca</span>
        <span className="hidden rounded-full bg-neutral-100 px-3 py-2 text-xs text-neutral-600 sm:inline-block dark:bg-secondary-700 dark:text-neutral-200">{cars.length ? `${cars.length}/4 added` : 'Up to 4 cars'}</span>
        {!cars.length && <span className="demo-entry m-0"><button type="button" className="text-button min-h-11 w-auto rounded-full border-0 bg-transparent px-3 py-2 text-xs font-normal text-neutral-600 no-underline hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-secondary-700" onClick={onDemo} disabled={loading}>Try fictional demo<Icon name="arrow" size={13} /></button></span>}
        <button type="submit" disabled={loading || full} aria-label={submitLabel} className="ml-auto size-11 min-h-11 w-11 shrink-0 rounded-full border-0 bg-primary-600 p-0 text-white hover:bg-primary-700 disabled:opacity-50 dark:bg-primary-400 dark:text-secondary-950 dark:hover:bg-primary-300">{loading ? <span className="loading-spinner" aria-hidden="true" /> : <Icon name="arrow" size={20} />}<span className="sr-only">{submitLabel}</span></button>
      </div>
    </div> : <div className="input-row"><Icon name="link" size={22} />{input}<button disabled={loading || full} type="submit">{loading && <span className="loading-spinner" aria-hidden="true" />}{submitLabel}{!loading && !full && <Icon name="arrow" size={18} />}</button></div>}
    <p id="input-note" className={`input-note ${hero ? 'mt-4 justify-center text-xs text-secondary-900 dark:text-neutral-200' : ''}`}><Icon name="check" size={14} />No account needed<span>·</span>{cars.length ? `${cars.length}/4 cars added` : '4 cars at a time'}</p>
    <p id="import-error" role="alert" className={`error-message ${hero ? 'rounded-xl bg-neutral-white/90 px-4 py-3 text-center text-secondary-950 dark:bg-secondary-800 dark:text-neutral-50' : ''}`}>{error}</p>
    <p role="status" className={`form-message ${hero ? 'text-center text-secondary-900 dark:text-neutral-200' : ''}`}>{loading ? 'Connecting to eBay and bringing in listing details…' : notice}</p>
    {!hero && !cars.length && <div className="demo-entry"><button type="button" className="text-button" onClick={onDemo} disabled={loading}>Try fictional demo</button><p>Three example cars, real sourced research. Works without eBay credentials or internet research.</p></div>}
  </form>;
}
