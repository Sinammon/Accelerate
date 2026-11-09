import React, { useId } from 'react';

export function Wordmark() {
  const backgroundFilter = useId();
  return <svg className="wordmark" viewBox="200 140 2110 340" role="img" aria-label="Accelerate">
    <title>Accelerate</title>
    <defs>
      <filter id={backgroundFilter} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  10 10 10 0 -0.5" />
      </filter>
      <filter id={`${backgroundFilter}-light`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0.016 0 0 0 0  -0.929 1 0 0 0  -0.867 0 1 0 0  10 10 10 0 -0.5" />
      </filter>
    </defs>
    <image className="logo-on-dark" href="/images/accelerate-logo.png" width="2508" height="627" filter={`url(#${backgroundFilter})`} />
    <image className="logo-on-light" href="/images/accelerate-logo.png" width="2508" height="627" filter={`url(#${backgroundFilter}-light)`} />
  </svg>;
}

export default function Brand({ className = 'brand' }) {
  return <a className={className} href="#import" aria-label="Accelerate home"><Wordmark /></a>;
}
