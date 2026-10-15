// src/pages/bus/Placeholder.jsx
import React from 'react';

export default function Placeholder({ title, description }) {
  return (
    <div className="bus-panel">
      <h3>{title}</h3>
      <p className="bus-empty-inline">
        {description || 'This screen is ready to be built.'}
      </p>
    </div>
  );
}