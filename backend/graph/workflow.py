from typing import Any

from langgraph.graph import END, START, StateGraph

from graph.state import DataCleaningState

from agents.missing_value_agent import handle_missing_values
from agents.duplicate_agent import handle_duplicates
from agents.standardization_agent import standardize_categorical_values
from agents.anomaly_agent import detect_anomalies
from agents.validation_agent import validate_dataset


# --------------------------------------------------
# Agent Nodes
# --------------------------------------------------

def missing_node(state: DataCleaningState) -> dict[str, Any]:
    df = state["dataframe"]

    cleaned_df, actions = handle_missing_values(df)

    existing_actions = state.get("cleaning_actions", [])

    return {
        "dataframe": cleaned_df,
        "cleaning_actions": existing_actions + actions,
    }


def duplicate_node(state: DataCleaningState) -> dict[str, Any]:
    df = state["dataframe"]

    cleaned_df, actions = handle_duplicates(df)

    existing_actions = state.get("cleaning_actions", [])

    return {
        "dataframe": cleaned_df,
        "cleaning_actions": existing_actions + actions,
    }


def standardization_node(state: DataCleaningState) -> dict[str, Any]:
    df = state["dataframe"]

    cleaned_df, actions = standardize_categorical_values(df)

    existing_actions = state.get("cleaning_actions", [])

    return {
        "dataframe": cleaned_df,
        "cleaning_actions": existing_actions + actions,
    }


def anomaly_node(state: DataCleaningState) -> dict[str, Any]:
    df = state["dataframe"]

    _, anomalies = detect_anomalies(df)

    return {
        "anomalies": anomalies,
    }


def validation_node(state):
    df = state["dataframe"]

    anomalies = state.get("anomalies", [])

    result = validate_dataset(
        df,
        anomalies=anomalies,
    )

    return {
        "validation_result": result,
        "quality_score": result["quality_score"],
        "status": "validated",
    }


# --------------------------------------------------
# Build LangGraph
# --------------------------------------------------

def build_workflow():

    graph = StateGraph(DataCleaningState)

    # Register nodes
    graph.add_node("missing_agent", missing_node)
    graph.add_node("duplicate_agent", duplicate_node)
    graph.add_node("standardization_agent", standardization_node)
    graph.add_node("anomaly_agent", anomaly_node)
    graph.add_node("validation_agent", validation_node)

    # Workflow order
    graph.add_edge(START, "missing_agent")
    graph.add_edge("missing_agent", "duplicate_agent")
    graph.add_edge("duplicate_agent", "standardization_agent")
    graph.add_edge(
        "standardization_agent",
        "anomaly_agent",
    )
    graph.add_edge("anomaly_agent", "validation_agent")
    graph.add_edge("validation_agent", END)

    return graph.compile()


workflow = build_workflow()