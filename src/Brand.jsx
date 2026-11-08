import React from 'react';

export function Wordmark() {
  return <span className="wordmark">Accelerate</span>;
}

export default function Brand({ className = 'brand' }) {
  return <a className={className} href="#import" aria-label="Accelerate home"><Wordmark /></a>;
}
