import time
from typing import Any, Callable

from langgraph.graph import END, START, StateGraph

from graph.state import DataCleaningState

from agents.missing_value_agent import handle_missing_values
from agents.duplicate_agent import handle_duplicates
from agents.standardization_agent import standardize_categorical_values
from agents.anomaly_agent import detect_anomalies
from agents.validation_agent import validate_dataset


# --------------------------------------------------
# Timing helper
# --------------------------------------------------

def timed(
    agent_type: str,
    node: Callable[[DataCleaningState], dict[str, Any]],
    records_affected: Callable[[dict[str, Any]], int],
) -> Callable[[DataCleaningState], dict[str, Any]]:
    """
    Wrap a node so that its execution time and the number of
    records it affected are appended to state["agent_runs"].
    """

    def wrapper(state: DataCleaningState) -> dict[str, Any]:
        started = time.perf_counter()

        update = node(state)

        run = {
            "type": agent_type,
            "execution_time": round(time.perf_counter() - started, 4),
            "records_affected": int(records_affected(update)),
        }

        update["agent_runs"] = state.get("agent_runs", []) + [run]

        return update

    return wrapper


def new_actions(state: DataCleaningState, actions: list) -> list:
    return state.get("cleaning_actions", []) + actions


# --------------------------------------------------
# Agent Nodes
# --------------------------------------------------

def missing_node(state: DataCleaningState) -> dict[str, Any]:
    cleaned_df, actions = handle_missing_values(state["dataframe"])

    return {
        "dataframe": cleaned_df,
        "cleaning_actions": new_actions(state, actions),
        "step_actions": actions,
    }


def duplicate_node(state: DataCleaningState) -> dict[str, Any]:
    cleaned_df, actions = handle_duplicates(state["dataframe"])

    return {
        "dataframe": cleaned_df,
        "cleaning_actions": new_actions(state, actions),
        "step_actions": actions,
    }


def standardization_node(state: DataCleaningState) -> dict[str, Any]:
    cleaned_df, actions = standardize_categorical_values(state["dataframe"])

    return {
        "dataframe": cleaned_df,
        "cleaning_actions": new_actions(state, actions),
        "step_actions": actions,
    }


def anomaly_node(state: DataCleaningState) -> dict[str, Any]:
    _, anomalies = detect_anomalies(state["dataframe"])

    return {
        "anomalies": anomalies,
    }


def validation_node(state: DataCleaningState) -> dict[str, Any]:
    result = validate_dataset(
        state["dataframe"],
        anomalies=state.get("anomalies", []),
    )

    return {
        "validation_result": result,
        "quality_score": result["quality_score"],
        "status": "validated",
    }


def count_actions(key: str) -> Callable[[dict[str, Any]], int]:
    def count(update: dict[str, Any]) -> int:
        actions = update.pop("step_actions", [])
        return sum(int(action.get(key) or 0) for action in actions)

    return count


# --------------------------------------------------
# Build LangGraph
# --------------------------------------------------

def build_workflow():

    graph = StateGraph(DataCleaningState)

    # Register nodes
    graph.add_node(
        "missing_agent",
        timed("missing_value", missing_node, count_actions("missing_values")),
    )
    graph.add_node(
        "duplicate_agent",
        timed(
            "duplicate_detection",
            duplicate_node,
            count_actions("duplicates_removed"),
        ),
    )
    graph.add_node(
        "standardization_agent",
        timed(
            "standardization",
            standardization_node,
            count_actions("values_changed"),
        ),
    )
    graph.add_node(
        "anomaly_agent",
        timed(
            "anomaly_detection",
            anomaly_node,
            lambda update: sum(
                int(anomaly.get("count", 0))
                for anomaly in update["anomalies"]
            ),
        ),
    )
    graph.add_node(
        "validation_agent",
        timed(
            "validation",
            validation_node,
            lambda update: len(update["validation_result"]["issues"]),
        ),
    )

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
