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
// TODO: API Functions to Implement During Backend Integration
// ==============================================

/*
 * AUTHENTICATION APIs
 * Location: Used in contexts/AuthContext.tsx and pages/Auth/Auth.tsx
 * 
 * POST /api/auth/signup
 *   Body: { name, email, password, role }
 *   Response: { user: User, token: string }
 *   Purpose: Create new user account
 * 
 * POST /api/auth/login
 *   Body: { email, password }
 *   Response: { user: User, token: string }
 *   Purpose: Authenticate user and get JWT token
 * 
 * POST /api/auth/logout
 *   Headers: { Authorization: Bearer <token> }
 *   Purpose: Invalidate session/token
 * 
 * GET /api/auth/verify
 *   Headers: { Authorization: Bearer <token> }
 *   Response: { user: User }
 *   Purpose: Verify JWT token is valid and get user data
 */

/*
 * CONVERSATION APIs
 * Location: Used in hooks/useChatSessions.ts
 * 
 * GET /api/conversations?user_id={id}
 *   Query: user_id
 *   Response: { conversations: ChatSession[] }
 *   Purpose: Get all conversations for a specific user
 * 
 * POST /api/conversations
 *   Body: { user_id, title }
 *   Response: { conversation: ChatSession }
 *   Purpose: Create new conversation
 * 
 * GET /api/conversations/{id}
 *   Params: conversation_id
 *   Response: { conversation: ChatSession, messages: Message[] }
 *   Purpose: Get specific conversation with all messages
 * 
 * PUT /api/conversations/{id}
 *   Params: conversation_id
 *   Body: { title?, currentStep? }
 *   Response: { conversation: ChatSession }
 *   Purpose: Update conversation metadata (title, step, etc)
 * 
 * DELETE /api/conversations/{id}
 *   Params: conversation_id
 *   Response: { success: boolean }
 *   Purpose: Delete conversation and all its messages
 */

/*
 * MESSAGE APIs
 * Location: Used in hooks/useChatSessions.ts
 * 
 * POST /api/conversations/{id}/messages
 *   Params: conversation_id
 *   Body: { type, content, step?, validation?, notes? }
 *   Response: { message: Message }
 *   Purpose: Add new message to conversation
 * 
 * GET /api/conversations/{id}/messages
 *   Params: conversation_id
 *   Response: { messages: Message[] }
 *   Purpose: Get all messages for a conversation
 */

/*
 * NOTES FOR BACKEND INTEGRATION:
 * 
 * 1. JWT Token Storage:
 *    - Store token in localStorage: localStorage.setItem('authToken', token)
 *    - Include in all authenticated requests:
 *      headers: { 
 *        "Authorization": `Bearer ${token}`,
 *        "Content-Type": "application/json"
 *      }
 * 
 * 2. Error Handling:
 *    - 401 Unauthorized: Logout user and redirect to login
 *    - 403 Forbidden: Show permission error
 *    - 500 Server Error: Show generic error message
 * 
 * 3. MongoDB Schema Alignment:
 *    - User.username = User.email (using email as username)
 *    - ChatSession.user_id should reference User._id
 *    - All timestamps should be ISO strings
 * 
 * 4. Migration Strategy:
 *    - Replace mock data in AuthContext.login() with API call
 *    - Replace useChatSessions state management with API calls
 *    - Keep localStorage for offline support (optional)
 */
