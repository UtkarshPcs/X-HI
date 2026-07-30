import React from 'react';

export default function LensSignConvention({ data }) {
  const { highlightIds = [], showLabels = true, pointerCount = 0 } = data || {};
  const isHighlighted = (id) => highlightIds.includes(id);

  const getStroke = (id, defaultColor = '#333') => isHighlighted(id) ? '#e83e8c' : defaultColor;
  const getStrokeWidth = (id, defaultWidth = 2) => isHighlighted(id) ? defaultWidth + 1 : defaultWidth;

  const pointers = [
    { x: 250, y: 250 },
    { x: 150, y: 150 },
    { x: 350, y: 150 },
  ];

  return (
    <svg viewBox="0 0 500 500" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#333" />
        </marker>
        <marker id="arrow-highlight" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#e83e8c" />
        </marker>
      </defs>

      {/* Coordinate System */}
      <line x1="50" y1="250" x2="450" y2="250" stroke={getStroke('x-axis')} strokeWidth={getStrokeWidth('x-axis')} markerEnd="url(#arrow)" />
      <line x1="50" y1="250" x2="45" y2="250" stroke={getStroke('x-axis')} strokeWidth={getStrokeWidth('x-axis')} markerStart="url(#arrow)" />
      <line x1="250" y1="450" x2="250" y2="50" stroke={getStroke('y-axis')} strokeWidth={getStrokeWidth('y-axis')} markerEnd="url(#arrow)" />
      <line x1="250" y1="450" x2="250" y2="455" stroke={getStroke('y-axis')} strokeWidth={getStrokeWidth('y-axis')} markerStart="url(#arrow)" />

      {/* Lens (Convex for example) */}
      <path d="M 250 100 Q 220 250 250 400 Q 280 250 250 100" fill="#e0f7fa" stroke={getStroke('lens', '#555')} strokeWidth={getStrokeWidth('lens', 2)} />

      {/* Distances */}
      {/* Direction of incident light */}
      <line x1="80" y1="80" x2="200" y2="80" stroke={getStroke('incident-direction', '#007bff')} strokeWidth={getStrokeWidth('incident-direction')} markerEnd="url(#arrow)" />
      
      {/* Negative Distance */}
      <line x1="250" y1="200" x2="100" y2="200" stroke={getStroke('negative-dist', '#dc3545')} strokeWidth={getStrokeWidth('negative-dist')} markerEnd="url(#arrow)" strokeDasharray="4,4" />
      
      {/* Positive Distance */}
      <line x1="250" y1="200" x2="400" y2="200" stroke={getStroke('positive-dist', '#28a745')} strokeWidth={getStrokeWidth('positive-dist')} markerEnd="url(#arrow)" strokeDasharray="4,4" />

      {/* Positive Height */}
      <line x1="150" y1="250" x2="150" y2="150" stroke={getStroke('positive-height', '#28a745')} strokeWidth={getStrokeWidth('positive-height')} markerEnd="url(#arrow)" strokeDasharray="4,4" />

      {/* Negative Height */}
      <line x1="150" y1="250" x2="150" y2="350" stroke={getStroke('negative-height', '#dc3545')} strokeWidth={getStrokeWidth('negative-height')} markerEnd="url(#arrow)" strokeDasharray="4,4" />

      {showLabels && (
        <g id="labels" fontSize="14" fontFamily="sans-serif" fill="#333">
          <text x="460" y="255" fill={getStroke('x-axis')}>X</text>
          <text x="35" y="255" fill={getStroke('x-axis')}>X'</text>
          <text x="245" y="40" fill={getStroke('y-axis')}>Y</text>
          <text x="245" y="470" fill={getStroke('y-axis')}>Y'</text>
          <text x="260" y="265" fill={getStroke('optical-center')}>O (0,0)</text>
          <text x="80" y="70" fill={getStroke('incident-direction', '#007bff')}>Direction of incident light</text>
          <text x="130" y="190" fill={getStroke('negative-dist', '#dc3545')}>-ve Distance</text>
          <text x="280" y="190" fill={getStroke('positive-dist', '#28a745')}>+ve Distance</text>
          <text x="160" y="190" fill={getStroke('positive-height', '#28a745')}>+ve Height</text>
          <text x="160" y="310" fill={getStroke('negative-height', '#dc3545')}>-ve Height</text>
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointers.slice(0, pointerCount).map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="12" fill="#ffc107" stroke="#333" strokeWidth="1" />
              <text x={p.x} y={p.y + 4} fontSize="12" textAnchor="middle" fill="#000" fontWeight="bold">{i + 1}</text>
              <line x1={p.x + 15} y1={p.y - 15} x2={p.x + 35} y2={p.y - 35} stroke="#ffc107" strokeWidth="1.5" strokeDasharray="3,2" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
