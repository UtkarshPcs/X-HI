import React from 'react';

const ElectrolysisSetup = ({ data }) => {
  const isHighlighted = (id) => data?.highlights?.includes(id) ?? false;
  const showLabels = data?.showLabels ?? true;
  const pointerCount = data?.pointerCount ?? 0;

  const defaultColor = "#333333";
  const highlightColor = "#ff5722";

  const getColor = (id) => isHighlighted(id) ? highlightColor : defaultColor;
  const getFill = (id, base) => isHighlighted(id) ? "#ffe0d2" : base;

  return (
    <svg viewBox="0 0 500 500" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="electrolyte-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a3e4d7" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1abc9c" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      <g id="beaker">
        {/* Beaker back rim */}
        <ellipse cx="250" cy="150" rx="120" ry="15" fill="none" stroke={getColor("beaker")} strokeWidth="3" opacity="0.3" />
        {/* Beaker fluid level */}
        <ellipse cx="250" cy="180" rx="120" ry="15" fill="#a3e4d7" opacity="0.5" />
        {/* Beaker body fluid */}
        <path d="M 130 180 L 130 400 A 120 25 0 0 0 370 400 L 370 180 Z" fill={getFill("electrolyte", "url(#electrolyte-grad)")} />
        {/* Beaker outline */}
        <path d="M 130 150 L 130 400 A 120 25 0 0 0 370 400 L 370 150" fill="none" stroke={getColor("beaker")} strokeWidth="4" />
        {/* Beaker front rim */}
        <path d="M 130 150 A 120 15 0 0 0 370 150" fill="none" stroke={getColor("beaker")} strokeWidth="4" />
      </g>

      <g id="electrodes">
        {/* Anode */}
        <rect x="180" y="120" width="30" height="250" fill={getFill("anode", "#7f8c8d")} stroke={getColor("anode")} strokeWidth="3" rx="5" />
        {/* Cathode */}
        <rect x="290" y="120" width="30" height="250" fill={getFill("cathode", "#7f8c8d")} stroke={getColor("cathode")} strokeWidth="3" rx="5" />
      </g>

      <g id="circuit">
        {/* Wires */}
        <path d="M 195 120 L 195 50 L 250 50" fill="none" stroke={getColor("anode")} strokeWidth="3" />
        <path d="M 305 120 L 305 50 L 270 50" fill="none" stroke={getColor("cathode")} strokeWidth="3" />
        
        {/* Battery symbol */}
        <g id="battery" transform="translate(250, 50)">
          <line x1="0" y1="-20" x2="0" y2="20" stroke={getColor("battery")} strokeWidth="4" />
          <line x1="10" y1="-10" x2="10" y2="10" stroke={getColor("battery")} strokeWidth="6" />
          <line x1="20" y1="-20" x2="20" y2="20" stroke={getColor("battery")} strokeWidth="4" />
        </g>
      </g>

      {showLabels && (
        <g id="labels" fontFamily="sans-serif" fontSize="16" fill="#333">
          <text x="140" y="250" textAnchor="end">Anode (+)</text>
          <text x="360" y="250" textAnchor="start">Cathode (-)</text>
          <text x="250" y="380" textAnchor="middle">Electrolyte</text>
          <text x="250" y="25" textAnchor="middle">Battery</text>
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && (
            <g>
              <line x1="90" y1="200" x2="175" y2="200" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="80" cy="200" r="12" fill="#000" />
              <text x="80" y="205" fill="#fff" fontSize="14" textAnchor="middle">1</text>
            </g>
          )}
          {pointerCount >= 2 && (
            <g>
              <line x1="410" y1="200" x2="325" y2="200" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="420" cy="200" r="12" fill="#000" />
              <text x="420" y="205" fill="#fff" fontSize="14" textAnchor="middle">2</text>
            </g>
          )}
          {pointerCount >= 3 && (
            <g>
              <line x1="90" y1="350" x2="200" y2="350" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="80" cy="350" r="12" fill="#000" />
              <text x="80" y="355" fill="#fff" fontSize="14" textAnchor="middle">3</text>
            </g>
          )}
          {pointerCount >= 4 && (
            <g>
              <line x1="330" y1="50" x2="410" y2="50" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="420" cy="50" r="12" fill="#000" />
              <text x="420" y="55" fill="#fff" fontSize="14" textAnchor="middle">4</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
};

export default ElectrolysisSetup;
