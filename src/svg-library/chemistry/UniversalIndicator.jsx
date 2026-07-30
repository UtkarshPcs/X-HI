import React from 'react';

const UniversalIndicator = ({ data }) => {
  const isHighlighted = (id) => data?.highlights?.includes(id) ?? false;
  const showLabels = data?.showLabels ?? true;
  const pointerCount = data?.pointerCount ?? 0;

  const getOpacity = (id) => {
    if (!data?.highlights || data.highlights.length === 0) return 1;
    return isHighlighted(id) ? 1 : 0.2;
  };

  const sections = [
    { id: "red", color: "#ef4444", label: "Strong Acid", ph: "0-3" },
    { id: "orange", color: "#f97316", label: "Weak Acid", ph: "4-5" },
    { id: "yellow", color: "#eab308", label: "Weak Acid", ph: "6" },
    { id: "green", color: "#22c55e", label: "Neutral", ph: "7" },
    { id: "blue", color: "#3b82f6", label: "Weak Alkali", ph: "8-10" },
    { id: "violet", color: "#8b5cf6", label: "Strong Alkali", ph: "11-14" },
  ];

  return (
    <svg viewBox="0 0 600 400" width="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>

      <g id="indicator-bottle" transform="translate(150, 50)" filter="url(#shadow)">
        <path d="M 120 10 L 120 40 C 120 60 80 80 80 120 L 80 280 A 20 20 0 0 0 100 300 L 200 300 A 20 20 0 0 0 220 280 L 220 120 C 220 80 180 60 180 40 L 180 10 Z" fill="#f0fdf4" stroke="#4b5563" strokeWidth="4" />
        <rect x="110" y="5" width="80" height="20" fill="#374151" rx="5" />
        <rect x="90" y="140" width="120" height="130" fill="#ffffff" stroke="#9ca3af" strokeWidth="2" />
        <text x="150" y="170" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1f2937">UNIVERSAL</text>
        <text x="150" y="190" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1f2937">INDICATOR</text>
        
        <g id="color-strips">
          {sections.map((sec, i) => (
            <rect key={sec.id} x={100 + (i % 3) * 33} y={210 + Math.floor(i / 3) * 25} width="30" height="20" fill={sec.color} opacity={getOpacity(sec.id)} />
          ))}
        </g>
      </g>

      {showLabels && (
        <g id="labels" fontSize="14" fill="#374151">
          {sections.map((sec, i) => (
            <g key={\`label-\${sec.id}\`} opacity={getOpacity(sec.id)}>
              <circle cx={420} cy={100 + i * 40} r="12" fill={sec.color} />
              <text x="445" y={105}>{sec.label} (pH {sec.ph})</text>
            </g>
          ))}
        </g>
      )}

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && (
            <g>
              <line x1="90" y1="210" x2="220" y2="210" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="80" cy="210" r="12" fill="#000" />
              <text x="80" y="215" fill="#fff" fontSize="14" textAnchor="middle">1</text>
            </g>
          )}
          {pointerCount >= 2 && (
            <g>
              <line x1="390" y1="100" x2="350" y2="100" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="340" cy="100" r="12" fill="#000" />
              <text x="340" y="105" fill="#fff" fontSize="14" textAnchor="middle">2</text>
            </g>
          )}
          {pointerCount >= 3 && (
            <g>
              <line x1="390" y1="300" x2="350" y2="300" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="340" cy="300" r="12" fill="#000" />
              <text x="340" y="305" fill="#fff" fontSize="14" textAnchor="middle">3</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
};

export default UniversalIndicator;
