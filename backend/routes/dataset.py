import os
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from agents.insight_agent import generate_insights
from services.visualization_service import generate_visualizations
from services.profiler import profile_dataset
from services.workflow_service import run_cleaning_workflow
from services.mongodb_service import (
    save_processing_result,
    get_processing_result,
)


router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


# ---------------------------------------------------------
# Directories
# ---------------------------------------------------------

UPLOAD_DIR = "uploads"
CLEANED_DIR = "cleaned"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CLEANED_DIR, exist_ok=True)


# ---------------------------------------------------------
# Upload Dataset
# ---------------------------------------------------------

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):

    allowed_extensions = [
        ".csv",
        ".xlsx",
        ".xls",
    ]

    filename = file.filename or ""

    extension = os.path.splitext(filename)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are supported.",
        )

    dataset_id = str(uuid.uuid4())

    safe_filename = f"{dataset_id}{extension}"

    file_path = os.path.join(
        UPLOAD_DIR,
        safe_filename,
    )

    contents = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    return {
        "message": "Dataset uploaded successfully",
        "dataset_id": dataset_id,
        "filename": filename,
        "stored_file": safe_filename,
        "size_bytes": len(contents),
    }


# ---------------------------------------------------------
# Get Dataset Profile
# ---------------------------------------------------------

@router.get("/{dataset_id}/profile")
async def get_dataset_profile(dataset_id: str):

    matching_files = [
        filename
        for filename in os.listdir(UPLOAD_DIR)
        if filename.startswith(dataset_id)
    ]

    if not matching_files:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    file_path = os.path.join(
        UPLOAD_DIR,
        matching_files[0],
    )

    try:

        profile = profile_dataset(file_path)

        return {
            "dataset_id": dataset_id,
            "profile": profile,
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Profiling failed: {str(e)}",
        )


# ---------------------------------------------------------
# Process Dataset
# ---------------------------------------------------------

@router.post("/{dataset_id}/process")
async def process_dataset(dataset_id: str):

    matching_files = [
        filename
        for filename in os.listdir(UPLOAD_DIR)
        if filename.startswith(dataset_id)
    ]

    if not matching_files:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    stored_filename = matching_files[0]

    file_path = os.path.join(
        UPLOAD_DIR,
        stored_filename,
    )

    try:

        # ---------------------------------------------------------
        # 1. Run Multi-Agent Cleaning Workflow
        # ---------------------------------------------------------

        result = run_cleaning_workflow(
            file_path=file_path,
            dataset_id=dataset_id,
            filename=stored_filename,
        )

        cleaned_df = result["dataframe"]

        # ---------------------------------------------------------
        # 2. Get Workflow Results
        # ---------------------------------------------------------

        quality_score = result.get(
            "quality_score",
            0,
        )

        cleaning_actions = result.get(
            "cleaning_actions",
            [],
        )

        anomalies = result.get(
            "anomalies",
            [],
        )

        validation_result = result.get(
            "validation_result",
            {},
        )

        profile = result.get(
            "profile",
            {},
        )

        # ---------------------------------------------------------
        # 3. Generate Visualizations
        # ---------------------------------------------------------

        visualizations = generate_visualizations(
            cleaned_df
        )

        # ---------------------------------------------------------
        # 4. Generate Gemini AI Insights
        # ---------------------------------------------------------

        insight_result = generate_insights(
            profile=profile,
            cleaning_actions=cleaning_actions,
            anomalies=anomalies,
            quality_score=quality_score,
        )

        # ---------------------------------------------------------
        # 5. Save Cleaned Dataset
        # ---------------------------------------------------------

        cleaned_filename = (
            f"cleaned_{stored_filename}"
        )

        cleaned_file_path = os.path.join(
            CLEANED_DIR,
            cleaned_filename,
        )

        cleaned_df.to_csv(
            cleaned_file_path,
            index=False,
        )

        # ---------------------------------------------------------
        # 6. Save Processing Result in MongoDB
        # ---------------------------------------------------------

        await save_processing_result(
    dataset_id=dataset_id,
    filename=stored_filename,
    profile=profile,
    quality_score=quality_score,
    cleaning_actions=cleaning_actions,
    anomalies=anomalies,
    validation_result=validation_result,
    cleaned_filename=cleaned_filename,
    visualizations=visualizations,
    insights=insight_result,
)

        # ---------------------------------------------------------
        # 7. Return Complete Result
        # ---------------------------------------------------------

        return {
            "dataset_id": dataset_id,
            "status": result.get("status"),
            "quality_score": quality_score,

            "profile": profile,

            "cleaning_actions": cleaning_actions,

            "anomalies": anomalies,

            "validation": validation_result,

            "cleaned_filename": cleaned_filename,

            "download_endpoint": (
                f"/datasets/{dataset_id}/download"
            ),

            "visualizations": visualizations,

            "insights": insight_result,

            "cleaned_data": cleaned_df.to_dict(
                orient="records"
            ),
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}",
        )


# ---------------------------------------------------------
# Get Saved Processing Result
# ---------------------------------------------------------

@router.get("/{dataset_id}/result")
async def get_dataset_result(dataset_id: str):

    result = await get_processing_result(
        dataset_id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Processing result not found",
        )

    return result


# ---------------------------------------------------------
# Download Cleaned Dataset
# ---------------------------------------------------------

@router.get("/{dataset_id}/download")
async def download_cleaned_dataset(
    dataset_id: str,
):

    result = await get_processing_result(
        dataset_id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Processing result not found",
        )

    cleaned_filename = result.get(
        "cleaned_filename"
    )

    if not cleaned_filename:
        raise HTTPException(
            status_code=404,
            detail="Cleaned dataset not available",
        )

    cleaned_file_path = os.path.join(
        CLEANED_DIR,
        cleaned_filename,
    )

    if not os.path.exists(cleaned_file_path):
        raise HTTPException(
            status_code=404,
            detail="Cleaned dataset file not found",
        )

    return FileResponse(
        path=cleaned_file_path,
        filename=cleaned_filename,
        media_type="text/csv",
    )