import pandas as pd

from services.dataframe_utils import safe_float, to_json_safe
from services.visualization_service import (
    correlation_matrix,
    finite_numeric,
    histogram_bins,
    select_columns,
)


INSIGHT_CATEGORIES = {
    "Correlation",
    "Distribution",
    "Data Quality",
    "Anomaly",
    "Trend",
}

IMPACTS = {"high", "medium", "low"}


# ---------------------------------------------------------
# Analytics summary
# ---------------------------------------------------------

def build_analytics(df: pd.DataFrame, dataset_id: str) -> dict:
    """
    Build the frontend AnalyticsSummary for a dataframe.
    """

    columns = select_columns(df)

    descriptive_stats = []
    numerical_distributions = {}

    for column in columns["numeric"]:
        values = finite_numeric(df[column])
        valid = values.dropna()

        descriptive_stats.append({
            "column": column,
            "mean": safe_float(valid.mean(), 2),
            "median": safe_float(valid.median(), 2),
            "min": safe_float(valid.min(), 2),
            "max": safe_float(valid.max(), 2),
            "stdDev": safe_float(valid.std(), 2),
            "count": int(valid.count()),
            "nullCount": int(values.isna().sum()),
        })

        if not valid.empty:
            numerical_distributions[column] = histogram_bins(valid)

    category_distributions = {}

    for column in columns["categorical"]:
        counts = (
            df[column]
            .astype(object)
            .fillna("Missing")
            .astype(str)
            .value_counts()
            .head(10)
        )

        total = max(len(df), 1)

        category_distributions[column] = [
            {
                "name": str(name),
                "count": int(count),
                "percentage": round(100 * int(count) / total, 1),
            }
            for name, count in counts.items()
        ]

    correlation = correlation_matrix(df)

    total_cells = df.shape[0] * df.shape[1]
    missing_cells = int(df.isna().sum().sum())

    key_stats = [
        {"label": "Rows", "value": int(df.shape[0])},
        {"label": "Columns", "value": int(df.shape[1])},
        {
            "label": "Completeness",
            "value": (
                f"{100 * (1 - missing_cells / total_cells):.1f}%"
                if total_cells else "n/a"
            ),
            "hint": f"{missing_cells} missing cells",
        },
        {
            "label": "Numerical Columns",
            "value": len(columns["numeric"]),
        },
        {
            "label": "Categorical Columns",
            "value": len(columns["categorical"]),
        },
    ]

    strongest = strongest_correlation(correlation)

    if strongest:
        key_stats.append({
            "label": "Strongest Correlation",
            "value": strongest["value"],
            "hint": f"{strongest['a']} vs {strongest['b']}",
            "isPositive": strongest["value"] >= 0,
        })

    return to_json_safe({
        "datasetId": dataset_id,
        "descriptiveStats": descriptive_stats,
        "categoryDistributions": category_distributions,
        "numericalDistributions": numerical_distributions,
        "correlationMatrix": correlation,
        "keyStats": key_stats,
    })


def strongest_correlation(correlation: dict) -> dict | None:
    columns = correlation["columns"]
    matrix = correlation["matrix"]

    best = None

    for i in range(len(matrix)):
        for j in range(i + 1, len(matrix)):
            value = matrix[i][j]

            if best is None or abs(value) > abs(best["value"]):
                best = {"a": columns[i], "b": columns[j], "value": value}

    return best


# ---------------------------------------------------------
# Insights
# ---------------------------------------------------------

def guess_category(text: str) -> str:
    text = text.lower()

    if "correlat" in text:
        return "Correlation"

    if any(word in text for word in ("outlier", "anomal", "violation")):
        return "Anomaly"

    if any(word in text for word in ("trend", "over time", "increase", "decrease")):
        return "Trend"

    if any(word in text for word in ("missing", "duplicate", "quality", "inconsistent")):
        return "Data Quality"

    return "Distribution"


def short_title(text: str, words: int = 8) -> str:
    parts = text.split()

    title = " ".join(parts[:words])

    return title + ("..." if len(parts) > words else "")


def insight_items(processing: dict) -> list[dict]:
    """
    Convert stored Gemini insights into frontend InsightItem objects.
    """

    insights = processing.get("insights") or {}

    if insights.get("status") != "success":
        return []

    content = insights.get("insights") or {}
    key_findings = content.get("key_findings") or []
    recommendations = content.get("recommendations") or []
    findings = content.get("findings") or []

    items = []

    for index, finding_text in enumerate(key_findings):
        structured = (
            findings[index]
            if index < len(findings) and isinstance(findings[index], dict)
            else {}
        )

        description = structured.get("description") or str(finding_text)

        category = structured.get("category")
        if category not in INSIGHT_CATEGORIES:
            category = guess_category(description)

        impact = str(structured.get("impact", "")).lower()
        if impact not in IMPACTS:
            impact = "medium"

        confidence = safe_float(structured.get("confidence"))

        items.append({
            "id": f"insight_{index + 1}",
            "title": structured.get("title") or short_title(description),
            "description": description,
            "confidence": (
                int(min(max(confidence, 0), 100))
                if confidence is not None
                else 50
            ),
            "category": category,
            "impact": impact,
            "recommendation": (
                structured.get("recommendation")
                or (
                    recommendations[index]
                    if index < len(recommendations)
                    else None
                )
            ),
        })

    return to_json_safe(items)


# ---------------------------------------------------------
# Agent performance
# ---------------------------------------------------------

def aggregate_agent_performance(runs: list[list[dict]]) -> list[dict]:
    """
    Average execution time and total records affected per agent
    across all processed datasets.
    """

    aggregated: dict[str, dict] = {}
    order: list[str] = []

    for agents in runs:
        for agent in agents:
            agent_type = agent["type"]

            if agent_type not in aggregated:
                order.append(agent_type)
                # Per-dataset problem/action text doesn't apply
                # to the aggregate, so only keep the identity fields.
                aggregated[agent_type] = {
                    "id": agent["id"],
                    "name": agent["name"],
                    "type": agent_type,
                    "description": agent["description"],
                    "executionTime": 0.0,
                    "recordsAffected": 0,
                    "runs": 0,
                    "failures": 0,
                }

            summary = aggregated[agent_type]
            summary["executionTime"] += agent.get("executionTime", 0)
            summary["recordsAffected"] += agent.get("recordsAffected", 0)
            summary["runs"] += 1

            if agent.get("status") == "failed":
                summary["failures"] += 1

    result = []

    for agent_type in order:
        summary = aggregated.pop(agent_type)
        runs_count = summary.pop("runs")
        failures = summary.pop("failures")

        result.append({
            **summary,
            "status": "completed" if failures < runs_count else "failed",
            "executionTime": round(summary["executionTime"] / runs_count, 3),
            "metrics": {
                "datasets_processed": runs_count,
                "failures": failures,
            },
        })

    return result
