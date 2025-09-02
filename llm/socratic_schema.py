# socratic_schema.py
SOCRATIC_TOOL = {
    "type": "function",
    "function": {
        "name": "socratic_turn",
        "description": "One Socratic mentoring turn for SOC_GEN_SMP_001",
        "parameters": {
            "type": "object",
            "properties": {
                "step_id": {"type": "integer", "enum": [1,2,3,4,5,6]},
                "assistant_message": {"type": "string", "description": "Short encouragement + context"},
                "question": {"type": "string", "description": "Exactly one question"},
                "validation": {"type": "boolean", "description": "True only in Step 5"},
                "notes": {"type": "string", "description": "Private rationale summary (1 sentence, no chain-of-thought)"}
            },
            "required": ["step_id", "assistant_message", "question"]
        }
    }
}
