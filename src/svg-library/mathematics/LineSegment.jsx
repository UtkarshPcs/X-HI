import React from 'react';

export default function LineSegment({ data }) {
  const isHighlighted = (id) => data?.highlights?.includes(id);
  const getStroke = (id, defaultColor = '#000000') => isHighlighted(id) ? '#EF4444' : defaultColor;

  const showLabels = data?.showLabels ?? true;
  const pointerCount = data?.pointerCount ?? 0;

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g id="geometry">
        <line x1="100" y1="250" x2="400" y2="250" stroke={getStroke('segment-AB')} strokeWidth="3" />
        <circle cx="100" cy="250" r="4" fill={getStroke('point-A')} />
        <circle cx="400" cy="250" r="4" fill={getStroke('point-B')} />
      </g>

      {showLabels && (
        <g id="labels" fontSize="20" fontFamily="serif" fontStyle="italic" fill="#000">
          <text x="90" y="240">A</text>
          <text x="390" y="240">B</text>
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
