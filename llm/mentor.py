
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
MODEL = os.getenv("MODEL_NAME", "gpt-5-mini")

PROMPT_PATH = BASE_DIR / "instructions.md"
if not PROMPT_PATH.exists():
    raise FileNotFoundError(f"Missing instructions.md at {PROMPT_PATH}")
INSTRUCTIONS = PROMPT_PATH.read_text(encoding="utf-8")


def _extract_tool_args(resp) -> dict:

# extract function/tool call arguments from responses api output
# handes function_call/tool_call events types
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
#     One Socratic turn. Returns dict: { step_id, assistant_message, question, validation?, notes? }
    
    call_instructions = INSTRUCTIONS
    if step_hint is not None:
        call_instructions += (
            f"\n\nSYSTEM DIRECTIVE: set step_id to {step_hint} for THIS turn "
            f"(unless the learner clearly regressed)."
        )

    # Build input messages with conversation history for context
    input_msgs = []
    
    # Add conversation history if provided
    if conversation_history:
        input_msgs.extend(conversation_history)
    
    # Add the current user message
    input_msgs.append({"role": "user", "content": user_text})
    
    # Add system directive if step hint is provided
    if step_hint is not None:
        input_msgs.insert(0, {"role": "system", "content": f"NEXT STEP MUST BE {step_hint}."})

    
    tool_choice = {"type": "function", "name": "socratic_turn"}



    resp = client.responses.create(
        model=MODEL,
        instructions=call_instructions,
        input=input_msgs,
        tools=[SOCRATIC_TOOL],
        tool_choice=tool_choice,

    )

    payload = _extract_tool_args(resp)
    if not payload:
        
        fallback_text = (getattr(resp, "output_text", "") or "Great start — let’s scope it together.").strip()
        return {
            "step_id": 1,
            "assistant_message": fallback_text,
            "question": "What inputs and outputs are needed?",
        }

    
    msg = (payload.get("assistant_message") or "Great start — let’s scope it together.").strip()
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
