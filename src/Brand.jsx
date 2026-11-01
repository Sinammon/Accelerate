import React from 'react';

export function CoreLogo({ small = false }) {
  return <span className={`brand-logo${small ? ' brand-logo--small' : ''}`} aria-hidden="true"><img src="/images/brand/core-logo.png" alt="" width="1536" height="1024" decoding="async" /></span>;
}

export default function Brand({ className = 'brand', small = false }) {
  return <a className={className} href="#import" aria-label="Core home"><CoreLogo small={small} />Core</a>;
}
