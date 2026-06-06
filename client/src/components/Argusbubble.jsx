import { useState } from 'react';

export default function Argusbubble({ message, severity = 'info', dismissible = true }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={`argus-bubble ${severity}`} role="status">
      <p className="argus-bubble-text">{message}</p>
      {dismissible && (
        <button
          className="argus-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
