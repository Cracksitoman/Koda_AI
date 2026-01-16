import React, { useState, useEffect, useCallback } from 'react';
import ChatSidebar from './components/ChatSidebar';
import GamePreview from './components/GamePreview';
import CodeViewer from './components/CodeViewer';
import { sendMessageToGemini, resetChat } from './services/geminiService';
import { getSessions, saveSession, createSession, deleteSession } from './services/storageService';
import { exportGameAsHtml } from './services/exportService';
import { Message, GameState, ViewMode, ChatSession } from './types';
import { PlayIcon, CodeIcon, ChatIcon, DownloadIcon } from './components/Icons';

type MobileTab = 'chat' | 'play' | 'code';

const App: React.FC = () => {
  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // UI State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState<GameState>({
    code: null,
    version: 0,
    isLoading: false,
    error: null,
  });
  
  // View states
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  const [desktopViewMode, setDesktopViewMode] = useState<ViewMode>(ViewMode.PLAY);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize: Load sessions on mount
  useEffect(() => {
    const storedSessions = getSessions();
    setSessions(storedSessions);

    if (storedSessions.length > 0) {
      loadSession(storedSessions[0]);
    } else {
      createNewSession();
    }
  }, []);

  const createNewSession = useCallback(() => {
    const newSession = createSession();
    setSessions(prev => [newSession, ...prev]);
    loadSession(newSession);
  }, []);

  const loadSession = useCallback((session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setGameState({
      code: session.code,
      version: session.version,
      isLoading: false,
      error: null
    });
    // Reset Gemini context for the new session so it learns from the loaded messages
    resetChat();
  }, []);

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);

    // If we deleted the active session, switch to another or create new
    if (id === currentSessionId) {
      if (updatedSessions.length > 0) {
        loadSession(updatedSessions[0]);
      } else {
        createNewSession();
      }
    }
  };

  const handleExport = async () => {
    if (!gameState.code) return;
    
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const projectName = currentSession ? currentSession.name : 'gambo_project';
    
    setIsExporting(true);
    try {
      // Export as a single HTML file now
      exportGameAsHtml(gameState.code, projectName);
    } catch (e) {
      console.error("Export failed", e);
      alert("No se pudo exportar el proyecto.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || gameState.isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setGameState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // We pass the current message history to ensure context is maintained/restored
      const response = await sendMessageToGemini(userMessage.text, messages);
      
      const aiMessage: Message = {
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
      };

      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);

      let newCode = gameState.code;
      let newVersion = gameState.version;

      if (response.code) {
        newCode = response.code;
        newVersion = newVersion + 1;
        
        setGameState((prev) => ({
          ...prev,
          code: newCode,
          version: newVersion,
          isLoading: false,
        }));
        
        setMobileTab('play');
        setDesktopViewMode(ViewMode.PLAY);
      } else {
        setGameState((prev) => ({ ...prev, isLoading: false }));
      }

      // Auto-Save Session
      const currentSession = sessions.find(s => s.id === currentSessionId);
      if (currentSession) {
        // Update name if it's the default and we have user input
        let name = currentSession.name;
        if (currentSession.messages.length === 0 && userMessage.text) {
          name = userMessage.text.slice(0, 30) + (userMessage.text.length > 30 ? '...' : '');
        }

        const updatedSession: ChatSession = {
          ...currentSession,
          name,
          messages: updatedMessages,
          code: newCode,
          version: newVersion,
          lastModified: Date.now()
        };

        saveSession(updatedSession);
        
        // Update local state list so sidebar updates
        setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
      }

    } catch (error) {
      console.error(error);
      setGameState((prev) => ({ 
        ...prev, 
        isLoading: false, 
        error: "Failed to generate response." 
      }));
      setMessages((prev) => [...prev, {
        role: 'model',
        text: "Hubo un error al generar el juego. Por favor intenta de nuevo.",
        timestamp: Date.now()
      }]);
    }
  };

  return (
    <div className="h-screen w-full bg-background overflow-hidden font-sans flex flex-col md:flex-row">
      
      {/* ================= DESKTOP LAYOUT (md:flex) ================= */}
      <div className="hidden md:block h-full shrink-0">
        <ChatSidebar
          messages={messages}
          input={input}
          isLoading={gameState.isLoading}
          sessions={sessions}
          currentSessionId={currentSessionId}
          hasCode={!!gameState.code}
          onInputChange={setInput}
          onSend={handleSend}
          onNewChat={createNewSession}
          onSelectSession={loadSession}
          onDeleteSession={handleDeleteSession}
          onExport={handleExport}
        />
      </div>

      <div className="hidden md:flex flex-1 flex-col h-full overflow-hidden relative">
        <div className="h-16 border-b border-secondary flex items-center justify-between px-6 bg-surface">
           <div className="flex items-center gap-2">
             <span className="text-zinc-400 text-sm font-medium">
               {gameState.code ? `Version ${gameState.version}` : 'Nuevo Proyecto'}
             </span>
             {gameState.isLoading && (
               <span className="text-xs text-primary animate-pulse ml-2">Programando...</span>
             )}
          </div>
          <div className="flex bg-secondary p-1 rounded-lg">
             {gameState.code && (
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all mr-2 disabled:opacity-50"
                title="Exportar HTML"
              >
                {isExporting ? <span className="animate-spin">⌛</span> : <DownloadIcon />}
                Exportar
              </button>
             )}
            <button
              onClick={() => setDesktopViewMode(ViewMode.PLAY)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                desktopViewMode === ViewMode.PLAY 
                  ? 'bg-zinc-700 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PlayIcon /> Vista Previa
            </button>
            <button
              onClick={() => setDesktopViewMode(ViewMode.CODE)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                desktopViewMode === ViewMode.CODE 
                  ? 'bg-zinc-700 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CodeIcon /> Código
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 bg-black/50 overflow-hidden relative">
          <div className="w-full h-full max-w-5xl mx-auto">
             {desktopViewMode === ViewMode.PLAY ? (
               <GamePreview code={gameState.code} />
             ) : (
               <CodeViewer code={gameState.code} />
             )}
          </div>
        </div>
      </div>


      {/* ================= MOBILE LAYOUT (md:hidden) ================= */}
      <div className="md:hidden flex-1 relative overflow-hidden bg-background">
        
        {/* Tab: Chat (Includes History Drawer) */}
        <div className={`absolute inset-0 z-10 ${mobileTab === 'chat' ? 'block' : 'hidden'}`}>
           <ChatSidebar
              messages={messages}
              input={input}
              isLoading={gameState.isLoading}
              sessions={sessions}
              currentSessionId={currentSessionId}
              hasCode={!!gameState.code}
              onInputChange={setInput}
              onSend={handleSend}
              onNewChat={createNewSession}
              onSelectSession={loadSession}
              onDeleteSession={handleDeleteSession}
              onExport={handleExport}
            />
        </div>

        {/* Tab: Play */}
        <div className={`absolute inset-0 z-10 bg-black/50 p-2 ${mobileTab === 'play' ? 'flex' : 'hidden'} flex-col`}>
          <div className="w-full h-full rounded-lg overflow-hidden">
             <GamePreview code={gameState.code} />
          </div>
          {gameState.isLoading && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface/90 border border-primary/30 px-4 py-2 rounded-full text-primary text-xs flex items-center gap-2 shadow-xl backdrop-blur">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Generando Juego...
             </div>
          )}
          {/* Mobile Export Button Overlay */}
          {gameState.code && (
            <div className="absolute top-4 right-4">
              <button 
                onClick={handleExport}
                className="bg-zinc-800/80 backdrop-blur p-2 rounded-full text-white border border-zinc-700 shadow-lg"
              >
                <DownloadIcon />
              </button>
            </div>
          )}
        </div>

        {/* Tab: Code */}
        <div className={`absolute inset-0 z-10 bg-[#1e1e1e] ${mobileTab === 'code' ? 'block' : 'hidden'}`}>
           <CodeViewer code={gameState.code} />
        </div>
      </div>

      <div className="md:hidden h-16 bg-surface border-t border-secondary shrink-0 flex items-center justify-around px-2 pb-safe z-50">
        <button 
          onClick={() => setMobileTab('chat')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${mobileTab === 'chat' ? 'text-primary' : 'text-zinc-500'}`}
        >
          <ChatIcon />
          <span className="text-[10px] font-medium">Chat</span>
        </button>

        <button 
          onClick={() => setMobileTab('play')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${mobileTab === 'play' ? 'text-primary' : 'text-zinc-500'}`}
        >
          <PlayIcon />
          <span className="text-[10px] font-medium">Jugar</span>
        </button>

        <button 
          onClick={() => setMobileTab('code')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${mobileTab === 'code' ? 'text-primary' : 'text-zinc-500'}`}
        >
          <CodeIcon />
          <span className="text-[10px] font-medium">Código</span>
        </button>
      </div>

    </div>
  );
};

export default App;