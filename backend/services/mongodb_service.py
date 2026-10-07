from datetime import datetime, timezone
from typing import Any

from database.connection import get_database


def datasets_collection():
    return get_database()["datasets"]


async def create_dataset_record(
    dataset_id: str,
    owner_id: str,
    original_filename: str,
    stored_file: str,
    file_format: str,
    size_bytes: int,
    profile: dict,
    column_types: dict,
) -> dict:
    """
    Store metadata for a newly uploaded dataset.
    """

    document = {
        "dataset_id": dataset_id,
        "owner_id": owner_id,
        "original_filename": original_filename,
        "stored_file": stored_file,
        "format": file_format,
        "size_bytes": size_bytes,
        "uploaded_at": datetime.now(timezone.utc),
        "status": "raw",
        "profile": profile,
        "column_types": column_types,
    }

    await datasets_collection().insert_one(dict(document))

    return document


async def get_dataset_record(
    dataset_id: str,
    owner_id: str,
) -> dict | None:
    return await datasets_collection().find_one(
        {"dataset_id": dataset_id, "owner_id": owner_id},
        {"_id": 0},
    )


async def list_dataset_records(owner_id: str) -> list[dict]:
    cursor = (
        datasets_collection()
        .find({"owner_id": owner_id}, {"_id": 0})
        .sort("uploaded_at", -1)
    )

    return await cursor.to_list(length=None)


async def delete_dataset_record(dataset_id: str, owner_id: str) -> bool:
    result = await datasets_collection().delete_one(
        {"dataset_id": dataset_id, "owner_id": owner_id}
    )

    return result.deleted_count > 0


async def mark_dataset_failed(
    dataset_id: str,
    owner_id: str,
    error: str,
) -> None:
    await datasets_collection().update_one(
        {"dataset_id": dataset_id, "owner_id": owner_id},
        {"$set": {"status": "failed", "error": error}},
    )


async def save_processing_result(
    dataset_id: str,
    owner_id: str,
    result: dict[str, Any],
    cleaned_filename: str,
) -> dict:
    """
    Store the complete dataset-processing result in MongoDB.
    """

    processing = {
        # Dataset analysis
        "profile": result["profile"],

        # Cleaning and validation
        "quality_score": result["quality_score"],
        "original_quality_score": result["original_quality_score"],
        "cleaning_actions": result["cleaning_actions"],
        "anomalies": result["anomalies"],
        "validation": result["validation"],
        "agents": result["agents"],
        "before_after": result["before_after"],

        # Output
        "cleaned_filename": cleaned_filename,
        "visualizations": result["visualizations"],

        # AI-generated analysis
        "insights": result["insights"],

        # Metadata
        "processed_at": datetime.now(timezone.utc),
    }

    await datasets_collection().update_one(
        {"dataset_id": dataset_id, "owner_id": owner_id},
        {
            "$set": {
                "status": "cleaned",
                "error": None,
                "processing": processing,
            }
        },
    )

    return processing


async def list_processed_records(owner_id: str) -> list[dict]:
    cursor = datasets_collection().find(
        {"owner_id": owner_id, "processing": {"$exists": True}},
        {"_id": 0, "processing.agents": 1},
    )

    return await cursor.to_list(length=None)
