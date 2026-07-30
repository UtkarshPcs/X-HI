import React from 'react';

export default function TestTubeReaction({ data }) {
  const { showLabels = true, highlight = [], pointerCount = 0 } = data;
  
  const isHighlighted = (id) => highlight.includes(id) ? '#fbbf24' : 'currentColor';
  const getStrokeWidth = (id) => highlight.includes(id) ? '4' : '2';

  return (
    <svg viewBox="0 0 300 500" style={{ width: '100%', height: 'auto', maxWidth: '250px' }} xmlns="http://www.w3.org/2000/svg">
      
      <g id="reaction-setup">
        {/* Stand (Clamp) */}
        <line id="stand-pole" x1="50" y1="50" x2="50" y2="450" stroke="currentColor" strokeWidth="6" />
        <line id="stand-base" x1="20" y1="450" x2="80" y2="450" stroke="currentColor" strokeWidth="8" />
        <line id="clamp" x1="50" y1="200" x2="130" y2="200" stroke="currentColor" strokeWidth="4" />
        
        {/* Test Tube */}
        <path id="test-tube" d="M 130 150 L 130 350 A 20 20 0 0 0 170 350 L 170 150 M 125 150 L 175 150" fill="none" stroke={isHighlighted('test-tube')} strokeWidth={getStrokeWidth('test-tube')} />
        
        {/* Liquid */}
        <path id="liquid" d="M 131 280 L 169 280 L 169 350 A 19 19 0 0 1 131 350 Z" fill={highlight.includes('liquid') ? '#fbbf24' : 'rgba(100,100,100,0.2)'} stroke="none" />
        
        {/* Bubbles (Gas) */}
        <g id="gas-bubbles" stroke={isHighlighted('gas-bubbles')} fill="none">
          <circle cx="140" cy="330" r="3" />
          <circle cx="150" cy="310" r="4" />
          <circle cx="160" cy="340" r="2" />
          <circle cx="145" cy="290" r="3" />
          <circle cx="155" cy="270" r="2" />
        </g>
        
        {/* Solid Precipitate / Metal */}
        <path id="solid" d="M 135 345 Q 150 330 165 345 L 160 365 L 140 365 Z" fill={isHighlighted('solid')} stroke="currentColor" />
      </g>
      
      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && <><line x1="180" y1="220" x2="230" y2="180" stroke="currentColor" strokeDasharray="4" /><text x="240" y="175" fill="currentColor">1</text></>}
          {pointerCount >= 2 && <><line x1="170" y1="310" x2="230" y2="310" stroke="currentColor" strokeDasharray="4" /><text x="240" y="315" fill="currentColor">2</text></>}
          {pointerCount >= 3 && <><line x1="160" y1="355" x2="230" y2="400" stroke="currentColor" strokeDasharray="4" /><text x="240" y="410" fill="currentColor">3</text></>}
          {pointerCount >= 4 && <><line x1="150" y1="270" x2="200" y2="240" stroke="currentColor" strokeDasharray="4" /><text x="210" y="235" fill="currentColor">4</text></>}
        </g>
      )}

      {showLabels && pointerCount === 0 && (
        <g id="labels">
          <text x="240" y="175" fill="currentColor" fontSize="14">Test Tube</text>
          <line x1="180" y1="220" x2="230" y2="180" stroke="currentColor" strokeWidth="1" />
          
          <text x="240" y="315" fill="currentColor" fontSize="14">Solution</text>
          <line x1="170" y1="310" x2="230" y2="310" stroke="currentColor" strokeWidth="1" />
          
          <text x="240" y="410" fill="currentColor" fontSize="14">Metal / Solid</text>
          <line x1="160" y1="355" x2="230" y2="400" stroke="currentColor" strokeWidth="1" />

          <text x="210" y="235" fill="currentColor" fontSize="14">Gas evolved</text>
          <line x1="150" y1="270" x2="200" y2="240" stroke="currentColor" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}
