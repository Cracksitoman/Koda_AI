import React, { useRef, useEffect, useState } from 'react';
import { Message, ChatSession } from '../types';
import { SendIcon, SparklesIcon, MenuIcon, PlusIcon, XIcon, TrashIcon, ChatIcon, ClockIcon, DownloadIcon } from './Icons';

interface ChatSidebarProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  sessions: ChatSession[];
  currentSessionId: string;
  hasCode: boolean;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  onExport: () => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (id: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  messages, 
  input, 
  isLoading, 
  sessions,
  currentSessionId,
  hasCode,
  onInputChange, 
  onSend,
  onNewChat,
  onExport,
  onSelectSession,
  onDeleteSession
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  
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
            <div className="text-primary">
               {!showHistory ? <SparklesIcon /> : null}
            </div>
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
              <div className="text-zinc-500 text-center mt-10 text-sm flex flex-col items-center">
                 <div className="bg-zinc-800 p-4 rounded-full mb-4">
                    <SparklesIcon />
                 </div>
                <p className="mb-2 font-medium text-zinc-300">Crea un nuevo juego</p>
                <p className="text-xs max-w-[200px]">Describe tu idea y la IA generará el código por ti.</p>
                <div className="mt-4 grid grid-cols-1 gap-2 w-full max-w-[250px]">
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
                  
                  {/* Bouncing Dots */}
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200"></span>
                  </div>

                  {/* Timer Divider */}
                  <div className="h-4 w-px bg-zinc-700"></div>

                  {/* Timer Display */}
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

          {/* Input Area */}
          <div className="p-3 border-t border-secondary bg-background/50 backdrop-blur-sm z-10">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe tu juego..."
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
            {sessions.length === 0 ? (
               <div className="text-center text-zinc-500 mt-10">
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
                        {formatDate(session.lastModified)} • V{session.version}
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