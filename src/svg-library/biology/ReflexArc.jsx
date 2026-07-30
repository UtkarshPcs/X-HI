import React from 'react';

export default function ReflexArc({ data = {} }) {
  const { highlightIds = [], showLabels = false, pointerCount = 0 } = data;
  const isHighlighted = (id) => highlightIds.includes(id);

  const getStyle = (id, baseFill = 'none') => ({
    stroke: isHighlighted(id) ? '#ef4444' : '#333',
    strokeWidth: isHighlighted(id) ? 4 : 2,
    fill: isHighlighted(id) ? '#fecaca' : baseFill
  });

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g id="reflex-arc">
        {/* Spinal Cord Cross Section */}
        <path d="M 200 100 C 250 80, 300 80, 350 100 L 370 200 C 350 300, 200 300, 180 200 Z" style={getStyle('spinal-cord', '#e2e8f0')} />
        <path d="M 230 130 C 275 110, 275 250, 230 250 C 320 250, 320 110, 320 130" style={getStyle('spinal-cord', '#94a3b8')} />
        
        {/* Receptor & Sensory Neuron */}
        <rect x="50" y="50" width="40" height="20" style={getStyle('receptor', '#fca5a5')} />
        <path d="M 90 60 Q 200 60 250 130" style={getStyle('sensory-neuron')} strokeDasharray="5,5" />
        
        {/* Interneuron */}
        <circle cx="275" cy="180" r="10" style={getStyle('interneuron', '#cbd5e1')} />
        <path d="M 250 130 L 275 180 L 300 130" style={getStyle('interneuron')} />
        
        {/* Motor Neuron & Effector */}
        <path d="M 300 130 Q 350 250 100 250" style={getStyle('motor-neuron')} />
        <rect x="50" y="230" width="50" height="40" style={getStyle('effector-muscle', '#f87171')} />
      </g>
      {showLabels && (
        <g id="labels" fontSize="14" fill="#333" fontFamily="sans-serif">
          <text x="40" y="40">Receptor</text>
          <text x="130" y="50">Sensory Neuron</text>
          <text x="280" y="200">Interneuron</text>
          <text x="350" y="90">Spinal Cord</text>
          <text x="180" y="270">Motor Neuron</text>
          <text x="40" y="290">Effector Muscle</text>
        </g>
      )}
      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && <><path d="M 70 70 L 70 100" stroke="#000" strokeDasharray="4" /><text x="65" y="115">1</text></>}
          {pointerCount >= 2 && <><path d="M 275 110 L 275 80" stroke="#000" strokeDasharray="4" /><text x="270" y="75">2</text></>}
          {pointerCount >= 3 && <><path d="M 75 250 L 30 250" stroke="#000" strokeDasharray="4" /><text x="15" y="255">3</text></>}
        </g>
      )}
    </svg>
  );
}
