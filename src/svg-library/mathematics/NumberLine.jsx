import React from 'react';

export default function NumberLine({ data }) {
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
      
      <g id="geometry">
        <line x1="50" y1="250" x2="450" y2="250" stroke={getStroke('line')} strokeWidth="2" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(num => (
          <line key={num} x1={250 + num * 40} y1="245" x2={250 + num * 40} y2="255" stroke={getStroke(`tick-${num}`)} strokeWidth="2" />
        ))}
      </g>

      {showLabels && (
        <g id="labels" fontSize="14" fontFamily="serif" textAnchor="middle" fill="#000">
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(num => (
             <text key={num} x={250 + num * 40} y="275">{num}</text>
          ))}
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && (
            <g>
              <line x1="250" y1="250" x2="250" y2="180" stroke="#666" strokeDasharray="4 4" />
              <circle cx="250" cy="180" r="12" fill="#fff" stroke="#666" />
              <text x="250" y="185" fontSize="14" textAnchor="middle" fill="#666">1</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
