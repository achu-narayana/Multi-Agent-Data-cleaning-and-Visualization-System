import pandas as pd


# "domain_rule_violation" is the name used by older stored results.
BUSINESS_RULE_TYPES = {
    "business_rule_violation",
    "domain_rule_violation",
}


def validate_dataset(
    df: pd.DataFrame,
    anomalies: list[dict] | None = None,
) -> dict:
    """
    Validate the cleaned dataset and calculate a final quality score.

    Business-rule violations are treated as critical issues.
    Statistical outliers are treated as warnings because an outlier
    is not necessarily an error.
    """

    anomalies = anomalies or []

    checks = {}
    issues = []

    # ---------------------------------------------------------
    # 1. Missing values
    # ---------------------------------------------------------
    missing_count = int(df.isnull().sum().sum())

    if missing_count == 0:
        checks["missing_values"] = {
            "status": "PASS",
            "count": 0,
        }
    else:
        checks["missing_values"] = {
            "status": "FAIL",
            "count": missing_count,
        }
        issues.append(
            f"{missing_count} missing values remain"
        )

    # ---------------------------------------------------------
    # 2. Duplicate rows
    # ---------------------------------------------------------
    duplicate_count = int(df.duplicated().sum())

    if duplicate_count == 0:
        checks["duplicates"] = {
            "status": "PASS",
            "count": 0,
        }
    else:
        checks["duplicates"] = {
            "status": "FAIL",
            "count": duplicate_count,
        }
        issues.append(
            f"{duplicate_count} duplicate rows remain"
        )

    # ---------------------------------------------------------
    # 3. Invalid numeric values
    # ---------------------------------------------------------
    numeric_columns = df.select_dtypes(
        include="number"
    ).columns

    invalid_numeric_columns = []

    for column in numeric_columns:
        if df[column].isin([float("inf"), float("-inf")]).any():
            invalid_numeric_columns.append(column)

    if not invalid_numeric_columns:
        checks["numeric_values"] = {
            "status": "PASS",
            "invalid_columns": [],
        }
    else:
        checks["numeric_values"] = {
            "status": "FAIL",
            "invalid_columns": invalid_numeric_columns,
        }

        issues.append(
            "Invalid infinite values found in: "
            + ", ".join(invalid_numeric_columns)
        )

    # ---------------------------------------------------------
    # 4. Dataset structure
    # ---------------------------------------------------------
    rows = len(df)
    columns = len(df.columns)

    if rows > 0 and columns > 0:
        checks["dataset_structure"] = {
            "status": "PASS",
            "rows": rows,
            "columns": columns,
        }
    else:
        checks["dataset_structure"] = {
            "status": "FAIL",
            "rows": rows,
            "columns": columns,
        }

        issues.append("Dataset is empty")

    # ---------------------------------------------------------
    # 5. Business-rule anomalies
    # ---------------------------------------------------------
    business_rule_violations = [
        anomaly
        for anomaly in anomalies
        if anomaly.get("type") in BUSINESS_RULE_TYPES
    ]

    business_rule_count = sum(
        int(anomaly.get("count", 0))
        for anomaly in business_rule_violations
    )

    if business_rule_violations:
        checks["business_rules"] = {
            "status": "FAIL",
            "count": business_rule_count,
            "columns": [
                anomaly.get("column")
                for anomaly in business_rule_violations
            ],
        }

        issues.append(
            f"{business_rule_count} "
            "business-rule violations remain"
        )

    else:
        checks["business_rules"] = {
            "status": "PASS",
            "count": 0,
        }

    # ---------------------------------------------------------
    # 6. Negative values in naturally non-negative columns
    # ---------------------------------------------------------
    negative_warnings = [
        anomaly
        for anomaly in anomalies
        if anomaly.get("type") == "negative_value_warning"
    ]

    negative_count = sum(
        int(anomaly.get("count", 0))
        for anomaly in negative_warnings
    )

    if negative_warnings:
        checks["negative_values"] = {
            "status": "WARNING",
            "count": negative_count,
            "columns": [
                anomaly.get("column")
                for anomaly in negative_warnings
            ],
        }
    else:
        checks["negative_values"] = {
            "status": "PASS",
            "count": 0,
        }

    # ---------------------------------------------------------
    # 7. Statistical outliers
    # ---------------------------------------------------------
    statistical_outliers = [
        anomaly
        for anomaly in anomalies
        if anomaly.get("type") == "statistical_outlier"
    ]

    outlier_count = sum(
        int(anomaly.get("count", 0))
        for anomaly in statistical_outliers
    )

    if statistical_outliers:
        checks["statistical_outliers"] = {
            "status": "WARNING",
            "count": outlier_count,
        }
    else:
        checks["statistical_outliers"] = {
            "status": "PASS",
            "count": 0,
        }

    # ---------------------------------------------------------
    # 8. Quality score
    # ---------------------------------------------------------
    # Deductions are based on the share of affected cells/rows,
    # so the score is comparable between small and large datasets.
    total_cells = max(rows * columns, 1)
    total_rows = max(rows, 1)

    quality_score = 100.0

    # Missing values
    if missing_count > 0:
        quality_score -= min(
            30,
            5 + 100 * missing_count / total_cells,
        )

    # Duplicate rows
    if duplicate_count > 0:
        quality_score -= min(
            20,
            5 + 100 * duplicate_count / total_rows,
        )

    # Invalid numeric values
    if invalid_numeric_columns:
        quality_score -= 15

    # Business-rule violations
    if business_rule_violations:
        quality_score -= min(
            30,
            10 + 100 * business_rule_count / total_rows,
        )

    # Negative values (warning)
    if negative_warnings:
        quality_score -= min(
            10,
            2 + 100 * negative_count / total_rows,
        )

    # Statistical outliers (warning)
    if statistical_outliers:
        quality_score -= min(
            10,
            100 * outlier_count / total_cells,
        )

    quality_score = max(
        0.0,
        round(quality_score, 2)
    )

    # ---------------------------------------------------------
    # 9. Overall validity
    # ---------------------------------------------------------
    critical_failures = [
        checks["missing_values"]["status"] == "FAIL",
        checks["duplicates"]["status"] == "FAIL",
        checks["numeric_values"]["status"] == "FAIL",
        checks["dataset_structure"]["status"] == "FAIL",
        checks["business_rules"]["status"] == "FAIL",
    ]

    valid = not any(critical_failures)

    return {
        "valid": valid,
        "quality_score": quality_score,
        "checks": checks,
        "issues": issues,
    }