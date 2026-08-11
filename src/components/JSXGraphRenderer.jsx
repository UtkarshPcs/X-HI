import React, { useEffect, useRef, useState } from 'react';
import JXG from 'jsxgraph';
import '../../node_modules/jsxgraph/distrib/jsxgraph.css';

const parseDSL = (board, dslString, theme) => {
  // Support either newline or semicolon as separator
  const instructions = dslString.split(/;|\n/).map(s => s.trim()).filter(Boolean);
  const elements = {}; // Store references to points and other elements
  
  // Theme styling defaults (could be extended based on dark/light mode)
  const strokeColor = theme === 'dark' ? '#cbd5e1' : '#334155'; // slate-300 or slate-700
  const fillColor = theme === 'dark' ? '#cbd5e1' : '#334155';
  
  instructions.forEach(inst => {
    try {
      // 1. Point Declaration: A = (0,0) or A = (0, 0)
      if (inst.includes('=')) {
        const [name, coordsStr] = inst.split('=').map(s => s.trim());
        const cleanCoords = coordsStr.replace(/[()]/g, '').split(',').map(s => parseFloat(s.trim()));
        if (cleanCoords.length === 2 && !isNaN(cleanCoords[0]) && !isNaN(cleanCoords[1])) {
          elements[name] = board.create('point', cleanCoords, { 
            name: name, 
            fixed: true, 
            size: 2,
            strokeColor: strokeColor,
            fillColor: fillColor,
            label: { strokeColor: strokeColor }
          });
        }
      }
      // 2. Line or Segment: "line AB" or "segment AB"
      else if (inst.startsWith('line ') || inst.startsWith('segment ')) {
        const isLine = inst.startsWith('line');
        const pts = inst.replace(/line|segment/g, '').trim().split(''); // 'AB' -> ['A', 'B']
        if (pts.length >= 2 && elements[pts[0]] && elements[pts[1]]) {
          elements[inst] = board.create(isLine ? 'line' : 'segment', [elements[pts[0]], elements[pts[1]]], { 
            strokeColor: strokeColor,
            fixed: true
          });
        }
      }
      // 3. Polygon / Triangle / Rectangle: "triangle ABC" or "polygon ABCD"
      else if (inst.startsWith('triangle ') || inst.startsWith('polygon ') || inst.startsWith('rectangle ')) {
        const parts = inst.split(' ');
        if (parts.length >= 2) {
          const pts = parts[1].split(''); // 'ABC' -> ['A', 'B', 'C']
          const mappedPts = pts.map(p => elements[p]).filter(Boolean);
          if (mappedPts.length >= 3) {
            elements[inst] = board.create('polygon', mappedPts, { 
              fillOpacity: 0.1, 
              borders: { strokeColor: strokeColor, fixed: true },
              fixed: true
            });
          }
        }
      }
      // 4. Circle: "circle A 5" (center A, radius 5) or "circle A B" (center A, through B)
      else if (inst.startsWith('circle ')) {
        const parts = inst.replace('circle ', '').trim().split(' ');
        if (parts.length === 2) {
          const center = elements[parts[0]];
          const radiusOrPt = isNaN(parseFloat(parts[1])) ? elements[parts[1]] : parseFloat(parts[1]);
          if (center && radiusOrPt !== undefined) {
             elements[inst] = board.create('circle', [center, radiusOrPt], {
               strokeColor: strokeColor,
               fixed: true
             });
          }
        }
      }
      // 5. Angle: "angle ABC"
      else if (inst.startsWith('angle ')) {
         const pts = inst.replace('angle ', '').trim().split('');
         if (pts.length === 3 && elements[pts[0]] && elements[pts[1]] && elements[pts[2]]) {
           elements[inst] = board.create('angle', [elements[pts[0]], elements[pts[1]], elements[pts[2]]], {
             strokeColor: strokeColor,
             fillColor: strokeColor,
             radius: 1,
             fixed: true
           });
         }
      }
    } catch (e) {
      console.warn(`JSXGraph DSL Parsing Error on instruction: "${inst}"`, e);
    }
  });
};

export default function JSXGraphRenderer({ data }) {
  const containerRef = useRef(null);
  const boardRef = useRef(null);
  // Generate a unique ID for the container so multiple instances don't clash
  const [containerId] = useState(`jsxgraph-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // 1. Initialize Board
    if (!boardRef.current && containerRef.current) {
      
      // Determine bounding box: default is [-5, 5, 5, -5]
      const bbox = data.boundingBox || [-1, 6, 7, -1];
      
      boardRef.current = JXG.JSXGraph.initBoard(containerId, {
        boundingbox: bbox,
        axis: data.showAxis !== false, // default true unless explicitly false
        showNavigation: false,
        showCopyright: false,
        pan: { enabled: false }, // Prevent dragging the canvas during test
        zoom: { enabled: false }
      });

      // Simple theme detection (could be passed in from context in a real app)
      const isDark = document.documentElement.classList.contains('dark');
      const theme = isDark ? 'dark' : 'light';

      // 2. Execute DSL Parser
      if (data.dsl) {
        parseDSL(boardRef.current, data.dsl, theme);
      }
    }

    // 3. Cleanup on Unmount (Crucial for React 18 Strict Mode)
    return () => {
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  }, [data, containerId]);

  return (
    <div className="w-full flex justify-center my-4">
      <div 
        id={containerId} 
        ref={containerRef}
        className="jxgbox rounded-md bg-white border border-slate-200 shadow-sm"
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          aspectRatio: '1 / 1', 
          margin: '0 auto' 
        }}
      />
      <span className="sr-only">{data.altText || "Mathematical geometry diagram"}</span>
    </div>
  );
}
