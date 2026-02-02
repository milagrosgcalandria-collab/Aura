
export enum AppTab {
  CHAT = 'chat',
  VOICE = 'voice',
  IMAGE = 'image',
  ACCOUNT = 'account'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  imageUrl?: string;
  sources?: { title: string; uri: string }[];
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastTimestamp: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export interface BackgroundTask {
  id: string;
  type: 'image';
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  label: string;
  result?: any;
}
