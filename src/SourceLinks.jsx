import React from 'react';
import { safeUrl } from './vehicle-data.js';

export default function SourceLinks({ sources = [] }) {
  const links = new Map();
  for (const source of sources) {
    const url = safeUrl(source?.url);
    if (url) links.set(url, source.publisher || source.source || new URL(url).hostname);
  }
  if (!links.size) return null;
  return <small className="publisher-links">{[...links].map(([url, publisher], index) => <React.Fragment key={url}>
    {index > 0 && ' · '}<a href={url} target="_blank" rel="noopener noreferrer">{publisher}</a>
  </React.Fragment>)}</small>;
}
