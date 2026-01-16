import React, { useRef, useEffect, useState } from 'react';
import { Message, ChatSession, AIModel } from '../types';
import { SendIcon, SparklesIcon, MenuIcon, PlusIcon, XIcon, TrashIcon, ChatIcon, ClockIcon, DownloadIcon, ChevronDownIcon, RefreshIcon } from './Icons';

interface ChatSidebarProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  sessions: ChatSession[];
  currentSessionId: string;
  hasCode: boolean;
  currentModel: AIModel;
  onModelChange: (model: AIModel) => void;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  onExport: () => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (id: string) => void;
  onResetAll: () => void; // New Prop
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  messages, 
  input, 
  isLoading, 
  sessions,
  currentSessionId,
  hasCode,
  currentModel,
  onModelChange,
  onInputChange, 
  onSend,
  onNewChat,
  onExport,
  onSelectSession,
  onDeleteSession,
  onResetAll
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!showHistory) {
      scrollToBottom();
    }
  }, [messages, isLoading, showHistory]);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setElapsedTime(0);
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
      }, 100); // Update every 100ms
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col bg-surface border-r md:border-r border-b md:border-b-0 border-secondary w-full md:w-[400px] shrink-0 h-full relative overflow-hidden">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-secondary flex items-center justify-between bg-surface z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="text-zinc-400 hover:text-white transition-colors p-1 -ml-1 rounded-md hover:bg-zinc-800"
          >
            {showHistory ? <XIcon /> : <MenuIcon />}
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
              {showHistory ? 'Mis Proyectos' : 'Gambo Clone'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {hasCode && !showHistory && (
             <button
               onClick={onExport}
               className="text-zinc-400 hover:text-white transition-colors hover:bg-zinc-800 p-2 rounded-lg"
               title="Exportar HTML"
             >
               <DownloadIcon />
             </button>
          )}
          <button 
            onClick={() => {
              onNewChat();
              setShowHistory(false);
            }}
            className="text-primary hover:text-green-400 transition-colors bg-primary/10 hover:bg-primary/20 p-2 rounded-lg"
            title="Nuevo Proyecto"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Model Selector Bar */}
      {!showHistory && (
        <div className="px-4 py-2 border-b border-secondary bg-black/20 flex items-center justify-between">
           <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Modelo IA</span>
           <div className="relative">
             <button 
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded transition-colors border border-zinc-700"
             >
                {currentModel === 'gemini' ? (
                   <><span className="text-blue-400">★</span> Gemini (Google)</>
                ) : (
                   <><span className="text-pink-400">∞</span> Pollinations (Free)</>
                )}
                <ChevronDownIcon />
             </button>
             
             {showModelMenu && (
                <>
                <div className="fixed inset-0 z-30" onClick={() => setShowModelMenu(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-40 overflow-hidden">
                   <button 
                      onClick={() => { onModelChange('gemini'); setShowModelMenu(false); }}
                      className={`w-full text-left px-4 py-3 text-xs flex items-center gap-2 hover:bg-zinc-700 ${currentModel === 'gemini' ? 'bg-zinc-700/50 text-white' : 'text-zinc-400'}`}
                   >
                      <span className="text-blue-400 text-sm">★</span>
                      <div>
                         <div className="font-bold">Gemini 2.0</div>
                         <div className="text-[10px] opacity-70">Más inteligente, con espera.</div>
                      </div>
                   </button>
                   <div className="h-px bg-zinc-700 w-full"></div>
                   <button 
                      onClick={() => { onModelChange('pollinations'); setShowModelMenu(false); }}
                      className={`w-full text-left px-4 py-3 text-xs flex items-center gap-2 hover:bg-zinc-700 ${currentModel === 'pollinations' ? 'bg-zinc-700/50 text-white' : 'text-zinc-400'}`}
                   >
                      <span className="text-pink-400 text-sm">∞</span>
                      <div>
                         <div className="font-bold">Pollinations</div>
                         <div className="text-[10px] opacity-70">Sin límites, ilimitado.</div>
                      </div>
                   </button>
                </div>
                </>
             )}
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        
        {/* Chat Messages View */}
        <div 
          className={`absolute inset-0 flex flex-col transition-transform duration-300 ${
            showHistory ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-zinc-500 text-center mt-6 text-sm flex flex-col items-center">
                 <div className="bg-zinc-800 p-4 rounded-full mb-4">
                    {currentModel === 'gemini' ? <SparklesIcon /> : <span className="text-2xl">∞</span>}
                 </div>
                <p className="mb-2 font-medium text-zinc-300">
                  {currentModel === 'gemini' ? 'Modo: Gemini Flash' : 'Modo: Pollinations (Gratis)'}
                </p>
                <p className="text-xs max-w-[200px] mb-4">
                  {currentModel === 'gemini' 
                    ? 'Alta calidad, pero puede tener tiempos de espera (Error 429).' 
                    : 'Calidad estándar, sin colas de espera ni límites.'}
                </p>
                <div className="grid grid-cols-1 gap-2 w-full max-w-[250px]">
                   <button onClick={() => onInputChange("Juego de naves espaciales retro")} className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 p-2 rounded text-xs transition-colors">"Juego de naves retro"</button>
                   <button onClick={() => onInputChange("Juego de saltar plataformas con un gato")} className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 p-2 rounded text-xs transition-colors">"Plataformero con un gato"</button>
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-zinc-900 font-medium rounded-tr-sm' 
                      : 'bg-secondary text-zinc-200 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-zinc-800/50 border border-zinc-700/50 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${currentModel === 'gemini' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce delay-100 ${currentModel === 'gemini' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce delay-200 ${currentModel === 'gemini' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                  </div>
                  <div className="h-4 w-px bg-zinc-700"></div>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                     <ClockIcon />
                     <span className="min-w-[4ch] font-medium text-zinc-300">
                        {elapsedTime.toFixed(1)}s
                     </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-secondary bg-background/50 backdrop-blur-sm z-10">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Describe tu juego (${currentModel === 'gemini' ? 'Gemini' : 'Pollinations'})...`}
                className="w-full bg-secondary text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-[52px] md:h-[60px] max-h-[120px] overflow-hidden text-sm"
                disabled={isLoading}
              />
              <button
                onClick={onSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-zinc-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>

        {/* History List View */}
        <div 
          className={`absolute inset-0 bg-background overflow-y-auto transition-transform duration-300 ${
            showHistory ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
          }`}
        >
          <div className="p-4 space-y-2">
            
            {/* Reset Button */}
            <button 
              onClick={() => {
                if(window.confirm("¿Estás seguro? Se borrarán TODOS tus juegos y chats.")) {
                   onResetAll();
                }
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-red-900/50 bg-red-900/10 text-red-400 hover:bg-red-900/30 transition-colors mb-4 text-sm font-medium"
            >
               <RefreshIcon /> Reset Total (Arreglar App)
            </button>

            {sessions.length === 0 ? (
               <div className="text-center text-zinc-500 mt-4">
                 <p>No tienes proyectos guardados.</p>
               </div>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session);
                    setShowHistory(false);
                  }}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${
                    session.id === currentSessionId 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-secondary/30 border-secondary hover:bg-secondary/80 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div className={`mt-1 p-2 rounded-md ${session.id === currentSessionId ? 'bg-primary text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>
                      <ChatIcon />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className={`font-medium truncate ${session.id === currentSessionId ? 'text-primary' : 'text-zinc-200'}`}>
                        {session.name}
                      </span>
                      <span className="text-xs text-zinc-500 truncate">
                        {formatDate(session.lastModified)} • {session.model === 'pollinations' ? '∞ Pollinations' : '★ Gemini'}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-2 rounded hover:bg-zinc-800 transition-all"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatSidebar;