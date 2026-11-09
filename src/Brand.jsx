import React from 'react';

export function Wordmark() {
  return <svg className="wordmark" viewBox="140 430 1150 195" role="img" aria-label="Accelerate"><title>Accelerate</title><image href="/images/accelerate-logo.png" width="1448" height="1086" /></svg>;
}

export default function Brand({ className = 'brand' }) {
  return <a className={className} href="#import" aria-label="Accelerate home"><Wordmark /></a>;
}
