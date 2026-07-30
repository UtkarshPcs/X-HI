import React from 'react';

export default function ConcaveLensRay({ data }) {
  const { highlightIds = [], showLabels = true, pointerCount = 0 } = data || {};
  const isHighlighted = (id) => highlightIds.includes(id);

  const getStroke = (id, defaultColor = '#333') => isHighlighted(id) ? '#e83e8c' : defaultColor;
  const getStrokeWidth = (id, defaultWidth = 2) => isHighlighted(id) ? defaultWidth + 1 : defaultWidth;

  const pointers = [
    { x: 100, y: 150 },
    { x: 250, y: 250 },
    { x: 175, y: 250 },
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

      {/* Principal Axis */}
      <line x1="50" y1="250" x2="450" y2="250" stroke={getStroke('principal-axis')} strokeWidth={getStrokeWidth('principal-axis')} strokeDasharray="5,5" />
      
      {/* Lens */}
      <path d="M 230 100 L 270 100 Q 250 250 270 400 L 230 400 Q 250 250 230 100" fill="#e0f7fa" stroke={getStroke('lens')} strokeWidth={getStrokeWidth('lens', 2)} />
      <line x1="250" y1="100" x2="250" y2="400" stroke={getStroke('optical-center')} strokeWidth={getStrokeWidth('optical-center', 1)} strokeDasharray="4,4" />

      {/* Incident Ray parallel */}
      <line x1="100" y1="150" x2="250" y2="150" stroke={getStroke('incident-ray')} strokeWidth={getStrokeWidth('incident-ray')} markerEnd={isHighlighted('incident-ray') ? 'url(#arrow-highlight)' : 'url(#arrow)'} />
      
      {/* Refracted Ray diverging */}
      <line x1="250" y1="150" x2="400" y2="50" stroke={getStroke('refracted-ray')} strokeWidth={getStrokeWidth('refracted-ray')} markerEnd={isHighlighted('refracted-ray') ? 'url(#arrow-highlight)' : 'url(#arrow)'} />
      
      {/* Virtual extension */}
      <line x1="250" y1="150" x2="150" y2="250" stroke={getStroke('virtual-ray', '#888')} strokeWidth={getStrokeWidth('virtual-ray', 1.5)} strokeDasharray="4,4" />

      {/* Incident Ray through optical center */}
      <line x1="100" y1="150" x2="400" y2="350" stroke={getStroke('incident-ray-2')} strokeWidth={getStrokeWidth('incident-ray-2')} markerEnd={isHighlighted('incident-ray-2') ? 'url(#arrow-highlight)' : 'url(#arrow)'} />

      {/* Object */}
      <line x1="100" y1="250" x2="100" y2="150" stroke={getStroke('object', '#007bff')} strokeWidth={getStrokeWidth('object', 3)} markerEnd="url(#arrow)" />
      
      {/* Image (Virtual) */}
      <line x1="185" y1="250" x2="185" y2="215" stroke={getStroke('image', '#28a745')} strokeWidth={getStrokeWidth('image', 3)} markerEnd="url(#arrow)" strokeDasharray="2,2" />

      {showLabels && (
        <g id="labels" fontSize="14" fontFamily="sans-serif" fill="#333">
          <text x="245" y="270" fill={getStroke('optical-center')}>O</text>
          <text x="145" y="270" fill={getStroke('focus-1')}>F1</text>
          <text x="345" y="270" fill={getStroke('focus-2')}>F2</text>
          <text x="45" y="270" fill={getStroke('center-1')}>2F1</text>
          <text x="425" y="270" fill={getStroke('center-2')}>2F2</text>
          <text x="90" y="140" fill={getStroke('object')}>A</text>
          <text x="90" y="270" fill={getStroke('object')}>B</text>
          <text x="175" y="205" fill={getStroke('image')}>A'</text>
          <text x="175" y="270" fill={getStroke('image')}>B'</text>
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
