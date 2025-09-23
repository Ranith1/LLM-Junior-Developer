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
