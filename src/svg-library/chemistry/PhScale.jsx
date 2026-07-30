import React from 'react';

const PhScale = ({ data }) => {
  const isHighlighted = (id) => data?.highlights?.includes(id) ?? false;
  const showLabels = data?.showLabels ?? true;
  const pointerCount = data?.pointerCount ?? 0;

  const getOpacity = (id) => {
    if (!data?.highlights || data.highlights.length === 0) return 1;
    return isHighlighted(id) ? 1 : 0.3;
  };

  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", 
    "#84cc16", "#22c55e", "#10b981", "#14b8a6", 
    "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", 
    "#8b5cf6", "#a855f7", "#d946ef"
  ];

  return (
    <svg viewBox="0 0 800 300" width="100%" xmlns="http://www.w3.org/2000/svg">
      <g id="scale" transform="translate(25, 100)">
        <g id="acidic" opacity={getOpacity("acidic")}>
          {colors.slice(0, 7).map((color, i) => (
            <rect key={i} x={i * 50} y="0" width="50" height="60" fill={color} />
          ))}
          {showLabels && <text x="175" y="-15" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#ef4444">Acidic</text>}
        </g>

        <g id="neutral" opacity={getOpacity("neutral")}>
          <rect x={7 * 50} y="0" width="50" height="60" fill={colors[7]} />
          {showLabels && <text x="375" y="-15" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#14b8a6">Neutral</text>}
        </g>

        <g id="alkaline" opacity={getOpacity("alkaline")}>
          {colors.slice(8, 15).map((color, i) => (
            <rect key={i + 8} x={(i + 8) * 50} y="0" width="50" height="60" fill={color} />
          ))}
          {showLabels && <text x="575" y="-15" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#8b5cf6">Alkaline</text>}
        </g>

        {showLabels && (
          <g id="numbers" fontSize="16" fill="#fff" fontWeight="bold">
            {colors.map((_, i) => (
              <text key={i} x={i * 50 + 25} y="35" textAnchor="middle">{i}</text>
            ))}
          </g>
        )}
      </g>

      {pointerCount > 0 && (
        <g id="pointers">
          {pointerCount >= 1 && (
            <g>
              <line x1="125" y1="210" x2="125" y2="170" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="125" cy="225" r="15" fill="#000" />
              <text x="125" y="230" fill="#fff" fontSize="14" textAnchor="middle">1</text>
            </g>
          )}
          {pointerCount >= 2 && (
            <g>
              <line x1="400" y1="210" x2="400" y2="170" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="400" cy="225" r="15" fill="#000" />
              <text x="400" y="230" fill="#fff" fontSize="14" textAnchor="middle">2</text>
            </g>
          )}
          {pointerCount >= 3 && (
            <g>
              <line x1="675" y1="210" x2="675" y2="170" stroke="#000" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="675" cy="225" r="15" fill="#000" />
              <text x="675" y="230" fill="#fff" fontSize="14" textAnchor="middle">3</text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
};

export default PhScale;
