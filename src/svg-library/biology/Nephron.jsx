import React from 'react';

export default function Nephron({ data = {} }) {
  const { highlightIds = [], showLabels = false, pointerCount = 0 } = data;
  const isHighlighted = (id) => highlightIds.includes(id);

  const getStyle = (id) => ({
    stroke: isHighlighted(id) ? '#ef4444' : '#475569',
    strokeWidth: isHighlighted(id) ? 4 : 2,
    fill: 'none'
  });

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g id="nephron">
        <circle cx="100" cy="100" r="30" style={getStyle('glomerulus')} fill={isHighlighted('glomerulus') ? '#fca5a5' : '#cbd5e1'} />
        <path d="M 70 100 A 30 30 0 0 0 130 100 L 150 100" style={getStyle('bowmans-capsule')} />
        <path d="M 150 100 Q 180 80 200 120 T 250 100" style={getStyle('proximal-tubule')} />
        <path d="M 250 100 L 250 350 Q 275 380 300 350 L 300 120" style={getStyle('loop-of-henle')} />
        <path d="M 300 120 Q 330 90 350 130 T 400 120" style={getStyle('distal-tubule')} />
        <path d="M 400 120 L 400 450" style={getStyle('collecting-duct')} strokeWidth={isHighlighted('collecting-duct') ? 6 : 4} />
      </g>
      {showLabels && (
        <g id="labels" fontSize="14" fill="#333" fontFamily="sans-serif">
          <text x="50" y="60">Glomerulus</text>
          <text x="140" y="80">Proximal Tubule</text>
          <text x="180" y="250">Loop of Henle</text>
          <text x="320" y="80">Distal Tubule</text>
          <text x="410" y="250">Collecting Duct</text>
        </g>
      )}
      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && <><path d="M 100 100 L 50 100" stroke="#000" strokeDasharray="4" /><text x="35" y="105">1</text></>}
          {pointerCount >= 2 && <><path d="M 275 350 L 220 350" stroke="#000" strokeDasharray="4" /><text x="205" y="355">2</text></>}
          {pointerCount >= 3 && <><path d="M 400 300 L 450 300" stroke="#000" strokeDasharray="4" /><text x="460" y="305">3</text></>}
        </g>
      )}
    </svg>
  );
}
