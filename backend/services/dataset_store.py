import os
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from fastapi import HTTPException

from services.dataframe_utils import load_dataset, to_json_safe
from services.mongodb_service import get_dataset_record


# ---------------------------------------------------------
# Directories (relative to the backend folder, not the cwd)
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", BASE_DIR / "uploads"))
CLEANED_DIR = Path(os.getenv("CLEANED_DIR", BASE_DIR / "cleaned"))

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CLEANED_DIR.mkdir(parents=True, exist_ok=True)


def upload_path(record: dict) -> Path:
    return UPLOAD_DIR / record["stored_file"]


def cleaned_path(record: dict) -> Path | None:
    filename = (record.get("processing") or {}).get("cleaned_filename")

    return CLEANED_DIR / filename if filename else None


def cleaned_filename_for(dataset_id: str) -> str:
    # Cleaned data is always written as CSV.
    return f"cleaned_{dataset_id}.csv"


def download_filename(record: dict) -> str:
    stem = os.path.splitext(record["original_filename"])[0] or "dataset"

    return f"cleaned_{stem}.csv"


async def require_dataset(dataset_id: str, user: dict) -> dict:
    record = await get_dataset_record(dataset_id, user["id"])

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    return record


def require_processing(record: dict) -> dict:
    processing = record.get("processing")

    if not processing:
        raise HTTPException(
            status_code=404,
            detail="Dataset has not been processed yet",
        )

    return processing


def load_latest_dataframe(record: dict) -> tuple[pd.DataFrame, str]:
    """
    Load the cleaned data if the dataset was processed,
    otherwise the original upload.
    """

    path = cleaned_path(record)

    if path is not None and path.exists():
        return load_dataset(str(path)), "cleaned"

    return load_dataset(str(upload_path(record))), "original"


def iso_utc(value) -> str | None:
    """
    MongoDB returns naive UTC datetimes; mark them as UTC so
    browsers don't read them as local time.
    """

    if not isinstance(value, datetime):
        return value

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.isoformat()


def human_size(size_bytes: int) -> str:
    size = float(size_bytes)

    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.0f} B" if unit == "B" else f"{size:.1f} {unit}"

        size /= 1024

    return f"{size:.1f} GB"


def dataset_view(record: dict) -> dict:
    """
    Convert a stored record into the frontend Dataset type.
    """

    profile = record.get("profile") or {}
    dataset = profile.get("dataset") or {}
    column_types = record.get("column_types") or {}
    processing = record.get("processing") or {}

    quality_score = processing.get(
        "quality_score",
        profile.get("quality_score", 0),
    )

    return to_json_safe({
        "id": record["dataset_id"],
        "name": record["original_filename"],
        "size": human_size(record.get("size_bytes", 0)),
        "rowCount": dataset.get("rows", 0),
        "columnCount": dataset.get("columns", 0),
        "format": "csv" if record.get("format") == "csv" else "xlsx",
        "uploadedAt": iso_utc(record.get("uploaded_at")),
        "qualityScore": quality_score,
        "status": record.get("status", "raw"),
        "missingValues": sum((profile.get("missing_values") or {}).values()),
        "duplicateRows": profile.get("duplicate_rows", 0),
        "numericalColumns": len(column_types.get("numeric", [])),
        "categoricalColumns": len(column_types.get("categorical", [])),
        "dateColumns": len(column_types.get("date", [])),
        "columns": dataset.get("column_names", []),
    })


def processing_view(record: dict) -> dict:
    """
    Convert a processed record into the ProcessingResult response.
    """

    processing = require_processing(record)
    dataset_id = record["dataset_id"]

    return to_json_safe({
        "dataset_id": dataset_id,
        "filename": record["original_filename"],
        "status": record.get("status"),
        "quality_score": processing.get("quality_score"),
        "original_quality_score": processing.get("original_quality_score"),
        "profile": processing.get("profile"),
        "cleaning_actions": processing.get("cleaning_actions", []),
        "anomalies": processing.get("anomalies", []),
        "validation": processing.get("validation", {}),
        "cleaned_filename": processing.get("cleaned_filename"),
        "download_endpoint": f"/datasets/{dataset_id}/download",
        "visualizations": processing.get("visualizations", []),
        "insights": processing.get("insights", {}),
        "agents": processing.get("agents", []),
        "before_after": processing.get("before_after", []),
        "processed_at": iso_utc(processing.get("processed_at")),
        "dataset": dataset_view(record),
    })
