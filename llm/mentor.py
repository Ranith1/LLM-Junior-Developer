import os, json, hashlib
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from socratic_schema import SOCRATIC_TOOL

# env + paths
# create an env + your own open ai key 
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("MODEL_NAME", "gpt-4o-mini")

PROMPT_PATH = BASE_DIR / "instructions.md"
if not PROMPT_PATH.exists():
    raise FileNotFoundError(f"Missing instructions.md at {PROMPT_PATH}")
INSTRUCTIONS = PROMPT_PATH.read_text(encoding="utf-8")


def _extract_tool_args(resp) -> dict:
    """Extract function/tool call arguments from responses api output
    Handles function_call/tool_call events types"""
    output = getattr(resp, "output", []) or []

    parts = [p for p in output if getattr(p, "type", "") in ("function_call", "tool_call")]
    if not parts:
        return {}

    call = parts[0]

    # Newer SDK objects typically expose .function.arguments; fallbacks included.
    args_json = None
    if hasattr(call, "function") and getattr(call.function, "arguments", None):
        args_json = call.function.arguments
    elif hasattr(call, "arguments"):  # rare fallback
        args_json = call.arguments

    if not args_json:
        return {}

    try:
        parsed = json.loads(args_json)
        if os.getenv("SOC_DEBUG", "0") == "1":
            print("[RESP DEBUG] parsed tool args:", parsed)
        return parsed
    except Exception as e:
        if os.getenv("SOC_DEBUG", "0") == "1":
            print("[RESP DEBUG] JSON parse error:", repr(e), "raw:", (args_json[:200] if isinstance(args_json, str) else type(args_json)))
        return {}


def socratic_turn(user_text: str, step_hint: int | None = None, conversation_history: list = None):
    """One Socratic turn. Returns dict: { step_id, assistant_message, question, validation?, notes? }"""
    
    # Use the instructions as-is - the new system prompt handles everything internally
    call_instructions = INSTRUCTIONS
    
    # Only add step hint if provided (let the system prompt handle step progression naturally)
    if step_hint is not None:
        call_instructions += f"\n\nCURRENT STEP: You are currently on step {step_hint}."
    
    # Add critical reminder at end (LLMs have recency bias - pay most attention to end of prompt)
    call_instructions += """

CRITICAL REMINDER - Your response format:
- assistant_message: Statements ONLY. NO questions. NO question marks.
- question: Must end with ?
- NO meta-commentary in either field.
This is your ONLY valid output format."""

    # Build input messages with conversation history for context
    input_msgs = []
    
    # Add conversation history if provided (limit to last 10 messages to save tokens)
    if conversation_history:
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
        input_msgs.extend(recent_history)
    
    # Add the current user message
    input_msgs.append({"role": "user", "content": user_text})

    tool_choice = {"type": "function", "name": "socratic_turn"}

    if os.getenv("SOC_DEBUG", "0") == "1":
        print(f"[DEBUG] Step hint: {step_hint}")
        print(f"[DEBUG] Input messages count: {len(input_msgs)}")

    try:
        resp = client.responses.create(
            model=MODEL,
            instructions=call_instructions,
            input=input_msgs,
            tools=[SOCRATIC_TOOL],
            tool_choice=tool_choice,
            temperature=0.3,  # Lower temperature for more consistent, predictable responses
            top_p=0.9,  # Nucleus sampling: only consider top 90% probability tokens
        )
    except Exception as e:
        if os.getenv("SOC_DEBUG", "0") == "1":
            print(f"[DEBUG] API Error: {e}")
        # Simple fallback
        fallback_step = step_hint or 1
        return {
            "step_id": fallback_step,
            "assistant_message": "I need to understand your problem better.",
            "question": "Could you clarify what specific issue you're facing?",
            "notes": "fallback_response"
        }

    payload = _extract_tool_args(resp)
    if not payload:
        # Simple fallback
        fallback_step = step_hint or 1
        return {
            "step_id": fallback_step,
            "assistant_message": "I need to understand your problem better.",
            "question": "Could you clarify what specific issue you're facing?",
            "notes": "fallback_response"
        }

    # Clean up the response
    msg = (payload.get("assistant_message") or "Great start — let's scope it together.").strip()
    q = (payload.get("question") or "What inputs and outputs are needed?").strip()
    if not q.endswith("?"):
        q = q.rstrip(".") + "?"

    payload["assistant_message"] = msg
    payload["question"] = q
    return payload


if __name__ == "__main__":
    demo = socratic_turn(
        "Create a function that takes two numbers and an operation (+, -, *, /) and returns the result.",
        step_hint=1,
    )
    print(json.dumps(demo, indent=2))
