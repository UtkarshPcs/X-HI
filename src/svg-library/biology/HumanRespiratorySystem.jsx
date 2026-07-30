import React from 'react';

export default function HumanRespiratorySystem({ data }) {
  const { showLabels = true, highlight = [], pointerCount = 0 } = data;
  const isHighlighted = (id) => highlight.includes(id) ? '#fbbf24' : 'currentColor';
  const getStrokeWidth = (id) => highlight.includes(id) ? '4' : '2';

  return (
    <svg viewBox="0 0 500 500" style={{ width: '100%', height: 'auto', maxWidth: '400px' }} xmlns="http://www.w3.org/2000/svg">
      <g id="humanrespiratorysystem-structure">
        <rect id="main-body" x="100" y="100" width="300" height="300" fill="none" stroke={isHighlighted('main-body')} strokeWidth={getStrokeWidth('main-body')} rx="20" />
        <circle id="core" cx="250" cy="250" r="80" fill="none" stroke={isHighlighted('core')} strokeWidth={getStrokeWidth('core')} />
        <path id="pathway" d="M 250 100 L 250 170 M 250 330 L 250 400" stroke={isHighlighted('pathway')} strokeWidth={getStrokeWidth('pathway')} strokeDasharray="5" />
      </g>
      
      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && <><line x1="250" y1="135" x2="150" y2="80" stroke="currentColor" strokeDasharray="4" /><text x="140" y="70" fill="currentColor">1</text></>}
          {pointerCount >= 2 && <><line x1="250" y1="250" x2="150" y2="250" stroke="currentColor" strokeDasharray="4" /><text x="140" y="255" fill="currentColor">2</text></>}
          {pointerCount >= 3 && <><line x1="250" y1="365" x2="150" y2="420" stroke="currentColor" strokeDasharray="4" /><text x="140" y="430" fill="currentColor">3</text></>}
        </g>
      )}

      {showLabels && pointerCount === 0 && (
        <g id="labels">
          <text x="100" y="70" fill="currentColor" fontSize="16">Trachea</text>
          <line x1="250" y1="135" x2="150" y2="80" stroke="currentColor" />
          
          <text x="80" y="255" fill="currentColor" fontSize="16">Lungs</text>
          <line x1="250" y1="250" x2="150" y2="250" stroke="currentColor" />
          
          <text x="100" y="430" fill="currentColor" fontSize="16">Diaphragm</text>
          <line x1="250" y1="365" x2="150" y2="420" stroke="currentColor" />
        </g>
      )}
    </svg>
  );
}
