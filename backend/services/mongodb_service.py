from datetime import datetime, timezone

from database.connection import database


datasets_collection = database["datasets"]


async def save_processing_result(
    dataset_id: str,
    filename: str,
    profile: dict,
    quality_score: float,
    cleaning_actions: list,
    anomalies: list,
    validation_result: dict,
    cleaned_filename: str,
    visualizations: list,
    insights: dict,
):
    """
    Store the complete dataset-processing result in MongoDB.
    """

    document = {
        "dataset_id": dataset_id,
        "filename": filename,

        # Dataset analysis
        "profile": profile,

        # Cleaning and validation
        "quality_score": quality_score,
        "cleaning_actions": cleaning_actions,
        "anomalies": anomalies,
        "validation": validation_result,

        # Output
        "cleaned_filename": cleaned_filename,
        "visualizations": visualizations,

        # AI-generated analysis
        "insights": insights,

        # Metadata
        "processed_at": datetime.now(timezone.utc),
    }

    await datasets_collection.update_one(
        {"dataset_id": dataset_id},
        {"$set": document},
        upsert=True,
    )

    return document


async def get_processing_result(
    dataset_id: str,
):
    """
    Retrieve the complete processing result
    for a dataset.
    """

    return await datasets_collection.find_one(
        {"dataset_id": dataset_id},
        {"_id": 0},
    )