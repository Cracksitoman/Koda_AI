import { ChatSession } from "../types";

const STORAGE_KEY = 'gambo_sessions';

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const getSessions = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const sessions = JSON.parse(stored);
    // Sort by last modified (newest first)
    return sessions.sort((a: ChatSession, b: ChatSession) => b.lastModified - a.lastModified);
  } catch (e) {
    console.error("Failed to load sessions", e);
    return [];
  }
};

export const saveSession = (session: ChatSession) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const createSession = (): ChatSession => {
  const newSession: ChatSession = {
    id: generateId(),
    name: 'New Project',
    messages: [],
    code: null,
    version: 0,
    lastModified: Date.now()
  };
  // We don't save immediately, we wait for the first interaction to save
  return newSession;
};

export const deleteSession = (id: string) => {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const updateSessionName = (id: string, name: string) => {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === id);
  if (session) {
    session.name = name;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
};

export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEY);
};