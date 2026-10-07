import json

import numpy as np
import pandas as pd

from agents.anomaly_agent import detect_anomalies
from agents.duplicate_agent import handle_duplicates
from agents.missing_value_agent import handle_missing_values
from agents.standardization_agent import standardize_categorical_values
from agents.validation_agent import validate_dataset
from services.profiler import profile_dataframe
from services.visualization_service import generate_visualizations
from services.workflow_service import run_cleaning_workflow_on_dataframe


def test_missing_values_median_and_mode():
    df = pd.DataFrame({"Age": [20, None, 30], "Dept": ["IT", None, "IT"]})

    cleaned, actions = handle_missing_values(df)

    assert cleaned["Age"].tolist() == [20, 25, 30]
    assert cleaned["Dept"].tolist() == ["IT", "IT", "IT"]
    assert {a["method"] for a in actions} == {"median", "mode"}
    # The input dataframe is not modified.
    assert df["Age"].isna().sum() == 1


def test_all_missing_column_is_skipped_and_json_safe():
    df = pd.DataFrame({"Bonus": [np.nan, np.nan], "x": [1, 2]})

    _, actions = handle_missing_values(df)

    assert actions == [{
        "column": "Bonus",
        "missing_values": 2,
        "method": "skipped_all_missing",
        "replacement_value": None,
    }]
    json.dumps(actions, allow_nan=False)


def test_duplicates_keep_original_index():
    df = pd.DataFrame({"a": [1, 1, 2]})

    cleaned, actions = handle_duplicates(df)

    assert cleaned.index.tolist() == [0, 2]
    assert actions[0]["duplicates_removed"] == 1
    assert actions[0]["row_indices"] == [1]


def test_standardization_merges_variants_only():
    df = pd.DataFrame({
        "Department": ["IT", "it", "Finance", " sales ", "Sales", "HR"],
        "Name": ["McDonald", "van Dijk", "Li", "Ravi", "Al", "Bo"],
        "Email": ["a.b@x.com", "c@y.org", "d@z.io", "e@x.com", "f@x.com", "g@x.com"],
    })

    cleaned, actions = standardize_categorical_values(df)

    assert cleaned["Department"].tolist() == [
        "IT", "IT", "Finance", "Sales", "Sales", "HR",
    ]
    # Unique values keep their original casing.
    assert cleaned["Name"].tolist() == df["Name"].tolist()
    assert cleaned["Email"].tolist() == df["Email"].tolist()
    assert [a["column"] for a in actions] == ["Department"]
    assert actions[0]["values_changed"] == 2


def test_business_rule_violation_fails_validation():
    df = pd.DataFrame({"Age": [25, 200, 30, 31, 29]})

    _, anomalies = detect_anomalies(df)
    result = validate_dataset(df, anomalies=anomalies)

    assert "business_rule_violation" in {a["type"] for a in anomalies}
    assert result["checks"]["business_rules"]["status"] == "FAIL"
    assert result["valid"] is False
    assert result["quality_score"] < 100


def test_negative_values_are_warnings():
    df = pd.DataFrame({"Salary": [100, -5, 120, 110]})

    _, anomalies = detect_anomalies(df)
    result = validate_dataset(df, anomalies=anomalies)

    assert result["checks"]["negative_values"]["status"] == "WARNING"
    assert result["valid"] is True


def test_infinite_values_not_double_counted_as_outliers():
    df = pd.DataFrame({"value": [1.0, 2.0, 3.0, 4.0, np.inf]})

    _, anomalies = detect_anomalies(df)

    types = [a["type"] for a in anomalies]
    assert types.count("invalid_infinite_value") == 1
    assert "statistical_outlier" not in types


def test_quality_score_is_relative_to_size():
    small = pd.DataFrame({"a": [1, None] + [1] * 8})
    large = pd.DataFrame({"a": [1, None] + list(range(998))})

    small_score = validate_dataset(small)["quality_score"]
    large_score = validate_dataset(large)["quality_score"]

    assert large_score > small_score


def test_numeric_column_names():
    df = pd.DataFrame({0: [1, 2, 3, 4], 1: ["a", "b", "a", "b"]})

    detect_anomalies(df)


def test_profile_is_json_safe_for_single_row_and_infinity():
    profile = profile_dataframe(pd.DataFrame({"x": [1.0], "y": [np.inf]}))

    assert profile["numerical_statistics"]["x"]["standard_deviation"] is None
    json.dumps(profile, allow_nan=False)


def test_profile_includes_string_dtype_columns():
    df = pd.DataFrame({"name": pd.Series(["a", "b"], dtype="string")})

    assert "name" in profile_dataframe(df)["categorical_information"]


def test_visualizations_match_frontend_shape():
    df = pd.DataFrame({
        "Department": ["IT", "HR", "IT", "Finance", "HR", "IT"],
        "Salary": [50000, 60000, 55000, np.inf, 52000, 58000],
        "Join_Date": [f"2024-0{month}-01" for month in range(1, 7)],
    })

    charts = generate_visualizations(df)

    assert {c["chartType"] for c in charts} == {"histogram", "bar", "line"}
    for chart in charts:
        assert {"id", "title", "chartType", "data", "xKey", "yKey"} <= chart.keys()
        assert all(chart["xKey"] in row for row in chart["data"])
    json.dumps(charts, allow_nan=False)


def test_workflow_records_agent_runs():
    df = pd.DataFrame({
        "Employee_ID": [1, 2, 3, 3],
        "Department": ["IT", "it", "HR", "HR"],
        "Age": [25, None, 30, 30],
    })

    result = run_cleaning_workflow_on_dataframe(df, profile={})

    assert [run["type"] for run in result["agent_runs"]] == [
        "missing_value",
        "duplicate_detection",
        "standardization",
        "anomaly_detection",
        "validation",
    ]
    assert result["agent_runs"][0]["records_affected"] == 1
    assert len(result["dataframe"]) == 3
