from typing import Any, TypedDict

import pandas as pd


class DataCleaningState(TypedDict, total=False):
    # Dataset information
    dataset_id: str
    filename: str

    # Current dataframe being processed
    dataframe: pd.DataFrame

    # Original profile generated before cleaning
    profile: dict[str, Any]

    # Actions performed by each agent
    cleaning_actions: list[dict[str, Any]]

    # Anomalies detected
    anomalies: list[dict[str, Any]]

    # Final validation result
    validation_result: dict[str, Any]

    # Final quality score
    quality_score: float

    # General workflow status
    status: str

    # Errors encountered during processing
    errors: list[str]