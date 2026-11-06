import React, { useRef } from 'react';

/** Arrow keys move focus and selection together; all panels keep stable IDs. */
export default function WorkspaceTabs({ id, label, tabs, value, onChange }) {
  const buttons = useRef([]);
  function keyDown(event, index) {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : event.key === 'ArrowRight' ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : null;
    if (next == null) return;
    event.preventDefault();
    onChange(tabs[next][0]);
    buttons.current[next]?.focus();
  }
  return <div className="workspace-tabs" role="tablist" aria-label={label}>{tabs.map(([key, title], index) =>
    <button key={key} ref={element => { buttons.current[index] = element; }} type="button" id={`${id}-tab-${key}`} role="tab" aria-selected={value === key} aria-controls={`${id}-panel-${key}`} tabIndex={value === key ? 0 : -1} onClick={() => onChange(key)} onKeyDown={event => keyDown(event, index)}>{title}</button>
  )}</div>;
}

export function WorkspacePanel({ id, value, active, children, className = '' }) {
  return <div id={`${id}-panel-${value}`} role="tabpanel" aria-labelledby={`${id}-tab-${value}`} hidden={active !== value} tabIndex={0} className={`workspace-panel ${className}`}>{children}</div>;
}
