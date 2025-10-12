# db_setup.py
import os
from datetime import datetime
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import OperationFailure
from dotenv import load_dotenv

load_dotenv()

##  connection string 
MONGODB_URI = os.getenv("MONGODB_URI") or "mongodb://admin:supersecret@localhost:27017/?authSource=admin" # for auth, "mongodb://localhost:27017" for no auth

DB_NAME = os.getenv("MONGO_DB") or "junior_llm"

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

# creates a collection
def ensure_collection(name, **kwargs):
    if name not in db.list_collection_names():
        db.create_collection(name, **kwargs)
        print(f"Created collection: {name}")
    else:
        print(f"Collection exists: {name}")

# schema validation (JSON schema)
# def set_validator(name, validator):
#     """Create or update a JSON Schema validator on a collection."""
#     if name not in db.list_collection_names():
#         db.create_collection(name, validator={"$jsonSchema": validator}, validationLevel="moderate")
#         print(f"Created collection with validator: {name}")
#     else:
#         try:
#             db.command({"collMod": name, "validator": {"$jsonSchema": validator}, "validationLevel": "moderate"})
#             print(f"Updated validator on: {name}")
#         except OperationFailure as e:
#             print(f"Validator update failed on {name}: {e}")

def ensure_indexes(coll, specs):
    """specs = [ (keys_dict, opts_dict), ... ]"""
    for keys, opts in specs:
        db[coll].create_index(list(keys.items()), **(opts or {}))
        print(f"Index ok on {coll}: {keys} {opts or ''}")

def main():
    # USERS
    ensure_collection("users")
    ensure_indexes("users", [
        ({"username": ASCENDING}, {"unique": True, "name": "uniq_username"}),
        ({"roles": ASCENDING}, {"name": "idx_roles"}),
        ({"created_at": DESCENDING}, {"name": "idx_created_at_desc"}),
    ])

    # LEARNING_PROFILES (1:1 with users)
    ensure_collection("learning_profiles")
    ensure_indexes("learning_profiles", [
        ({"user_id": ASCENDING}, {"unique": True, "name": "uniq_user_id"}),
        ({"updated_at": DESCENDING}, {"name": "idx_updated_at_desc"}),
    ])

    # CONVERSATIONS
    ensure_collection("conversations")
    ensure_indexes("conversations", [
        ({"user_id": ASCENDING, "started_at": DESCENDING}, {"name": "idx_user_started"}),
        ({"user_id": ASCENDING, "last_activity_at": DESCENDING}, {"name": "idx_user_lastactivity"}),
        ({"status": ASCENDING, "last_activity_at": DESCENDING}, {"name": "idx_status_lastactivity"}),
    ])
    # MESSAGES
    ensure_collection("messages")
    ensure_indexes("messages", [
        ({"conversation_id": ASCENDING, "seq": ASCENDING}, {"unique": True, "name": "uniq_conv_seq"}),
        ({"conversation_id": ASCENDING, "date_created": ASCENDING}, {"name": "idx_conv_created"}),
        # TTL  deletes message after 180days?
        # ({"date_created": ASCENDING}, {"expireAfterSeconds": 180*24*3600, "name":"ttl_messages_180d"}),
    ])

    # # MESSAGES with validator + per-conversation seq unique
    # messages_schema = {
    #     "bsonType": "object",
    #     "required": ["conversation_id", "role", "content", "date_created", "seq"],
    #     "properties": {
    #         "conversation_id": {"bsonType": "objectId"},
    #         "role": {"enum": ["user", "assistant", "mentor", "tool", "system"]},
    #         "sender_id": {"bsonType": ["objectId", "null"]},
    #         "content": {"bsonType": "string"},
    #         "seq": {"bsonType": "int"},
    #         "date_created": {"bsonType": "date"},
    #         "model": {"bsonType": ["string", "null"]},
    #         "tool_run_id": {"bsonType": ["objectId", "null"]},
    #     },
    # }

    # set_validator("messages", messages_schema) # validation stuff


    # STUCK_EVENTS
    ensure_collection("stuck_events")
    ensure_indexes("stuck_events", [
        ({"conversation_id": ASCENDING, "date_detected": DESCENDING}, {"name": "idx_conv_detected"}),
        ({"status": ASCENDING, "date_detected": DESCENDING}, {"name": "idx_status_detected"}),
    ])

    # ESCALATIONS (0..1 per stuck_event)
    ensure_collection("escalations")
    ensure_indexes("escalations", [
        ({"stuck_event_id": ASCENDING}, {"unique": True, "name": "uniq_stuck_event"}),
        ({"escalation_status": ASCENDING, "priority": ASCENDING, "sla_due_at": ASCENDING}, {"name": "idx_status_priority_sla"}),
        ({"assigned_to": ASCENDING, "escalation_status": ASCENDING, "sla_due_at": ASCENDING}, {"name": "idx_assignee_status_sla"}),
    ])

    # TOOL_RUNS
    ensure_collection("tool_runs")
    ensure_indexes("tool_runs", [
        ({"conversation_id": ASCENDING, "created_at": DESCENDING}, {"name": "idx_conv_created_desc"}),
        ({"input_hash": ASCENDING}, {"name": "idx_input_hash"}),
    ])

    # FEEDBACK
    ensure_collection("feedback")
    ensure_indexes("feedback", [
        ({"conversation_id": ASCENDING, "created_at": DESCENDING}, {"name": "idx_conv_created_desc"}),
        ({"user_id": ASCENDING, "created_at": DESCENDING}, {"name": "idx_user_created_desc"}),
    ])

    # METRICS_TS (time-series)
    if "metrics_ts" not in db.list_collection_names():
        db.create_collection(
            "metrics_ts",
            timeseries={"timeField": "t", "metaField": "meta", "granularity": "minutes"},
        )
        print("Created time-series collection: metrics_ts")
    ensure_indexes("metrics_ts", [
        ({"meta.user_id": ASCENDING, "t": DESCENDING}, {"name": "idx_user_time"}),
    ])

    # HELP_REQUESTS
    ensure_collection("help_requests")
    ensure_indexes("help_requests", [
        ({"assigned_senior_id": ASCENDING, "status": ASCENDING, "created_at": DESCENDING}, 
         {"name": "idx_senior_status_created"}),
        ({"student_id": ASCENDING, "created_at": DESCENDING}, 
         {"name": "idx_student_created"}),
        ({"status": ASCENDING, "created_at": DESCENDING}, 
         {"name": "idx_status_created"}),
    ])

    print(f"Schema setup complete for DB: {DB_NAME}")

if __name__ == "__main__":
    main()
