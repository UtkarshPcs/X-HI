import React from 'react';

export default function ParallelLines({ data }) {
  const isHighlighted = (id) => data?.highlights?.includes(id);
  const getStroke = (id, defaultColor = '#000000') => isHighlighted(id) ? '#EF4444' : defaultColor;
  const getStrokeWidth = (id, defaultWidth = 2) => isHighlighted(id) ? defaultWidth + 1 : defaultWidth;

  const showLabels = data?.showLabels ?? true;
  const pointerCount = data?.pointerCount ?? 0;

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#000" />
        </marker>
        <marker id="arrow-highlight" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
        </marker>
      </defs>
      
      <g id="geometry">
        <line x1="50" y1="200" x2="450" y2="200" stroke={getStroke('line-l')} strokeWidth={getStrokeWidth('line-l')} markerStart={`url(#${isHighlighted('line-l') ? 'arrow-highlight' : 'arrow'})`} markerEnd={`url(#${isHighlighted('line-l') ? 'arrow-highlight' : 'arrow'})`} />
        <line x1="50" y1="300" x2="450" y2="300" stroke={getStroke('line-m')} strokeWidth={getStrokeWidth('line-m')} markerStart={`url(#${isHighlighted('line-m') ? 'arrow-highlight' : 'arrow'})`} markerEnd={`url(#${isHighlighted('line-m') ? 'arrow-highlight' : 'arrow'})`} />
        <line x1="150" y1="100" x2="350" y2="400" stroke={getStroke('transversal-t')} strokeWidth={getStrokeWidth('transversal-t')} markerStart={`url(#${isHighlighted('transversal-t') ? 'arrow-highlight' : 'arrow'})`} markerEnd={`url(#${isHighlighted('transversal-t') ? 'arrow-highlight' : 'arrow'})`} />
      </g>

      {showLabels && (
        <g id="labels" fontSize="20" fontFamily="serif" fontStyle="italic" fill="#000">
          <text x="40" y="190">l</text>
          <text x="40" y="290">m</text>
          <text x="130" y="110">t</text>
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && (
            <g>
              <line x1="216" y1="200" x2="166" y2="150" stroke="#666" strokeDasharray="4 4" />
              <circle cx="166" cy="150" r="12" fill="#fff" stroke="#666" />
              <text x="166" y="155" fontSize="14" textAnchor="middle" fill="#666">1</text>
            </g>
          )}
          {pointerCount >= 2 && (
            <g>
              <line x1="283" y1="300" x2="333" y2="350" stroke="#666" strokeDasharray="4 4" />
              <circle cx="333" cy="350" r="12" fill="#fff" stroke="#666" />
              <text x="333" y="355" fontSize="14" textAnchor="middle" fill="#666">2</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
