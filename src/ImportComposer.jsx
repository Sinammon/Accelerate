import React from 'react';
import Icon from './Icons.jsx';
import HeroImportComposer from './HeroImportComposer.jsx';

export default function ImportComposer(props) {
  if (props.page === 'import') return <HeroImportComposer {...props} />;
  const { cars, url, setUrl, loading, error, notice, onSubmit, onDemo } = props;
  const full = cars.length >= 4;
  const submitLabel = loading ? 'Adding car…' : full ? 'Shortlist full' : 'Add car';
  return <form className="url-form compact-composer" onSubmit={onSubmit} aria-busy={loading}>
    <label htmlFor="listing-url">eBay.ca vehicle listing link</label>
    <div className="input-row"><Icon name="link" size={20} /><input id="listing-url" type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://www.ebay.ca/itm/…" required maxLength={2048} disabled={loading || full} aria-invalid={!!error} aria-describedby="input-note import-error" /><button disabled={loading || full} type="submit">{loading ? <span className="loading-spinner" aria-hidden="true" /> : <Icon name="arrow" size={18} />}{submitLabel}</button></div>
    <p id="input-note" className="input-note">Paste the full listing URL. {full ? 'Remove a car before adding another.' : `${cars.length}/4 cars added · No account needed.`}</p>
    <p id="import-error" role="alert" className="error-message">{error}</p>
    <p role="status" className="form-message">{loading ? 'Connecting to eBay and bringing in listing details…' : notice}</p>
    {!cars.length && <div className="demo-entry"><button type="button" className="text-button nav-demo" onClick={onDemo} disabled={loading}>Try fictional demo <Icon name="arrow" size={16} /></button><p>Explore with example listings and sourced model research.</p></div>}
  </form>;
}
