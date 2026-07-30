import React from 'react';

export default function ConvexLensRay({ data }) {
  const { showLabels = true, highlight = [], pointerCount = 0 } = data;
  
  const isHighlighted = (id) => highlight.includes(id) ? '#fbbf24' : 'currentColor';
  const getStrokeWidth = (id) => highlight.includes(id) ? '3' : '1.5';

  return (
    <svg viewBox="0 0 800 400" style={{ width: '100%', height: 'auto', maxWidth: '600px' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
        </marker>
        <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
        </marker>
      </defs>

      <g id="optical-axis">
        <line x1="50" y1="200" x2="750" y2="200" stroke={isHighlighted('principal-axis')} strokeWidth="1" strokeDasharray="5" />
      </g>

      <g id="lens-structure">
        <path id="convex-lens" d="M 400 50 Q 450 200 400 350 Q 350 200 400 50" fill="none" stroke={isHighlighted('convex-lens')} strokeWidth="2" />
        <line id="optical-center-line" x1="400" y1="40" x2="400" y2="360" stroke={isHighlighted('convex-lens')} strokeWidth="1" strokeDasharray="4" />
      </g>

      <g id="light-rays">
        {/* Ray 1: Parallel to axis, passes through F2 */}
        <line id="ray-parallel" x1="200" y1="100" x2="400" y2="100" stroke={isHighlighted('ray-parallel')} strokeWidth={getStrokeWidth('ray-parallel')} markerEnd={highlight.includes('ray-parallel') ? "url(#arrowhead-highlight)" : "url(#arrowhead)"} />
        <line id="ray-focus" x1="400" y1="100" x2="600" y2="300" stroke={isHighlighted('ray-focus')} strokeWidth={getStrokeWidth('ray-focus')} markerEnd={highlight.includes('ray-focus') ? "url(#arrowhead-highlight)" : "url(#arrowhead)"} />
        
        {/* Ray 2: Passes through Optical Center */}
        <line id="ray-center" x1="200" y1="100" x2="600" y2="300" stroke={isHighlighted('ray-center')} strokeWidth={getStrokeWidth('ray-center')} markerEnd={highlight.includes('ray-center') ? "url(#arrowhead-highlight)" : "url(#arrowhead)"} />
      </g>

      <g id="objects">
        {/* Object (AB) */}
        <line id="object-line" x1="200" y1="200" x2="200" y2="100" stroke={isHighlighted('object')} strokeWidth="3" markerEnd="url(#arrowhead)" />
        {/* Image (A'B') */}
        <line id="image-line" x1="600" y1="200" x2="600" y2="300" stroke={isHighlighted('image')} strokeWidth="3" markerEnd="url(#arrowhead)" />
      </g>

      {showLabels && pointerCount === 0 && (
        <g id="labels">
          <text x="385" y="225" fill="currentColor" fontSize="16" fontWeight="bold">O</text>
          <text x="500" y="225" fill="currentColor" fontSize="16" fontWeight="bold">F₂</text>
          <text x="600" y="225" fill="currentColor" fontSize="16" fontWeight="bold">2F₂</text>
          <text x="300" y="225" fill="currentColor" fontSize="16" fontWeight="bold">F₁</text>
          <text x="200" y="225" fill="currentColor" fontSize="16" fontWeight="bold">2F₁</text>
          
          <text x="180" y="90" fill="currentColor" fontSize="16">A</text>
          <text x="180" y="205" fill="currentColor" fontSize="16">B</text>
          
          <text x="615" y="315" fill="currentColor" fontSize="16">A'</text>
          <text x="615" y="195" fill="currentColor" fontSize="16">B'</text>
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && <><line x1="200" y1="150" x2="150" y2="100" stroke="currentColor" strokeDasharray="4" /><text x="135" y="95" fill="currentColor">1</text></>}
          {pointerCount >= 2 && <><line x1="600" y1="250" x2="650" y2="300" stroke="currentColor" strokeDasharray="4" /><text x="660" y="315" fill="currentColor">2</text></>}
          {pointerCount >= 3 && <><line x1="400" y1="200" x2="430" y2="150" stroke="currentColor" strokeDasharray="4" /><text x="440" y="145" fill="currentColor">3</text></>}
        </g>
      )}
    </svg>
  );
}
