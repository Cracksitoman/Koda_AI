export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface GameState {
  code: string | null;
  version: number;
  isLoading: boolean;
  error: string | null;
}

export enum ViewMode {
  PLAY = 'PLAY',
  CODE = 'CODE'
}

export interface ChatSession {
  id: string;
  name: string; // The title of the project (e.g., "Space Shooter")
  messages: Message[];
  code: string | null;
  version: number;
  lastModified: number;
}