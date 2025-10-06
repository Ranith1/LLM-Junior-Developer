import { useState, useCallback } from 'react';
import type { Message, ChatSession } from '../types/chat';

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const generateTitle = useCallback((firstMessage: string): string => {
    const maxLength = 50;
    const cleaned = firstMessage.trim();
    return cleaned.length <= maxLength ? cleaned : cleaned.substring(0, maxLength) + '...';
  }, []);

  const saveCurrentSession = useCallback(() => {
    if (messages.length === 0 || !currentSessionId) return;
    
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? {
            ...s,
            messages,
            messageCount: messages.length,
            currentStep,
            updatedAt: new Date().toISOString(),
            title: s.title === 'New Chat' 
              ? generateTitle(messages.find(m => m.type === 'user')?.content || 'New Chat')
              : s.title
          }
        : s
    ));
  }, [messages, currentSessionId, currentStep, generateTitle]);

  const createNewChat = useCallback(() => {
    // Save current session before creating new one
    saveCurrentSession();
    
    const newSession: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      currentStep: 1,
    };
    
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setCurrentStep(1);
  }, [saveCurrentSession]);

  const selectSession = useCallback((sessionId: string) => {
    // Save current session before switching
    saveCurrentSession();
    
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setCurrentStep(session.currentStep);
    }
  }, [sessions, saveCurrentSession]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      const updated = [...prev, message];
      
      // Auto-create first session if needed
      if (!currentSessionId && message.type === 'user') {
        const firstSession: ChatSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: generateTitle(message.content),
          messages: updated,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: updated.length,
          currentStep,
        };
        setSessions([firstSession]);
        setCurrentSessionId(firstSession.id);
      } else if (currentSessionId) {
        // Update existing session
        setSessions(prevSessions => prevSessions.map(s => 
          s.id === currentSessionId
            ? {
                ...s,
                messages: updated,
                messageCount: updated.length,
                updatedAt: new Date().toISOString(),
                title: s.title === 'New Chat' && message.type === 'user'
                  ? generateTitle(message.content)
                  : s.title
              }
            : s
        ));
      }
      
      return updated;
    });
  }, [currentSessionId, currentStep, generateTitle]);

  return {
    sessions,
    currentSessionId,
    messages,
    currentStep,
    setCurrentStep,
    createNewChat,
    selectSession,
    addMessage,
  };
}
