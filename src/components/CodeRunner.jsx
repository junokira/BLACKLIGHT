import React, { useEffect, useRef } from 'react';

export default function CodeRunner({ code = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const html = `<!doctype html><html><head><meta charset=\"utf-8\"></head><body><pre id=\"log\"></pre><script>(function(){const log=(...a)=>{const el=document.getElementById('log');el.textContent+=a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' ')+'\\n';};const c=console.log.bind(console);console.log=(...a)=>{log(...a);c(...a);};try{${code}}catch(e){log('Error:',e.message);}})();<\/script></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const iframe = ref.current;
    if (iframe) iframe.src = url;
    return () => URL.revokeObjectURL(url);
  }, [code]);

  return (
    <iframe
      ref={ref}
      sandbox="allow-scripts"
      className="w-full h-64 border rounded bg-white"
      title="Code Runner"
    />
  );
}


