import os, json
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
from socratic_schema import SOCRATIC_TOOL

load_dotenv()
client = OpenAI(api_key = os.getenv("OPENAI_API_KEY"))
MODEL = "gpt-5"
PROMPT_PATH = Path(__file__).parent/"instructions.md"
INSTRUCTIONS = PROMPT_PATH.read_text() #open file and read its contents

def socratic_turn(user_text: str, step_hint: int|None=None): # takes user text and the step
    """Send one user turn and recieve one Socratic step JSON"""

    # define a function elsewhere (e.g. SOCRATIC_TOOL) with the naeme socratic_turn
    # then force that specific tool call
    tool_choice =  {"type": "function", "function": {"name": "socratic_turn"}}
    args = {
        "model": MODEL,
        "instructions": INSTRUCTIONS,
        "input": [{"role": "user", "content": user_text}],
        "tools": [SOCRATIC_TOOL],
        "tool_choice": tool_choice,
        # "metadata": {"test_id": "SOC_GEN_SMP_001"}
    }
    if step_hint is not None:
        # make hint visible to model
        args["input"].insert(0, {
            "role": "system",
            "content": f"Preferred next Socratic step: {step_hint}."
        })
    response = client.responses.create(**args)

    tool_calls = [p for p in response.output if p.type == "tool_call"]
    if not tool_calls:
        return {"step_id": 1, "assistant_message": response.output_text, "question": "What inputs and ouputs are needed?"}
    
    return json.loads(tool_calls[0].function.arguments)
    

# response = client.response.create()