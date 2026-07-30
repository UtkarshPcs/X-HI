import React from 'react';

export default function ElectricCircuit({ data }) {
  const { showLabels = true, highlight = [], components = ["battery", "switch", "resistor"] } = data;
  
  const isHighlighted = (id) => highlight.includes(id) ? '#fbbf24' : 'currentColor';
  const getStrokeWidth = (id) => highlight.includes(id) ? '4' : '2';

  return (
    <svg viewBox="0 0 400 300" style={{ width: '100%', height: 'auto', maxWidth: '400px' }} xmlns="http://www.w3.org/2000/svg">
      <g id="circuit-wire">
        <path id="wire" d="M 100 100 L 300 100 L 300 200 L 100 200 Z" fill="none" stroke={isHighlighted('wire')} strokeWidth={getStrokeWidth('wire')} />
      </g>
      
      <g id="components">
        {components.includes("battery") && (
          <g id="battery" transform="translate(180, 200)">
            <rect x="-20" y="-10" width="40" height="20" fill="#1e293b" />
            <line x1="-5" y1="-15" x2="-5" y2="15" stroke={isHighlighted('battery')} strokeWidth="4" />
            <line x1="5" y1="-10" x2="5" y2="10" stroke={isHighlighted('battery')} strokeWidth="4" />
            <line x1="15" y1="-15" x2="15" y2="15" stroke={isHighlighted('battery')} strokeWidth="4" />
            <line x1="25" y1="-10" x2="25" y2="10" stroke={isHighlighted('battery')} strokeWidth="4" />
            {showLabels && <text x="0" y="35" fill="currentColor" fontSize="14" textAnchor="middle">Battery</text>}
          </g>
        )}
        
        {components.includes("switch") && (
          <g id="switch" transform="translate(100, 150)">
            <rect x="-10" y="-20" width="20" height="40" fill="#1e293b" />
            <circle cx="0" cy="-10" r="4" fill={isHighlighted('switch')} />
            <circle cx="0" cy="10" r="4" fill={isHighlighted('switch')} />
            <line x1="0" y1="-10" x2="0" y2="10" stroke={isHighlighted('switch')} strokeWidth="3" />
            {showLabels && <text x="-40" y="5" fill="currentColor" fontSize="14" textAnchor="middle">Switch</text>}
          </g>
        )}
        
        {components.includes("resistor") && (
          <g id="resistor" transform="translate(200, 100)">
            <rect x="-30" y="-10" width="60" height="20" fill="#1e293b" />
            <path d="M -30 0 L -20 -15 L -10 15 L 0 -15 L 10 15 L 20 -15 L 30 0" fill="none" stroke={isHighlighted('resistor')} strokeWidth="3" />
            {showLabels && <text x="0" y="-25" fill="currentColor" fontSize="14" textAnchor="middle">Resistor</text>}
          </g>
        )}
      </g>
    </svg>
  );
}
