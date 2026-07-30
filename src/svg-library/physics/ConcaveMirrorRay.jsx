import React from 'react';

export default function ConcaveMirrorRay({ data }) {
  const { highlightIds = [], showLabels = true, pointerCount = 0 } = data || {};
  const isHighlighted = (id) => highlightIds.includes(id);

  const getStroke = (id, defaultColor = '#333') => isHighlighted(id) ? '#e83e8c' : defaultColor;
  const getStrokeWidth = (id, defaultWidth = 2) => isHighlighted(id) ? defaultWidth + 1 : defaultWidth;

  const pointers = [
    { x: 100, y: 150 },
    { x: 250, y: 250 },
    { x: 350, y: 250 },
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
        <pattern id="hash" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="#aaa" strokeWidth="2" />
        </pattern>
      </defs>

      {/* Principal Axis */}
      <line x1="50" y1="250" x2="450" y2="250" stroke={getStroke('principal-axis')} strokeWidth={getStrokeWidth('principal-axis')} strokeDasharray="5,5" />
      
      {/* Mirror */}
      <path d="M 400 100 Q 330 250 400 400" fill="none" stroke={getStroke('mirror')} strokeWidth={getStrokeWidth('mirror', 3)} />
      <path d="M 400 100 Q 330 250 400 400" fill="none" stroke="url(#hash)" strokeWidth="10" transform="translate(5, 0)" />

      {/* Incident Ray */}
      <line x1="100" y1="150" x2="352" y2="150" stroke={getStroke('incident-ray')} strokeWidth={getStrokeWidth('incident-ray')} markerEnd={isHighlighted('incident-ray') ? 'url(#arrow-highlight)' : 'url(#arrow)'} />
      
      {/* Reflected Ray */}
      <line x1="352" y1="150" x2="100" y2="350" stroke={getStroke('reflected-ray')} strokeWidth={getStrokeWidth('reflected-ray')} markerEnd={isHighlighted('reflected-ray') ? 'url(#arrow-highlight)' : 'url(#arrow)'} />

      {/* Normal */}
      <line x1="352" y1="150" x2="250" y2="250" stroke={getStroke('normal', '#888')} strokeWidth={getStrokeWidth('normal', 1)} strokeDasharray="3,3" />

      {/* Object */}
      <line x1="100" y1="250" x2="100" y2="150" stroke={getStroke('object', '#007bff')} strokeWidth={getStrokeWidth('object', 3)} markerEnd="url(#arrow)" />
      
      {/* Image */}
      <line x1="190" y1="250" x2="190" y2="295" stroke={getStroke('image', '#28a745')} strokeWidth={getStrokeWidth('image', 3)} markerEnd="url(#arrow)" />

      {showLabels && (
        <g id="labels" fontSize="14" fontFamily="sans-serif" fill="#333">
          <text x="375" y="265" fill={getStroke('pole')}>P</text>
          <text x="290" y="265" fill={getStroke('focus')}>F</text>
          <text x="240" y="265" fill={getStroke('center-of-curvature')}>C</text>
          <text x="90" y="140" fill={getStroke('object')}>A</text>
          <text x="90" y="265" fill={getStroke('object')}>B</text>
          <text x="180" y="315" fill={getStroke('image')}>A'</text>
          <text x="180" y="240" fill={getStroke('image')}>B'</text>
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
