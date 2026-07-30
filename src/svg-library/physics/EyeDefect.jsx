import React from 'react';

export default function EyeDefect({ data }) {
  const { highlightIds = [], showLabels = true, pointerCount = 0 } = data || {};
  const isHighlighted = (id) => highlightIds.includes(id);

  const getStroke = (id, defaultColor = '#333') => isHighlighted(id) ? '#e83e8c' : defaultColor;
  const getStrokeWidth = (id, defaultWidth = 2) => isHighlighted(id) ? defaultWidth + 1 : defaultWidth;

  const pointers = [
    { x: 300, y: 250 },
    { x: 100, y: 250 },
    { x: 220, y: 250 },
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

      {/* Eye structure */}
      <path d="M 200 150 Q 350 100 400 250 Q 350 400 200 350 Q 150 250 200 150 Z" fill="#fff" stroke={getStroke('eye')} strokeWidth={getStrokeWidth('eye', 2)} />
      
      {/* Cornea */}
      <path d="M 200 150 Q 120 250 200 350" fill="none" stroke={getStroke('cornea')} strokeWidth={getStrokeWidth('cornea', 2)} />
      
      {/* Eye Lens */}
      <ellipse cx="220" cy="250" rx="10" ry="40" fill="#e0f7fa" stroke={getStroke('eye-lens')} strokeWidth={getStrokeWidth('eye-lens', 1)} />

      {/* Retina */}
      <path d="M 370 170 Q 420 250 370 330" fill="none" stroke={getStroke('retina', '#ff9800')} strokeWidth={getStrokeWidth('retina', 4)} />
      <path d="M 370 170 Q 420 250 370 330" fill="none" stroke="transparent" strokeWidth="20" id="retina-path" />

      {/* Rays - Myopia example (focuses in front of retina) */}
      <line x1="50" y1="180" x2="220" y2="210" stroke={getStroke('incident-ray')} strokeWidth={getStrokeWidth('incident-ray')} markerEnd="url(#arrow)" />
      <line x1="50" y1="320" x2="220" y2="290" stroke={getStroke('incident-ray')} strokeWidth={getStrokeWidth('incident-ray')} markerEnd="url(#arrow)" />

      <line x1="220" y1="210" x2="350" y2="250" stroke={getStroke('refracted-ray')} strokeWidth={getStrokeWidth('refracted-ray')} />
      <line x1="220" y1="290" x2="350" y2="250" stroke={getStroke('refracted-ray')} strokeWidth={getStrokeWidth('refracted-ray')} />
      
      {/* Extensions (blur circle on retina) */}
      <line x1="350" y1="250" x2="400" y2="265" stroke={getStroke('refracted-ray')} strokeWidth={getStrokeWidth('refracted-ray', 1)} strokeDasharray="3,3" />
      <line x1="350" y1="250" x2="400" y2="235" stroke={getStroke('refracted-ray')} strokeWidth={getStrokeWidth('refracted-ray', 1)} strokeDasharray="3,3" />

      {/* Focus point */}
      <circle cx="350" cy="250" r="4" fill={getStroke('defect-focus', '#dc3545')} />

      {showLabels && (
        <g id="labels" fontSize="14" fontFamily="sans-serif" fill="#333">
          <text x="215" y="315" fill={getStroke('eye-lens')}>Lens</text>
          <text x="140" y="255" fill={getStroke('cornea')}>Cornea</text>
          <text x="410" y="255" fill={getStroke('retina')}>Retina</text>
          <text x="280" y="240" fill={getStroke('defect-focus', '#dc3545')}>Focus (in front)</text>
          <text x="220" y="100" fill="#333" fontSize="16" fontWeight="bold">Myopic Eye</text>
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
