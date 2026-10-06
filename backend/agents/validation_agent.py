import pandas as pd


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
        if anomaly.get("type") == "business_rule_violation"
    ]

    if business_rule_violations:
        checks["business_rules"] = {
            "status": "FAIL",
            "count": len(business_rule_violations),
        }

        issues.append(
            f"{len(business_rule_violations)} "
            "business-rule violations remain"
        )

    else:
        checks["business_rules"] = {
            "status": "PASS",
            "count": 0,
        }

    # ---------------------------------------------------------
    # 6. Statistical outliers
    # ---------------------------------------------------------
    statistical_outliers = [
        anomaly
        for anomaly in anomalies
        if anomaly.get("type") == "statistical_outlier"
    ]

    if statistical_outliers:
        checks["statistical_outliers"] = {
            "status": "WARNING",
            "count": len(statistical_outliers),
        }
    else:
        checks["statistical_outliers"] = {
            "status": "PASS",
            "count": 0,
        }

    # ---------------------------------------------------------
    # 7. Quality score
    # ---------------------------------------------------------
    quality_score = 100.0

    # Missing values
    if missing_count > 0:
        quality_score -= min(
            30,
            missing_count * 5
        )

    # Duplicate rows
    if duplicate_count > 0:
        quality_score -= min(
            20,
            duplicate_count * 5
        )

    # Invalid numeric values
    if invalid_numeric_columns:
        quality_score -= 15

    # Business-rule violations
    if business_rule_violations:
        quality_score -= min(
            30,
            len(business_rule_violations) * 10
        )

    # Statistical outliers
    if statistical_outliers:
        quality_score -= min(
            10,
            len(statistical_outliers) * 2
        )

    quality_score = max(
        0.0,
        round(quality_score, 2)
    )

    # ---------------------------------------------------------
    # 8. Overall validity
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