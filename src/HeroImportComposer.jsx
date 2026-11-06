import React from 'react';
import Icon from './Icons.jsx';

export default function HeroImportComposer({ cars, url, setUrl, loading, error, notice, onSubmit, onDemo }) {
  const full = cars.length >= 4;
  const submitLabel = loading ? 'Adding car…' : full ? 'Shortlist full' : 'Add car';
  return <form className="url-form hero-composer" onSubmit={onSubmit} aria-busy={loading}>
    <label htmlFor="listing-url">eBay.ca vehicle listing link</label>
    <div className="input-row">
      <input id="listing-url" type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://www.ebay.ca/itm/…" required maxLength={2048} disabled={loading || full} aria-invalid={!!error} aria-describedby="input-note import-error" />
      <button type="submit" disabled={loading || full}>{loading ? <span className="loading-spinner" aria-hidden="true" /> : <Icon name="arrow" />}{submitLabel}</button>
    </div>
    <div className="hero-composer-footer">
      <p id="input-note" className="input-note">{full ? '4/4 cars added · Remove a car to add another' : `${cars.length}/4 cars added · No account needed`}</p>
      {!cars.length && <div className="demo-entry"><button type="button" className="text-button" onClick={onDemo} disabled={loading}>Try fictional demo<Icon name="arrow" /></button></div>}
    </div>
    <p id="import-error" role="alert" className="error-message">{error}</p>
    <p role="status" className="form-message">{loading ? 'Connecting to eBay and bringing in listing details…' : notice}</p>
  </form>;
}
