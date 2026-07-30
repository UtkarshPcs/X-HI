import React from 'react';

export default function Angle({ data }) {
  const isHighlighted = (id) => data?.highlights?.includes(id);
  const getStroke = (id, defaultColor = '#000000') => isHighlighted(id) ? '#EF4444' : defaultColor;
  const getFill = (id, defaultColor = 'none') => isHighlighted(id) ? 'rgba(239, 68, 68, 0.2)' : defaultColor;

  const showLabels = data?.showLabels ?? true;
  const pointerCount = data?.pointerCount ?? 0;

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#000" />
        </marker>
        <marker id="arrow-highlight" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
        </marker>
      </defs>
      
      <g id="geometry">
        <path d="M 290 350 A 40 40 0 0 0 221.7 321.7" fill={getFill('angle-AOB')} stroke={getStroke('angle-AOB')} strokeWidth="2" />
        <line x1="250" y1="350" x2="450" y2="350" stroke={getStroke('ray-OA')} strokeWidth="2" markerEnd={`url(#${isHighlighted('ray-OA') ? 'arrow-highlight' : 'arrow'})`} />
        <line x1="250" y1="350" x2="108" y2="208" stroke={getStroke('ray-OB')} strokeWidth="2" markerEnd={`url(#${isHighlighted('ray-OB') ? 'arrow-highlight' : 'arrow'})`} />
        <circle cx="250" cy="350" r="4" fill={getStroke('point-O')} />
      </g>

      {showLabels && (
        <g id="labels" fontSize="20" fontFamily="serif" fontStyle="italic" fill="#000">
          <text x="240" y="375">O</text>
          <text x="430" y="340">A</text>
          <text x="120" y="195">B</text>
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && (
            <g>
              <line x1="270" y1="330" x2="310" y2="260" stroke="#666" strokeDasharray="4 4" />
              <circle cx="310" cy="260" r="12" fill="#fff" stroke="#666" />
              <text x="310" y="265" fontSize="14" textAnchor="middle" fill="#666">1</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
