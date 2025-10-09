// src/api.ts
export type ConversationMessage = {
  role: string;
  content: string;
};

export type SocraticReq = { 
  text: string; 
  step?: number | null;
  conversation_history?: ConversationMessage[];
};

export type SocraticRes = {
  step_id?: number;
  assistant_message: string;
  question: string;
  validation?: boolean;
  notes?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function socraticTurn(req: SocraticReq): Promise<SocraticRes> {
  const r = await fetch(`${API_BASE}/socratic-turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ==============================================
// AUTHENTICATION APIs
// ==============================================

const AUTH_BASE = import.meta.env.VITE_AUTH_BASE_URL ?? "http://localhost:5001";

export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'student' | 'senior';
};

export type AuthResponse = {
  success: boolean;
  message: string;
  user: User;
  token: string;
};

export type AuthError = {
  success: false;
  message: string;
  error?: string;
};

/**
 * Sign up a new user
 */
export async function signup(
  name: string,
  email: string,
  password: string,
  role: 'student' | 'senior'
): Promise<AuthResponse> {
  const r = await fetch(`${AUTH_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

/**
 * Login user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const r = await fetch(`${AUTH_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

/**
 * Verify JWT token and get user data
 */
export async function verifyToken(token: string): Promise<{ success: boolean; user: User }> {
  const r = await fetch(`${AUTH_BASE}/api/auth/verify`, {
    method: "GET",
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const r = await fetch(`${AUTH_BASE}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}


// ==============================================
// CONVERSATION & MESSAGE APIs
// ==============================================

// Import types from types/chat.ts (single source of truth)
import type { Message, ChatSession } from './types/chat';

/**
 * Helper: Get JWT token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Helper: Get headers with auth token
 */
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` })
  };
};

/**
 * Get all conversations for the current user
 * GET /api/conversations
 */
export async function getConversations(): Promise<{ success: boolean; conversations: ChatSession[] }> {
  const r = await fetch(`${AUTH_BASE}/api/conversations`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  
  // Backend doesn't return messages in list view, so we add empty array
  const conversationsWithMessages = data.conversations.map((conv: any) => ({
    ...conv,
    messages: [] // List view doesn't include messages
  }));
  
  return { ...data, conversations: conversationsWithMessages };
}

/**
 * Get a specific conversation with messages
 * GET /api/conversations/:id
 */
export async function getConversation(conversationId: string): Promise<{
  success: boolean;
  conversation: ChatSession;
  messages: Message[];
}> {
  const r = await fetch(`${AUTH_BASE}/api/conversations/${conversationId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

export async function createConversation(title?: string): Promise<{
  success: boolean;
  conversation: ChatSession;
}> {
  const r = await fetch(`${AUTH_BASE}/api/conversations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title: title || 'New Chat' }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  
  // Add empty messages array to match ChatSession type
  return {
    ...data,
    conversation: {
      ...data.conversation,
      messages: []
    }
  };
}

/**
 * Update a conversation
 * PUT /api/conversations/:id
 */
export async function updateConversation(
  conversationId: string,
  updates: { title?: string; currentStep?: number; status?: string }
): Promise<{
  success: boolean;
  conversation: ChatSession;
}> {
  const r = await fetch(`${AUTH_BASE}/api/conversations/${conversationId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

/**
 * Delete a conversation (soft delete)
 * DELETE /api/conversations/:id
 */
export async function deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
  const r = await fetch(`${AUTH_BASE}/api/conversations/${conversationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

/**
 * Add a message to a conversation
 * POST /api/conversations/:id/messages
 */
export async function addMessage(
  conversationId: string,
  message: {
    type: 'user' | 'assistant';
    content: string;
    step?: number;
    validation?: boolean;
    notes?: string;
  }
): Promise<{
  success: boolean;
  message: Message;
}> {
  const r = await fetch(`${AUTH_BASE}/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(message),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}


// ==============================================
// HELP REQUEST APIs
// ==============================================

export type HelpRequest = {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  conversation_id: string;
  problem_description: string;
  conversation_summary: string;
  assigned_senior_id: string;
  status: 'pending' | 'contacted' | 'resolved' | 'cancelled';
  created_at: string;
  contacted_at?: string;
  resolved_at?: string;
};

/**
 * Create a new help request (Student Step 6)
 * POST /api/help-requests
 */
export async function createHelpRequest(
  conversationId: string,
  problemDescription: string
): Promise<{
  success: boolean;
  message: string;
  helpRequest: {
    id: string;
    assignedSenior: {
      name: string;
      email: string;
    };
  };
}> {
  const r = await fetch(`${AUTH_BASE}/api/help-requests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ conversationId, problemDescription }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

/**
 * Get help requests assigned to the logged-in senior
 * GET /api/help-requests/assigned-to-me
 */
export async function getMyAssignedRequests(): Promise<{
  success: boolean;
  helpRequests: HelpRequest[];
}> {
  const r = await fetch(`${AUTH_BASE}/api/help-requests/assigned-to-me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

/**
 * Update help request status (Senior)
 * PUT /api/help-requests/:id/status
 */
export async function updateHelpRequestStatus(
  requestId: string,
  status: 'pending' | 'contacted' | 'resolved' | 'cancelled'
): Promise<{
  success: boolean;
  message: string;
  helpRequest: HelpRequest;
}> {
  const r = await fetch(`${AUTH_BASE}/api/help-requests/${requestId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`);
  return data;
}

/**
 * Get student's own help requests
 * GET /api/help-requests/my-requests
 */
export async function getMyRequests(): Promise<{
  success: boolean;
  helpRequests: HelpRequest[];
}> {
  const r = await fetch(`${AUTH_BASE}/api/help-requests/my-requests`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}


/**
 * Check if a conversation has an active help request
 * GET /api/help-requests/conversation/:conversationId
 */
export async function getHelpRequestByConversation(
  conversationId: string
): Promise<{
  success: boolean;
  hasHelpRequest: boolean;
  helpRequest: HelpRequest | null;
}> {
  const r = await fetch(`${AUTH_BASE}/api/help-requests/conversation/${conversationId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`);
  return data;
}
