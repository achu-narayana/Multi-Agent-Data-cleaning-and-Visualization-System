import time
from typing import Any

import pandas as pd

from agents.anomaly_agent import detect_anomalies
from agents.insight_agent import generate_insights
from agents.validation_agent import validate_dataset
from graph.workflow import workflow
from services.dataframe_utils import load_dataset, to_json_safe
from services.profiler import profile_dataframe
from services.visualization_service import generate_visualizations


MAX_BEFORE_AFTER_ROWS = 50


AGENT_DETAILS = {
    "profiling": (
        "Profiling Agent",
        "Profiles columns, data types, missing values and duplicates.",
    ),
    "missing_value": (
        "Missing Value Agent",
        "Fills missing numbers with the median and text with the mode.",
    ),
    "duplicate_detection": (
        "Duplicate Detection Agent",
        "Removes exact duplicate rows.",
    ),
    "standardization": (
        "Standardization Agent",
        "Merges categorical values that differ only by case or spacing.",
    ),
    "anomaly_detection": (
        "Anomaly Detection Agent",
        "Flags business-rule violations, negative values and outliers.",
    ),
    "validation": (
        "Validation Agent",
        "Validates the cleaned data and calculates the quality score.",
    ),
    "visualization": (
        "Visualization Agent",
        "Selects and builds charts suited to the cleaned data.",
    ),
    "insight": (
        "Insight Agent",
        "Uses Gemini to summarize findings and recommendations.",
    ),
}


def run_cleaning_workflow(
    file_path: str,
    dataset_id: str,
    filename: str,
) -> dict[str, Any]:
    """
    Run the LangGraph cleaning workflow on a stored file.
    """

    df = load_dataset(file_path)

    profile = profile_dataframe(df)

    return run_cleaning_workflow_on_dataframe(
        df,
        profile=profile,
        dataset_id=dataset_id,
        filename=filename,
    )


def run_cleaning_workflow_on_dataframe(
    df: pd.DataFrame,
    profile: dict,
    dataset_id: str = "",
    filename: str = "",
) -> dict[str, Any]:
    initial_state = {
        "dataset_id": dataset_id,
        "filename": filename,
        "dataframe": df,
        "profile": profile,
        "cleaning_actions": [],
        "anomalies": [],
        "errors": [],
        "agent_runs": [],
    }

    return workflow.invoke(initial_state)


def process_dataset_file(
    file_path: str,
    dataset_id: str,
    filename: str,
) -> dict[str, Any]:
    """
    Run the complete pipeline: profiling, cleaning workflow,
    visualizations and Gemini insights.

    Returns a JSON-safe result plus the cleaned dataframe
    (under "dataframe").
    """

    original_df = load_dataset(file_path)

    started = time.perf_counter()
    profile = profile_dataframe(original_df)
    profiling_time = time.perf_counter() - started

    result = run_cleaning_workflow_on_dataframe(
        original_df,
        profile=profile,
        dataset_id=dataset_id,
        filename=filename,
    )

    cleaned_df = result["dataframe"]
    cleaning_actions = to_json_safe(result.get("cleaning_actions", []))
    anomalies = to_json_safe(result.get("anomalies", []))
    validation = to_json_safe(result.get("validation_result", {}))
    quality_score = result.get("quality_score", 0)

    started = time.perf_counter()
    visualizations = to_json_safe(generate_visualizations(cleaned_df))
    visualization_time = time.perf_counter() - started

    started = time.perf_counter()
    insights = to_json_safe(
        generate_insights(
            profile=profile,
            cleaning_actions=cleaning_actions,
            anomalies=anomalies,
            quality_score=quality_score,
        )
    )
    insight_time = time.perf_counter() - started

    runs = (
        [{
            "type": "profiling",
            "execution_time": profiling_time,
            "records_affected": 0,
        }]
        + result.get("agent_runs", [])
        + [
            {
                "type": "visualization",
                "execution_time": visualization_time,
                "records_affected": len(visualizations),
            },
            {
                "type": "insight",
                "execution_time": insight_time,
                "records_affected": len(
                    (insights.get("insights") or {}).get("key_findings", [])
                ),
            },
        ]
    )

    agents = build_agent_info(
        runs,
        profile=profile,
        cleaning_actions=cleaning_actions,
        anomalies=anomalies,
        validation=validation,
        insights=insights,
    )

    return {
        "status": result.get("status", "validated"),
        "quality_score": quality_score,
        # Score the raw data with the same rules as the cleaned data
        # so the before/after numbers are comparable.
        "original_quality_score": validate_dataset(
            original_df,
            anomalies=detect_anomalies(original_df)[1],
        )["quality_score"],
        "profile": profile,
        "cleaning_actions": cleaning_actions,
        "anomalies": anomalies,
        "validation": validation,
        "visualizations": visualizations,
        "insights": insights,
        "agents": agents,
        "before_after": build_before_after(original_df, cleaned_df),
        "dataframe": cleaned_df.reset_index(drop=True),
    }


# ---------------------------------------------------------
# Agent summaries
# ---------------------------------------------------------

def actions_with(actions: list, key: str) -> list:
    return [action for action in actions if key in action]


def describe_agent(
    agent_type: str,
    profile: dict,
    cleaning_actions: list,
    anomalies: list,
    validation: dict,
    insights: dict,
) -> dict[str, Any]:
    """
    Human-readable problem / action / reason for each agent.
    """

    if agent_type == "profiling":
        dataset = profile.get("dataset", {})
        return {
            "problem": "Raw dataset structure and quality are unknown.",
            "action": (
                f"Profiled {dataset.get('rows', 0)} rows and "
                f"{dataset.get('columns', 0)} columns."
            ),
            "reason": "Later agents use the profile to decide what to fix.",
            "metrics": {
                "rows": dataset.get("rows", 0),
                "columns": dataset.get("columns", 0),
                "missing_cells": sum(profile.get("missing_values", {}).values()),
                "duplicate_rows": profile.get("duplicate_rows", 0),
            },
        }

    if agent_type == "missing_value":
        actions = actions_with(cleaning_actions, "missing_values")
        filled = [a for a in actions if a.get("method") != "skipped_all_missing"]
        return {
            "problem": (
                f"{sum(a['missing_values'] for a in actions)} missing values "
                f"in {len(actions)} columns."
            ),
            "action": (
                "Filled " + ", ".join(
                    f"{a['column']} ({a['method']})" for a in filled
                )
                if filled else "No values needed filling."
            ),
            "reason": "The median is robust to outliers; the mode keeps categories valid.",
            "metrics": {
                "columns_filled": len(filled),
                "columns_skipped": len(actions) - len(filled),
            },
        }

    if agent_type == "duplicate_detection":
        removed = sum(
            a["duplicates_removed"]
            for a in actions_with(cleaning_actions, "duplicates_removed")
        )
        return {
            "problem": f"{removed} exact duplicate rows.",
            "action": f"Removed {removed} rows, keeping the first occurrence.",
            "reason": "Duplicates inflate counts and bias statistics.",
            "metrics": {"rows_removed": removed},
        }

    if agent_type == "standardization":
        actions = actions_with(cleaning_actions, "values_changed")
        return {
            "problem": (
                f"Inconsistent spellings in {len(actions)} text columns."
            ),
            "action": (
                "Standardized " + ", ".join(a["column"] for a in actions)
                if actions else "No inconsistent values found."
            ),
            "reason": "Variants such as 'it' and 'IT' should be one category.",
            "metrics": {
                "values_changed": sum(a["values_changed"] for a in actions),
            },
        }

    if agent_type == "anomaly_detection":
        by_type: dict[str, int] = {}
        for anomaly in anomalies:
            by_type[anomaly["type"]] = (
                by_type.get(anomaly["type"], 0) + int(anomaly.get("count", 0))
            )
        return {
            "problem": f"{sum(by_type.values())} potentially anomalous values.",
            "action": "Flagged anomalies for review without modifying data.",
            "reason": "Outliers are not always errors, so they are reported, not removed.",
            "metrics": by_type,
        }

    if agent_type == "validation":
        return {
            "problem": "Cleaned data must be verified before use.",
            "action": (
                "All critical checks passed."
                if validation.get("valid")
                else "; ".join(validation.get("issues", []))
            ),
            "reason": "Validation produces the final quality score.",
            "metrics": {
                "quality_score": validation.get("quality_score", 0),
                "valid": "yes" if validation.get("valid") else "no",
            },
        }

    if agent_type == "visualization":
        return {
            "problem": "Choosing useful charts for an unknown dataset.",
            "action": "Generated histograms, bar charts and trends.",
            "reason": "ID and high-cardinality columns are skipped.",
        }

    return {
        "problem": "Findings need to be explained in plain language.",
        "action": (
            f"Generated insights with {insights.get('model')}."
            if insights.get("status") == "success"
            else f"Insights unavailable: {insights.get('message')}"
        ),
        "reason": "Gemini only uses the profile, actions and anomalies provided.",
    }


def build_agent_info(
    runs: list[dict],
    **context: Any,
) -> list[dict[str, Any]]:
    agents = []

    for run in runs:
        agent_type = run["type"]
        name, description = AGENT_DETAILS[agent_type]

        insight_failed = (
            agent_type == "insight"
            and context["insights"].get("status") != "success"
        )

        agents.append({
            "id": agent_type,
            "name": name,
            "type": agent_type,
            "description": description,
            "status": "failed" if insight_failed else "completed",
            "executionTime": round(run["execution_time"], 3),
            "recordsAffected": run["records_affected"],
            **describe_agent(agent_type, **context),
        })

    return to_json_safe(agents)


# ---------------------------------------------------------
# Before / after comparison
# ---------------------------------------------------------

def build_before_after(
    original_df: pd.DataFrame,
    cleaned_df: pd.DataFrame,
) -> list[dict[str, Any]]:
    """
    Compare original rows with cleaned rows by their original index.

    The duplicate agent keeps the original index, so a missing index
    means the row was removed and differing values mean it was changed.
    """

    rows = []

    # Find changed rows in one vectorized step instead of row by row.
    common_index = original_df.index.intersection(cleaned_df.index)
    original_common = original_df.loc[common_index].astype(object)
    cleaned_common = (
        cleaned_df.loc[common_index, original_df.columns].astype(object)
    )
    same = (original_common == cleaned_common) | (
        original_common.isna() & cleaned_common.isna()
    )
    changed_index = set(common_index[~same.all(axis=1)])
    removed_index = set(original_df.index.difference(cleaned_df.index))

    candidates = [
        index
        for index in original_df.index
        if index in changed_index or index in removed_index
    ][:MAX_BEFORE_AFTER_ROWS]

    for index in candidates:

        before = to_json_safe(original_df.loc[index].to_dict())

        if index not in cleaned_df.index:
            rows.append({
                "rowId": str(index),
                "changeType": "removed_duplicate",
                "before": before,
                "after": None,
                "changeDescription": "Exact duplicate row removed.",
            })
            continue

        after = to_json_safe(cleaned_df.loc[index].to_dict())

        changed = [
            column
            for column in before
            if before.get(column) != after.get(column)
        ]

        if not changed:
            continue

        filled = [column for column in changed if before.get(column) is None]

        rows.append({
            "rowId": str(index),
            "changeType": "modified" if filled else "standardized",
            "before": before,
            "after": after,
            "changeDescription": (
                ("Filled missing " + ", ".join(filled) + ". " if filled else "")
                + (
                    "Standardized "
                    + ", ".join(c for c in changed if c not in filled)
                    + "."
                    if len(filled) < len(changed) else ""
                )
            ).strip(),
        })

    return rows
