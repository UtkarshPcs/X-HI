import React from 'react';

export default function Triangle({ data }) {
  const { showLabels = true, highlight = [], points = ["A", "B", "C"], equalSides = [] } = data;
  
  const isHighlighted = (id) => highlight.includes(id) ? '#fbbf24' : 'currentColor';
  const getStrokeWidth = (id) => highlight.includes(id) ? '4' : '2';

  return (
    <svg viewBox="0 0 500 500" style={{ width: '100%', height: 'auto', maxWidth: '350px' }} xmlns="http://www.w3.org/2000/svg">
      <g id="triangle-structure">
        {/* Lines */}
        <line id="side-AB" x1="250" y1="50" x2="50" y2="450" fill="none" stroke={isHighlighted('side-AB')} strokeWidth={getStrokeWidth('side-AB')} />
        <line id="side-BC" x1="50" y1="450" x2="450" y2="450" fill="none" stroke={isHighlighted('side-BC')} strokeWidth={getStrokeWidth('side-BC')} />
        <line id="side-AC" x1="450" y1="450" x2="250" y2="50" fill="none" stroke={isHighlighted('side-AC')} strokeWidth={getStrokeWidth('side-AC')} />
      </g>
      
      {showLabels && (
        <g id="labels">
          <text id="label-A" x="250" y="35" fill={isHighlighted('label-A')} fontSize="24" textAnchor="middle" fontWeight="bold">{points[0]}</text>
          <text id="label-B" x="30" y="470" fill={isHighlighted('label-B')} fontSize="24" textAnchor="middle" fontWeight="bold">{points[1]}</text>
          <text id="label-C" x="470" y="470" fill={isHighlighted('label-C')} fontSize="24" textAnchor="middle" fontWeight="bold">{points[2]}</text>
        </g>
      )}

      {/* Equality Ticks */}
      <g id="equality-marks">
        {equalSides.some(pair => pair.includes(`${points[0]}${points[1]}`) || pair.includes(`${points[1]}${points[0]}`)) && (
          <line x1="125" y1="240" x2="175" y2="260" stroke="currentColor" strokeWidth="3" />
        )}
        {equalSides.some(pair => pair.includes(`${points[0]}${points[2]}`) || pair.includes(`${points[2]}${points[0]}`)) && (
          <line x1="375" y1="240" x2="325" y2="260" stroke="currentColor" strokeWidth="3" />
        )}
        {equalSides.some(pair => pair.includes(`${points[1]}${points[2]}`) || pair.includes(`${points[2]}${points[1]}`)) && (
          <line x1="250" y1="440" x2="250" y2="460" stroke="currentColor" strokeWidth="3" />
        )}
      </g>
    </svg>
  );
}
