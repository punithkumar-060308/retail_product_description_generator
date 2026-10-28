"""
MongoDB Atlas database client and helper utilities.
Handles MongoDB Atlas connection pooling, schema indexing, and collection operations
with automatic failover if MongoDB Atlas is not yet configured.
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from pymongo import MongoClient, ASCENDING, ReturnDocument
from pymongo.errors import PyMongoError

logger = logging.getLogger("mongo_db")

_mongo_client: Optional[MongoClient] = None
_mongo_db = None


def get_mongo_uri() -> str:
    return os.getenv("MONGODB_URI", "").strip()


def get_mongo_db_name() -> str:
    return os.getenv("MONGODB_DB_NAME", "retail_generator").strip()


def is_mongo_configured() -> bool:
    """Returns True if a valid MongoDB connection string is provided in environment."""
    uri = get_mongo_uri()
    return bool(uri and (uri.startswith("mongodb://") or uri.startswith("mongodb+srv://")))


def get_mongo_client() -> Optional[MongoClient]:
    """Returns singleton MongoDB client with server timeout configured."""
    global _mongo_client
    if not is_mongo_configured():
        return None

    if _mongo_client is None:
        _mongo_client = MongoClient(
            get_mongo_uri(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=10000,
            appname="RetailProductStudio",
        )
    return _mongo_client


def get_mongo_db():
    """Returns the MongoDB database instance."""
    global _mongo_db
    if _mongo_db is not None:
        return _mongo_db

    client = get_mongo_client()
    if client is None:
        return None

    db_name = get_mongo_db_name()
    _mongo_db = client[db_name]
    return _mongo_db


def ping_mongo() -> Dict[str, Any]:
    """Tests the MongoDB connection by issuing a ping command."""
    if not is_mongo_configured():
        return {"connected": False, "reason": "MONGODB_URI not configured in .env"}

    client = get_mongo_client()
    if not client:
        return {"connected": False, "reason": "MongoClient initialization failed"}

    try:
        client.admin.command("ping")
        return {"connected": True, "db_name": get_mongo_db_name()}
    except PyMongoError as exc:
        logger.warning("MongoDB ping failed: %s", type(exc).__name__)
        return {"connected": False, "reason": "MongoDB is unavailable; check the URI, network access, and credentials."}


def init_mongo_indexes():
    """Ensures unique and search indexes exist in MongoDB Atlas collections."""
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not configured.")

    db.users.create_index([("email", ASCENDING)], unique=True)
    db.users.create_index([("id", ASCENDING)], unique=True)
    db.feedbacks.create_index([("saved_at", ASCENDING)])

    highest_user = db.users.find_one(sort=[("id", -1)], projection={"id": 1})
    highest_id = highest_user.get("id", 0) if highest_user else 0
    db.counters.update_one(
        {"_id": "users"},
        {"$max": {"sequence": highest_id}},
        upsert=True,
    )
    logger.info("MongoDB indexes verified successfully.")


# ---------------- MongoDB Helper Functions ----------------

def mongo_find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not configured.")
    normalized = email.strip().lower()
    user = db.users.find_one({"email": normalized})
    if user:
        user.pop("_id", None)
    return user


def mongo_find_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not configured.")
    user = db.users.find_one({"id": int(user_id)})
    if user:
        user.pop("_id", None)
    return user


def mongo_get_next_user_id() -> int:
    """Generates an incremental integer ID for user consistency with relational schemas."""
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not configured.")
    counter = db.counters.find_one_and_update(
        {"_id": "users"},
        {"$inc": {"sequence": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(counter["sequence"])


def mongo_create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not configured.")

    user = dict(user_data)
    if "id" not in user:
        user["id"] = mongo_get_next_user_id()

    if "created_at" not in user:
        user["created_at"] = datetime.utcnow()

    db.users.insert_one(user)
    user.pop("_id", None)
    return user


def mongo_update_user(user_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not configured.")

    db.users.update_one({"id": int(user_id)}, {"$set": updates})
    updated = db.users.find_one({"id": int(user_id)})
    if updated:
        updated.pop("_id", None)
    return updated


def mongo_save_feedback(feedback_data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not configured.")

    record = dict(feedback_data)
    record["saved_at"] = datetime.utcnow()
    db.feedbacks.insert_one(record)
    record.pop("_id", None)
    return record


def mongo_list_feedbacks() -> List[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not configured.")

    cursor = db.feedbacks.find().sort("saved_at", -1).limit(50)
    items = []
    for doc in cursor:
        doc.pop("_id", None)
        items.append(doc)
    return items


def mongo_count_feedbacks() -> int:
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not configured.")
    return db.feedbacks.count_documents({})
