import React, { useEffect, useRef, useState } from 'react';
import { RefreshIcon } from './Icons';

interface GamePreviewProps {
  code: string | null;
}

const GamePreview: React.FC<GamePreviewProps> = ({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0); // Used to force reload iframe

  useEffect(() => {
    // When code changes, reload the iframe
    setKey(prev => prev + 1);
  }, [code]);

  const handleReload = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-secondary relative group">
      {/* Header Label */}
      <div className="absolute top-0 left-0 bg-secondary/80 backdrop-blur px-3 py-1 rounded-br-lg z-10 border-b border-r border-zinc-700">
        <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">Game Preview</span>
      </div>

      {!code ? (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 bg-black/20 p-8 text-center">
          <div className="w-20 h-20 border-2 border-dashed border-zinc-700 rounded-2xl mb-6 flex items-center justify-center opacity-50">
            <span className="text-4xl">🎮</span>
          </div>
          <h3 className="text-lg font-medium text-zinc-300 mb-2">Vista Previa del Juego</h3>
          <p className="max-w-md mx-auto mb-4">
            El juego generado aparecerá aquí. Describe tu idea en el chat de la izquierda para comenzar.
          </p>
          <div className="text-xs bg-zinc-800/50 px-3 py-2 rounded border border-zinc-700/50">
            Ejemplo: "Crea un juego de naves espaciales"
          </div>
        </div>
      ) : (
        <>
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleReload}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg shadow-lg border border-zinc-700 transition-colors"
              title="Reiniciar Juego"
            >
              <RefreshIcon />
            </button>
          </div>
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={code}
            title="Game Preview"
            className="w-full h-full bg-white"
            sandbox="allow-scripts allow-modals allow-popups allow-forms"
          />
        </>
      )}
    </div>
  );
};

export default GamePreview;