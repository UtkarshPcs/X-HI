import React, { useEffect, useRef } from 'react';

export default function TikZRenderer({ data }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data.tikz_code) return;
    
    // Clear the container
    containerRef.current.innerHTML = '';
    
    // Create the script tag for TikZJax to observe and compile
    const script = document.createElement('script');
    script.type = 'text/tikz';
    script.textContent = data.tikz_code;
    
    // Append it to trigger the MutationObserver from tikzjax.js
    containerRef.current.appendChild(script);
  }, [data.tikz_code]);

  return <div ref={containerRef} className="tikz-diagram-container" />;
}
