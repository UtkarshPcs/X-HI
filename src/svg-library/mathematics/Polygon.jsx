import React from 'react';

export default function Polygon({ data }) {
  const isHighlighted = (id) => data?.highlights?.includes(id);
  const getStroke = (id, defaultColor = '#000000') => isHighlighted(id) ? '#EF4444' : defaultColor;
  const getFill = (id, defaultColor = 'none') => isHighlighted(id) ? 'rgba(239, 68, 68, 0.2)' : defaultColor;

  const showLabels = data?.showLabels ?? true;
  const pointerCount = data?.pointerCount ?? 0;

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g id="geometry">
        <polygon points="250,50 440,188 367,411 132,411 60,188" fill={getFill('polygon-ABCDE')} stroke={getStroke('polygon-ABCDE')} strokeWidth="2" />
        
        <circle cx="250" cy="50" r="4" fill={getStroke('point-A')} />
        <circle cx="440" cy="188" r="4" fill={getStroke('point-B')} />
        <circle cx="367" cy="411" r="4" fill={getStroke('point-C')} />
        <circle cx="132" cy="411" r="4" fill={getStroke('point-D')} />
        <circle cx="60" cy="188" r="4" fill={getStroke('point-E')} />
      </g>

      {showLabels && (
        <g id="labels" fontSize="20" fontFamily="serif" fontStyle="italic" fill="#000">
          <text x="245" y="40">A</text>
          <text x="450" y="195">B</text>
          <text x="375" y="430">C</text>
          <text x="115" y="430">D</text>
          <text x="35" y="195">E</text>
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && (
            <g>
              <line x1="250" y1="230" x2="250" y2="180" stroke="#666" strokeDasharray="4 4" />
              <circle cx="250" cy="180" r="12" fill="#fff" stroke="#666" />
              <text x="250" y="185" fontSize="14" textAnchor="middle" fill="#666">1</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
