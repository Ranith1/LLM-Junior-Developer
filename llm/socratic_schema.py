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
    "description": """One Socratic mentoring turn following the 6-step framework.

CRITICAL FIELD SEPARATION RULES:
1. assistant_message: Feedback, acknowledgment, or context ONLY. Must be statements. NO questions allowed. NO question marks (?) permitted.
2. question: The actual question(s) you ask. Must end with ?. ONLY questions go here.

CORRECT EXAMPLES:
✓ Step 1:
  assistant_message: "I see you're working on a loop problem. Let me clarify the requirements."
  question: "1) What specific output are you trying to achieve? 2) What constraints do you have? 3) What have you tried so far?"

✓ Step 5 (closing):
  assistant_message: "Perfect! Great work today. Best of luck with your coding journey!"
  question: "Happy coding?"

WRONG EXAMPLES:
✗ assistant_message: "What are you trying to do?" <- Question not allowed here
✗ assistant_message: "Great! What happens next?" <- Contains question
✗ question: "Tell me about your problem" <- Missing question mark

ABSOLUTE PROHIBITIONS:
- NO meta-commentary like "* This", "* The assistant", "NOTE:", "INTERNAL:" in either field
- NO duplicating content between assistant_message and question
- NO questions in assistant_message field under any circumstances""",
    "parameters": {            
        "type": "object",
        "properties": {
            "step_id": {
                "type": "integer", 
                "enum": [1, 2, 3, 4, 5, 6],
                "description": "Current step in the 6-step Socratic framework"
            },
            "assistant_message": {
                "type": "string", 
                "minLength": 1, 
                "maxLength": 600,
                "description": "Statements ONLY. Feedback, acknowledgment, or context. Contains NO questions. Contains NO question marks (?). Example: 'Great observation about the loop structure.'"
            },
            "question": {
                "type": "string", 
                "minLength": 1, 
                "maxLength": 300, 
                "pattern": ".*\\?$",
                "description": "The question(s) you want to ask. Must end with ?. Example: 'What do you think happens to the sum variable in each iteration?'"
            },
            "validation": {
                "type": "boolean",
                "description": "Set to true when validating user's understanding in Step 5"
            },
            "notes": {
                "type": "string",
                "description": "Internal notes for tracking (not shown to user)"
            }
        },
        "required": ["step_id", "assistant_message", "question"],
        "additionalProperties": False
    }
}

