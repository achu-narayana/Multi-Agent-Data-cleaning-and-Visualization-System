from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool

from services.analytics_service import (
    aggregate_agent_performance,
    build_analytics,
    insight_items,
)
from services.auth_service import get_current_user
from services.dataset_store import (
    load_latest_dataframe,
    require_dataset,
    require_processing,
)
from services.mongodb_service import list_processed_records


router = APIRouter(tags=["Analytics"])


@router.get("/analytics/{dataset_id}")
async def get_analytics(
    dataset_id: str,
    user: dict = Depends(get_current_user),
):

    record = await require_dataset(dataset_id, user)

    try:
        df, _ = await run_in_threadpool(load_latest_dataframe, record)

        return await run_in_threadpool(build_analytics, df, dataset_id)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analytics failed: {e}",
        )


@router.get("/visualizations/{dataset_id}")
async def get_visualizations(
    dataset_id: str,
    user: dict = Depends(get_current_user),
):

    record = await require_dataset(dataset_id, user)

    return require_processing(record).get("visualizations", [])


@router.get("/insights/{dataset_id}")
async def get_insights(
    dataset_id: str,
    user: dict = Depends(get_current_user),
):

    record = await require_dataset(dataset_id, user)

    return insight_items(require_processing(record))


@router.get("/agents/performance")
async def get_agent_performance(
    user: dict = Depends(get_current_user),
):

    records = await list_processed_records(user["id"])

    return aggregate_agent_performance(
        [
            record["processing"].get("agents", [])
            for record in records
        ]
    )
