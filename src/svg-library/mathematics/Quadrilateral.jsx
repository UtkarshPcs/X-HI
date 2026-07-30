import React from 'react';

export default function Quadrilateral({ data }) {
  const isHighlighted = (id) => data?.highlights?.includes(id);
  const getStroke = (id, defaultColor = '#000000') => isHighlighted(id) ? '#EF4444' : defaultColor;
  const getFill = (id, defaultColor = 'none') => isHighlighted(id) ? 'rgba(239, 68, 68, 0.2)' : defaultColor;

  const showLabels = data?.showLabels ?? true;
  const pointerCount = data?.pointerCount ?? 0;

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g id="geometry">
        <polygon points="150,150 400,150 350,350 100,350" fill={getFill('quad-ABCD')} stroke="none" />
        <line x1="150" y1="150" x2="400" y2="150" stroke={getStroke('side-AB')} strokeWidth="2" />
        <line x1="400" y1="150" x2="350" y2="350" stroke={getStroke('side-BC')} strokeWidth="2" />
        <line x1="350" y1="350" x2="100" y2="350" stroke={getStroke('side-CD')} strokeWidth="2" />
        <line x1="100" y1="350" x2="150" y2="150" stroke={getStroke('side-DA')} strokeWidth="2" />
        
        <circle cx="150" cy="150" r="4" fill={getStroke('point-A')} />
        <circle cx="400" cy="150" r="4" fill={getStroke('point-B')} />
        <circle cx="350" cy="350" r="4" fill={getStroke('point-C')} />
        <circle cx="100" cy="350" r="4" fill={getStroke('point-D')} />
      </g>

      {showLabels && (
        <g id="labels" fontSize="20" fontFamily="serif" fontStyle="italic" fill="#000">
          <text x="135" y="140">A</text>
          <text x="410" y="140">B</text>
          <text x="360" y="370">C</text>
          <text x="80" y="370">D</text>
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && (
            <g>
              <line x1="250" y1="250" x2="250" y2="200" stroke="#666" strokeDasharray="4 4" />
              <circle cx="250" cy="200" r="12" fill="#fff" stroke="#666" />
              <text x="250" y="205" fontSize="14" textAnchor="middle" fill="#666">1</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
