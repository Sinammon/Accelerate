import React, { useId } from 'react';

export function Wordmark({ symbol = false }) {
  const backgroundFilter = useId();
  return <svg className={`wordmark${symbol ? ' brand-symbol' : ''}`} viewBox={symbol ? '200 140 630 340' : '200 140 2110 340'} role="img" aria-label="Accelerate">
    <title>Accelerate</title>
    <defs>
      <filter id={backgroundFilter} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  10 10 10 0 -0.5" />
      </filter>
    </defs>
    <image className="logo-artwork" href="/images/accelerate-logo.png" width="2508" height="627" filter={`url(#${backgroundFilter})`} />
  </svg>;
}

export default function Brand({ className = 'brand', symbol = false }) {
  return <a className={className} href="#import" aria-label="Accelerate home"><Wordmark symbol={symbol} /></a>;
}
