// src/pages/cab/Placeholder.jsx
import React from 'react';

export default function Placeholder({ title, description }) {
  return (
    <div className="cab-panel">
      <h3>{title}</h3>
      <p className="cab-empty-inline">
        {description || 'This screen is ready to be built.'}
      </p>
    </div>
  );
}