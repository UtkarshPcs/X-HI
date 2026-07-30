import React from 'react';

export default function CoordinatePlane({ data }) {
  const isHighlighted = (id) => data?.highlights?.includes(id);
  const getStroke = (id, defaultColor = '#000000') => isHighlighted(id) ? '#EF4444' : defaultColor;
  
  const showLabels = data?.showLabels ?? true;
  const pointerCount = data?.pointerCount ?? 0;

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#000" />
        </marker>
      </defs>
      <g stroke="#e5e5e5" strokeWidth="1">
        {Array.from({length: 11}).map((_, i) => (
          <React.Fragment key={i}>
            <line x1={50 + i * 40} y1="50" x2={50 + i * 40} y2="450" />
            <line x1="50" y1={50 + i * 40} x2="450" y2={50 + i * 40} />
          </React.Fragment>
        ))}
      </g>
      <g id="geometry">
        <line x1="50" y1="250" x2="450" y2="250" stroke={getStroke('x-axis')} strokeWidth="2" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        <line x1="250" y1="50" x2="250" y2="450" stroke={getStroke('y-axis')} strokeWidth="2" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        <circle cx="250" cy="250" r="4" fill={getStroke('origin')} />
      </g>

      {showLabels && (
        <g id="labels" fontSize="16" fontFamily="serif" fontStyle="italic" fill="#000">
          <text x="440" y="270">x</text>
          <text x="260" y="60">y</text>
          <text x="235" y="265">O</text>
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && (
            <g>
              <line x1="330" y1="170" x2="380" y2="120" stroke="#666" strokeDasharray="4 4" />
              <circle cx="380" cy="120" r="12" fill="#fff" stroke="#666" />
              <text x="380" y="125" fontSize="14" textAnchor="middle" fill="#666">1</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
