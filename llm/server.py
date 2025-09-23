
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from mentor import socratic_turn  # uses your existing function

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConversationMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class SocraticReq(BaseModel):
    text: str
    step: Optional[int] = None
    conversation_history: Optional[List[ConversationMessage]] = None

class SocraticRes(BaseModel):
    step_id: Optional[int] = None
    assistant_message: str
    question: str
    validation: Optional[bool] = None
    notes: Optional[str] = None

@app.post("/socratic-turn", response_model=SocraticRes)
def do_turn(req: SocraticReq) -> Dict[str, Any]:
    # Convert conversation history to dict format for mentor.py
    conversation_history = None
    if req.conversation_history:
        conversation_history = [
            {"role": msg.role, "content": msg.content} 
            for msg in req.conversation_history
        ]
    
    result = socratic_turn(req.text, req.step, conversation_history)
    # Make sure we always return the keys the UI expects
    return {
        "step_id": result.get("step_id"),
        "assistant_message": result.get("assistant_message", ""),
        "question": result.get("question", ""),
        "validation": result.get("validation"),
        "notes": result.get("notes"),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)