import React from 'react';

export function Wordmark() {
  return <span className="wordmark">Accelerate</span>;
}

export default function Brand({ className = 'brand', showMark = false }) {
  return <a className={className} href="#import" aria-label="Accelerate home">
    {showMark && <svg className="brand-mark" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <path className="brand-mark-tile" d="M10 2h15a6 6 0 0 1 6 7l-3 15a7 7 0 0 1-7 6H5a4 4 0 0 1-4-5L4 8a7 7 0 0 1 6-6Z" />
      <path className="brand-mark-letter" fillRule="evenodd" d="M8 23 15.8 9h4L23 23h-3.8l-.6-3h-5l-1.6 3H8Zm7.1-6h2.8l-.8-4-2 4Z" />
    </svg>}
    <Wordmark />
  </a>;
}
