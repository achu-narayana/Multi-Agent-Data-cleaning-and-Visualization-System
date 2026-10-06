import pandas as pd

from graph.workflow import workflow
from services.profiler import profile_dataset


def run_cleaning_workflow(
    file_path: str,
    dataset_id: str,
    filename: str,
):
    # ---------------------------------------------------------
    # Load dataset
    # ---------------------------------------------------------

    if file_path.lower().endswith(".csv"):
        df = pd.read_csv(file_path)

    elif file_path.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(file_path)

    else:
        raise ValueError(
            "Unsupported file format"
        )

    # ---------------------------------------------------------
    # Generate dataset profile
    # ---------------------------------------------------------

    profile = profile_dataset(
        file_path
    )

    # ---------------------------------------------------------
    # Initial LangGraph state
    # ---------------------------------------------------------

    initial_state = {
        "dataset_id": dataset_id,
        "filename": filename,
        "dataframe": df,
        "profile": profile,
        "cleaning_actions": [],
        "anomalies": [],
        "errors": [],
    }

    # ---------------------------------------------------------
    # Run multi-agent workflow
    # ---------------------------------------------------------

    result = workflow.invoke(
        initial_state
    )

    return result