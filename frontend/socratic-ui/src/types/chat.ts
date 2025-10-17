export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  step?: number;
  validation?: boolean;
  notes?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  currentStep: number;
  status?: 'active' | 'archived' | 'deleted' | 'resolved';
}
