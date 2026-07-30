import React from 'react';

export default function HumanDigestiveSystem({ data = {} }) {
  const { highlightIds = [], showLabels = false, pointerCount = 0 } = data;
  const isHighlighted = (id) => highlightIds.includes(id);

  const getStyle = (id) => ({
    stroke: isHighlighted(id) ? '#ef4444' : '#333333',
    strokeWidth: isHighlighted(id) ? 4 : 2,
    fill: isHighlighted(id) ? '#fee2e2' : 'none'
  });

  return (
    <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <g id="digestive-system">
        <path d="M 250 50 L 250 200" style={getStyle('esophagus')} />
        <path d="M 250 200 C 200 200, 200 260, 260 260 C 290 260, 290 220, 250 200" style={getStyle('stomach')} fill="#ffdbdb" />
        <path d="M 240 180 C 180 180, 160 230, 240 230 C 260 230, 260 180, 240 180" style={getStyle('liver')} />
        <path d="M 180 300 L 180 400 L 320 400 L 320 300 Z" style={getStyle('large-intestine')} />
        <path d="M 200 320 Q 250 350, 200 380 Q 280 370, 280 320" style={getStyle('small-intestine')} />
      </g>
      {showLabels && (
        <g id="labels" fontSize="14" fill="#333" fontFamily="sans-serif">
          <text x="260" y="100">Esophagus</text>
          <text x="300" y="230">Stomach</text>
          <text x="140" y="210">Liver</text>
          <text x="100" y="350">Large Intestine</text>
          <text x="220" y="360">Small Intestine</text>
        </g>
      )}
      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && <><path d="M 250 150 L 300 150" stroke="#000" strokeDasharray="4" /><text x="310" y="155">1</text></>}
          {pointerCount >= 2 && <><path d="M 240 240 L 300 240" stroke="#000" strokeDasharray="4" /><text x="310" y="245">2</text></>}
          {pointerCount >= 3 && <><path d="M 200 210 L 150 210" stroke="#000" strokeDasharray="4" /><text x="135" y="215">3</text></>}
        </g>
      )}
    </svg>
  );
}
