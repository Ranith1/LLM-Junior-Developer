import { useState, useCallback, useEffect } from 'react';
import type { Message, ChatSession } from '../types/chat';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../api';

export function useChatSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // HELPER: Generate title from first message
  // ============================================
  const generateTitle = useCallback((firstMessage: string): string => {
    const maxLength = 50;
    const cleaned = firstMessage.trim();
    return cleaned.length <= maxLength ? cleaned : cleaned.substring(0, maxLength) + '...';
  }, []);

  // ============================================
  // LOAD CONVERSATIONS from backend
  // ============================================
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getConversations();
      setSessions(response.conversations);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - only calls API

  // ============================================
  // LOAD CONVERSATIONS when user logs in
  // ============================================
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      // Clear state when user logs out
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
      setCurrentStep(1);
    }
  }, [user, loadConversations]); // Add loadConversations to dependencies

  // ============================================
  // CREATE NEW CONVERSATION
  // ============================================
  const createNewChat = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Call backend API to create conversation
      const response = await api.createConversation('New Chat');
      const newSession = response.conversation;

      // Update local state
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setCurrentStep(1);
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setError(err.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ============================================
  // SELECT/LOAD EXISTING CONVERSATION
  // ============================================
  const selectSession = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load conversation with messages from backend
      const response = await api.getConversation(sessionId);

      // Update state
      setCurrentSessionId(sessionId);
      setMessages(response.messages || []);
      setCurrentStep(response.conversation.currentStep);
    } catch (err: any) {
      console.error('Error loading conversation:', err);
      setError(err.message || 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, []);


  // Add this after the selectSession function (around line 104)

  // ============================================
  // DELETE CONVERSATION
  // ============================================
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Call backend API to delete conversation
      await api.deleteConversation(sessionId);

      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));

      // If we deleted the current session, clear it
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
        setCurrentStep(1);
      }
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      setError(err.message || 'Failed to delete conversation');
    } finally {
      setLoading(false);
    }
  }, [currentSessionId]);


  // ============================================
  // ADD MESSAGE (this is the key function!)
  // ============================================
  const addMessage = useCallback(async (
    message: Omit<Message, 'id' | 'timestamp'>,
    explicitConversationId?: string
  ) => {
    if (!user) return;

    try {
      // 1. CREATE CONVERSATION if needed (first message)
      let conversationId = explicitConversationId || currentSessionId;
      if (!conversationId && message.type === 'user') {
        const title = generateTitle(message.content);
        const response = await api.createConversation(title);
        conversationId = response.conversation.id;

        // Add to sessions list
        setSessions(prev => [response.conversation, ...prev]);
        setCurrentSessionId(conversationId);
      }

      if (!conversationId) {
        throw new Error('No active conversation');
      }

      // 2. SAVE MESSAGE to backend
      const response = await api.addMessage(conversationId, {
        type: message.type,
        content: message.content,
        step: message.step,
        validation: message.validation,
        notes: message.notes
      });

      // 3. UPDATE LOCAL STATE
      const newMessage = response.message;
      setMessages(prev => [...prev, newMessage]);

      // 4. UPDATE SESSION in list
      setSessions(prev => prev.map(s =>
        s.id === conversationId
          ? {
            ...s,
            messageCount: s.messageCount + 1,
            updatedAt: newMessage.timestamp,
            currentStep: message.step || s.currentStep,
            title: s.title === 'New Chat' && message.type === 'user'
              ? generateTitle(message.content)
              : s.title
          }
          : s
      ));

      // 5. UPDATE TITLE if it's first user message
      if (message.type === 'user') {
        // Use functional state update to access latest sessions
        setSessions(prevSessions => {
          const session = prevSessions.find(s => s.id === conversationId);
          if (session && session.title === 'New Chat') {
            const newTitle = generateTitle(message.content);

            // Update title in backend (fire and forget to avoid blocking)
            api.updateConversation(conversationId!, { title: newTitle }).catch(err => {
              console.error('Error updating conversation title:', err);
            });

            // Update local sessions
            return prevSessions.map(s =>
              s.id === conversationId ? { ...s, title: newTitle } : s
            );
          }
          return prevSessions;
        });
      }

      return { message: newMessage, conversationId };
    } catch (err: any) {
      console.error('Error adding message:', err);
      setError(err.message || 'Failed to add message');
      throw err;
    }
  }, [currentSessionId, user, generateTitle]); // Removed 'sessions' dependency

  // ============================================
  // RETURN ALL FUNCTIONS AND STATE
  // ============================================
  return {
    sessions,
    currentSessionId,
    messages,
    currentStep,
    setCurrentStep,
    createNewChat,
    selectSession,
    addMessage,
    deleteSession,
    loading,
    error,
    refreshConversations: loadConversations,
  };
}