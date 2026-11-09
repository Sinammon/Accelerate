import React from 'react';

export function Wordmark() {
  return <svg className="wordmark" viewBox="0 170 2185 380" role="img" aria-label="Accelerate"><title>Accelerate</title><image href="/images/accelerate-logo.png" width="2185" height="720" /></svg>;
}

export default function Brand({ className = 'brand' }) {
  return <a className={className} href="#import" aria-label="Accelerate home"><Wordmark /></a>;
}
