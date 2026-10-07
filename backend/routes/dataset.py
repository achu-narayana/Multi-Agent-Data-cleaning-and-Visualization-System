import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse

from services.auth_service import get_current_user
from services.dataframe_utils import (
    SUPPORTED_EXTENSIONS,
    dataframe_records,
    load_dataset,
    numeric_columns,
    text_columns,
)
from services.dataset_store import (
    CLEANED_DIR,
    UPLOAD_DIR,
    cleaned_filename_for,
    cleaned_path,
    dataset_view,
    download_filename,
    load_latest_dataframe,
    processing_view,
    require_dataset,
    require_processing,
    upload_path,
)
from services.mongodb_service import (
    create_dataset_record,
    delete_dataset_record,
    list_dataset_records,
    mark_dataset_failed,
    save_processing_result,
)
from services.profiler import profile_dataframe
from services.visualization_service import detect_date_columns
from services.workflow_service import process_dataset_file


router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "50")) * 1024 * 1024
CHUNK_SIZE = 1024 * 1024


def inspect_upload(file_path: str) -> tuple[dict, dict]:
    """
    Load an uploaded file once to build its profile and column types.
    """

    df = load_dataset(file_path)

    profile = profile_dataframe(df)

    date_columns = detect_date_columns(df)

    column_types = {
        "numeric": numeric_columns(df),
        "categorical": [
            column
            for column in text_columns(df)
            if column not in date_columns
        ],
        "date": date_columns,
    }

    return profile, column_types


# ---------------------------------------------------------
# List Datasets
# ---------------------------------------------------------

@router.get("")
async def list_datasets(user: dict = Depends(get_current_user)):

    records = await list_dataset_records(user["id"])

    return [dataset_view(record) for record in records]


# ---------------------------------------------------------
# Upload Dataset
# ---------------------------------------------------------

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):

    filename = os.path.basename(file.filename or "")

    extension = os.path.splitext(filename)[1].lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel (.xlsx, .xls) files are supported.",
        )

    dataset_id = str(uuid.uuid4())

    stored_file = f"{dataset_id}{extension}"

    file_path = UPLOAD_DIR / stored_file

    size_bytes = 0

    # Stream to disk so large uploads don't have to fit in memory.
    with open(file_path, "wb") as buffer:
        while chunk := await file.read(CHUNK_SIZE):
            size_bytes += len(chunk)

            if size_bytes > MAX_UPLOAD_BYTES:
                buffer.close()
                file_path.unlink(missing_ok=True)

                raise HTTPException(
                    status_code=413,
                    detail=(
                        "File is too large. Maximum size is "
                        f"{MAX_UPLOAD_BYTES // (1024 * 1024)} MB."
                    ),
                )

            buffer.write(chunk)

    if size_bytes == 0:
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    try:
        profile, column_types = await run_in_threadpool(
            inspect_upload,
            str(file_path),
        )

    except Exception as e:
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=400,
            detail=f"Could not read the file: {e}",
        )

    record = await create_dataset_record(
        dataset_id=dataset_id,
        owner_id=user["id"],
        original_filename=filename,
        stored_file=stored_file,
        file_format=extension.lstrip("."),
        size_bytes=size_bytes,
        profile=profile,
        column_types=column_types,
    )

    return {
        "message": "Dataset uploaded successfully",
        "dataset_id": dataset_id,
        "filename": filename,
        "stored_file": stored_file,
        "size_bytes": size_bytes,
        "dataset": dataset_view(record),
    }


# ---------------------------------------------------------
# Get / Delete Dataset
# ---------------------------------------------------------

@router.get("/{dataset_id}")
async def get_dataset(
    dataset_id: str,
    user: dict = Depends(get_current_user),
):

    record = await require_dataset(dataset_id, user)

    return dataset_view(record)


@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    user: dict = Depends(get_current_user),
):

    record = await require_dataset(dataset_id, user)

    upload_path(record).unlink(missing_ok=True)

    path = cleaned_path(record)

    if path is not None:
        path.unlink(missing_ok=True)

    await delete_dataset_record(dataset_id, user["id"])

    return {"success": True}


# ---------------------------------------------------------
# Get Dataset Profile
# ---------------------------------------------------------

@router.get("/{dataset_id}/profile")
async def get_dataset_profile(
    dataset_id: str,
    user: dict = Depends(get_current_user),
):

    record = await require_dataset(dataset_id, user)

    return {
        "dataset_id": dataset_id,
        "profile": record.get("profile", {}),
    }


# ---------------------------------------------------------
# Preview Dataset
# ---------------------------------------------------------

@router.get("/{dataset_id}/preview")
async def preview_dataset(
    dataset_id: str,
    limit: int = Query(100, ge=1, le=1000),
    user: dict = Depends(get_current_user),
):

    record = await require_dataset(dataset_id, user)

    try:
        df, source = await run_in_threadpool(load_latest_dataframe, record)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read the dataset: {e}",
        )

    return {
        "columns": [str(column) for column in df.columns],
        "rows": dataframe_records(df, limit=limit),
        "source": source,
    }


# ---------------------------------------------------------
# Process Dataset
# ---------------------------------------------------------

@router.post("/{dataset_id}/process")
async def process_dataset(
    dataset_id: str,
    user: dict = Depends(get_current_user),
):

    record = await require_dataset(dataset_id, user)

    try:

        # Profiling, the multi-agent workflow, visualizations and
        # Gemini insights are CPU/network bound, so run them in a
        # worker thread instead of blocking the event loop.
        result = await run_in_threadpool(
            process_dataset_file,
            str(upload_path(record)),
            dataset_id,
            record["stored_file"],
        )

        cleaned_filename = cleaned_filename_for(dataset_id)

        await run_in_threadpool(
            result["dataframe"].to_csv,
            CLEANED_DIR / cleaned_filename,
            index=False,
        )

    except Exception as e:

        await mark_dataset_failed(dataset_id, user["id"], str(e))

        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {e}",
        )

    await save_processing_result(
        dataset_id=dataset_id,
        owner_id=user["id"],
        result=result,
        cleaned_filename=cleaned_filename,
    )

    record = await require_dataset(dataset_id, user)

    return processing_view(record)


# ---------------------------------------------------------
# Get Saved Processing Result
# ---------------------------------------------------------

@router.get("/{dataset_id}/result")
async def get_dataset_result(
    dataset_id: str,
    user: dict = Depends(get_current_user),
):

    record = await require_dataset(dataset_id, user)

    return processing_view(record)


# ---------------------------------------------------------
# Download Cleaned Dataset
# ---------------------------------------------------------

@router.get("/{dataset_id}/download")
async def download_cleaned_dataset(
    dataset_id: str,
    user: dict = Depends(get_current_user),
):

    record = await require_dataset(dataset_id, user)

    require_processing(record)

    path = cleaned_path(record)

    if path is None or not path.exists():
        raise HTTPException(
            status_code=404,
            detail="Cleaned dataset file not found",
        )

    return FileResponse(
        path=path,
        filename=download_filename(record),
        media_type="text/csv",
    )
