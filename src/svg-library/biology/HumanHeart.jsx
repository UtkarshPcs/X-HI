import React from 'react';

export default function HumanHeart({ data = {} }) {
  const { highlightIds = [], showLabels = false, pointerCount = 0 } = data;
  const isHighlighted = (id) => highlightIds.includes(id);

  const getStyle = (id, baseFill) => ({
    stroke: isHighlighted(id) ? '#ef4444' : '#333333',
    strokeWidth: isHighlighted(id) ? 4 : 2,
    fill: isHighlighted(id) ? '#fecaca' : baseFill
  });

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g id="heart">
        <path d="M 150 200 C 150 100, 250 200, 250 250 C 200 250, 150 250, 150 200" style={getStyle('right-atrium', '#bfdbfe')} />
        <path d="M 150 250 C 150 350, 250 400, 250 400 C 250 350, 250 250, 250 250 Z" style={getStyle('right-ventricle', '#93c5fd')} />
        <path d="M 350 200 C 350 100, 250 200, 250 250 C 300 250, 350 250, 350 200" style={getStyle('left-atrium', '#fca5a5')} />
        <path d="M 350 250 C 350 350, 250 400, 250 400 C 250 350, 250 250, 250 250 Z" style={getStyle('left-ventricle', '#f87171')} />
        <path d="M 220 150 C 220 50, 300 50, 300 150 L 260 150 C 260 100, 240 100, 240 150 Z" style={getStyle('aorta', '#ef4444')} />
      </g>
      {showLabels && (
        <g id="labels" fontSize="14" fill="#333" fontFamily="sans-serif">
          <text x="80" y="200">Right Atrium</text>
          <text x="80" y="320">Right Ventricle</text>
          <text x="360" y="200">Left Atrium</text>
          <text x="360" y="320">Left Ventricle</text>
          <text x="240" y="80">Aorta</text>
        </g>
      )}
      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && <><path d="M 200 200 L 120 200" stroke="#000" strokeDasharray="4" /><text x="100" y="205">1</text></>}
          {pointerCount >= 2 && <><path d="M 300 300 L 380 300" stroke="#000" strokeDasharray="4" /><text x="390" y="305">2</text></>}
        </g>
      )}
    </svg>
  );
}
