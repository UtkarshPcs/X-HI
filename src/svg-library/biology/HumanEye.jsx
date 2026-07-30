import React from 'react';

export default function HumanEye({ data }) {
  const { showLabels = false, highlight = [], pointerCount = 0 } = data;
  
  const isHighlighted = (id) => highlight.includes(id) ? '#fbbf24' : 'currentColor';
  const getStrokeWidth = (id) => highlight.includes(id) ? '4' : '2';

  return (
    <svg viewBox="0 0 500 500" style={{ width: '100%', height: 'auto', maxWidth: '400px' }} xmlns="http://www.w3.org/2000/svg">
      <g id="eye-structure">
        <circle id="retina" cx="250" cy="250" r="150" fill="none" stroke={isHighlighted('retina')} strokeWidth={getStrokeWidth('retina')} />
        <path id="cornea" d="M 120 175 Q 50 250 120 325" fill="none" stroke={isHighlighted('cornea')} strokeWidth={getStrokeWidth('cornea')} />
        <ellipse id="lens" cx="160" cy="250" rx="20" ry="45" fill="none" stroke={isHighlighted('lens')} strokeWidth={getStrokeWidth('lens')} />
        <path id="optic-nerve" d="M 390 220 L 460 220 M 390 280 L 460 280" fill="none" stroke={isHighlighted('optic-nerve')} strokeWidth={getStrokeWidth('optic-nerve')} />
        <path id="iris" d="M 135 190 L 135 220 M 135 310 L 135 280" stroke={isHighlighted('iris')} strokeWidth="4" />
      </g>
      
      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && <><line x1="120" y1="250" x2="50" y2="100" stroke="currentColor" strokeDasharray="4" /><text x="35" y="95" fill="currentColor" fontWeight="bold">1</text></>}
          {pointerCount >= 2 && <><line x1="160" y1="250" x2="160" y2="80" stroke="currentColor" strokeDasharray="4" /><text x="155" y="70" fill="currentColor" fontWeight="bold">2</text></>}
          {pointerCount >= 3 && <><line x1="390" y1="250" x2="350" y2="100" stroke="currentColor" strokeDasharray="4" /><text x="340" y="90" fill="currentColor" fontWeight="bold">3</text></>}
          {pointerCount >= 4 && <><line x1="420" y1="250" x2="480" y2="150" stroke="currentColor" strokeDasharray="4" /><text x="485" y="145" fill="currentColor" fontWeight="bold">4</text></>}
        </g>
      )}

      {showLabels && (
        <g id="labels">
          <text x="30" y="90" fill="currentColor" fontSize="14">Cornea</text>
          <line x1="120" y1="250" x2="50" y2="100" stroke="currentColor" strokeWidth="1" />
          
          <text x="145" y="70" fill="currentColor" fontSize="14">Lens</text>
          <line x1="160" y1="250" x2="160" y2="80" stroke="currentColor" strokeWidth="1" />
          
          <text x="330" y="90" fill="currentColor" fontSize="14">Retina</text>
          <line x1="390" y1="250" x2="350" y2="100" stroke="currentColor" strokeWidth="1" />
          
          <text x="460" y="145" fill="currentColor" fontSize="14">Optic Nerve</text>
          <line x1="420" y1="250" x2="480" y2="150" stroke="currentColor" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}
