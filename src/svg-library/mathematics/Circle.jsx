import React from 'react';

export default function Circle({ data }) {
  const { showLabels = true, highlight = [], labels = ["O", "A"], showRadius = true } = data;
  
  const isHighlighted = (id) => highlight.includes(id) ? '#fbbf24' : 'currentColor';
  const getStrokeWidth = (id) => highlight.includes(id) ? '4' : '2';

  return (
    <svg viewBox="0 0 300 300" style={{ width: '100%', height: 'auto', maxWidth: '300px' }} xmlns="http://www.w3.org/2000/svg">
      <g id="circle-structure">
        <circle id="circumference" cx="150" cy="150" r="100" fill="none" stroke={isHighlighted('circumference')} strokeWidth={getStrokeWidth('circumference')} />
        <circle id="center" cx="150" cy="150" r="4" fill={isHighlighted('center')} />
      </g>
      
      {showRadius && (
        <g id="radius-line">
          <line id="radius" x1="150" y1="150" x2="250" y2="150" stroke={isHighlighted('radius')} strokeWidth={getStrokeWidth('radius')} strokeDasharray="5" />
          <circle id="radius-point" cx="250" cy="150" r="4" fill={isHighlighted('radius-point')} />
        </g>
      )}

      {showLabels && (
        <g id="labels">
          <text id="label-center" x="140" y="140" fill={isHighlighted('label-center')} fontSize="18" fontWeight="bold">{labels[0]}</text>
          {showRadius && labels[1] && (
            <text id="label-radius" x="260" y="155" fill={isHighlighted('label-radius')} fontSize="18" fontWeight="bold">{labels[1]}</text>
          )}
        </g>
      )}
    </svg>
  );
}
