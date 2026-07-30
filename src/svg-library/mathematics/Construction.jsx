import React from 'react';

export default function Construction({ data }) {
  const isHighlighted = (id) => data?.highlights?.includes(id);
  const getStroke = (id, defaultColor = '#000000') => isHighlighted(id) ? '#EF4444' : defaultColor;

  const showLabels = data?.showLabels ?? true;
  const pointerCount = data?.pointerCount ?? 0;

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g id="geometry">
        <line x1="100" y1="300" x2="400" y2="300" stroke={getStroke('line-segment')} strokeWidth="2" />
        
        <path d="M 150 150 A 200 200 0 0 1 350 150" stroke={getStroke('arc-top')} strokeWidth="1" fill="none" strokeDasharray="5 5" />
        <path d="M 150 450 A 200 200 0 0 0 350 450" stroke={getStroke('arc-bottom')} strokeWidth="1" fill="none" strokeDasharray="5 5" />
        
        <line x1="250" y1="100" x2="250" y2="500" stroke={getStroke('perpendicular-bisector')} strokeWidth="2" />
        
        <circle cx="100" cy="300" r="4" fill={getStroke('point-A')} />
        <circle cx="400" cy="300" r="4" fill={getStroke('point-B')} />
        <circle cx="250" cy="300" r="4" fill={getStroke('point-M')} />
      </g>

      {showLabels && (
        <g id="labels" fontSize="20" fontFamily="serif" fontStyle="italic" fill="#000">
          <text x="90" y="290">A</text>
          <text x="390" y="290">B</text>
          <text x="260" y="325">M</text>
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && (
            <g>
              <line x1="250" y1="200" x2="200" y2="150" stroke="#666" strokeDasharray="4 4" />
              <circle cx="200" cy="150" r="12" fill="#fff" stroke="#666" />
              <text x="200" y="155" fontSize="14" textAnchor="middle" fill="#666">1</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
