import React from 'react';

/** A compact version of the dashboard's navy-and-blue atmosphere. */
export default function WorkspaceHeading({ title, description, className = '', children }) {
  return <div className={`workspace-heading ${className}`}>
    <div className="workspace-heading-copy">
      <h1 tabIndex={-1}>{title}</h1>
      <p className="page-intro">{description}</p>
    </div>
    {children}
  </div>;
}
