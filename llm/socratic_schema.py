# socratic_schema.py
import os, json, hashlib

# Correct shape for Responses API:
# tools[i] must look like:
# {
#   "type": "function",
#   "function": {
#       "name": "...",
#       "description": "...",
#       "parameters": { ... JSON Schema ... }
#   }
# }

# socratic_schema.py
SOCRATIC_TOOL = {
    "type": "function",
    "name": "socratic_turn",  
    "description": "One Socratic mentoring turn for SOC_GEN_SMP_001",
    "parameters": {            
        "type": "object",
        "properties": {
            "step_id": {"type": "integer", "enum": [1, 2, 3, 4, 5, 6]},
            "assistant_message": {"type": "string", "minLength": 1, "maxLength": 600},
            "question": {"type": "string", "minLength": 1, "maxLength": 300, "pattern": ".*\\?$"},
            "validation": {"type": "boolean"},
            "notes": {"type": "string"}
        },
        "required": ["step_id", "assistant_message", "question"],
        "additionalProperties": False
    }
}

