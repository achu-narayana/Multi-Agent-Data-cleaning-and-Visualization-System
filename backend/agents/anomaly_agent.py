import re

import numpy as np
import pandas as pd


# ---------------------------------------------------------
# Optional domain-aware rules
# ---------------------------------------------------------
# These are NOT required for every dataset.
# They are used only when the corresponding column exists.
#
# The system remains primarily dataset-independent through
# statistical detection and generic validation.
# ---------------------------------------------------------

DOMAIN_RULES = {
    "age": {
        "min": 0,
        "max": 120,
    },
    "performance_score": {
        "min": 0,
        "max": 10,
    },
    "experience_years": {
        "min": 0,
        "max": 80,
    },
}


# ---------------------------------------------------------
# Helper: detect identifier columns
# ---------------------------------------------------------

def is_identifier_column(
    df: pd.DataFrame,
    column: str,
) -> bool:
    """
    Identify columns that are probably IDs.

    Examples:
    Employee_ID
    Customer_ID
    Transaction_ID
    ID
    """

    name = column.lower().strip()

    if (
        name == "id"
        or name.endswith("_id")
        or name.endswith(" id")
        or "identifier" in name
    ):
        return True

    return False


# ---------------------------------------------------------
# Helper: normalize column name
# ---------------------------------------------------------

def normalize_column_name(column: str) -> str:
    """
    Convert column names into a normalized form.

    Example:
        Performance Score
        performance_score
        Performance_Score

    become approximately:

        performance_score
    """

    name = str(column).strip().lower()

    name = re.sub(
        r"[^a-z0-9]+",
        "_",
        name,
    )

    return name.strip("_")


# ---------------------------------------------------------
# Helper: detect naturally non-negative columns
# ---------------------------------------------------------

def looks_non_negative(column: str) -> bool:
    """
    Detect columns that usually should not contain negative values.

    This is only a heuristic and does not automatically mean that
    every negative value is wrong.
    """

    name = normalize_column_name(column)

    keywords = [
        "age",
        "salary",
        "income",
        "revenue",
        "sales",
        "price",
        "cost",
        "amount",
        "quantity",
        "count",
        "score",
        "rating",
        "experience",
        "years",
        "distance",
        "weight",
        "height",
        "population",
        "profit",
        "balance",
        "total",
    ]

    return any(
        keyword in name
        for keyword in keywords
    )


# ---------------------------------------------------------
# Main anomaly detection
# ---------------------------------------------------------

def detect_anomalies(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, list]:
    """
    Detect anomalies in a tabular dataset.

    Detection methods:

    1. Domain-aware validation for recognized columns.
    2. Generic negative-value detection for naturally
       non-negative measurements.
    3. Invalid numeric values such as infinity.
    4. IQR-based statistical outlier detection.

    The function DOES NOT modify the dataset.

    Returns:
        original dataframe
        list of detected anomalies
    """

    anomalies = []

    if df.empty:
        return df, anomalies

    # =====================================================
    # 1. Domain-aware validation
    # =====================================================

    for column in df.columns:

        normalized_name = normalize_column_name(
            column
        )

        if normalized_name not in DOMAIN_RULES:
            continue

        rules = DOMAIN_RULES[
            normalized_name
        ]

        series = pd.to_numeric(
            df[column],
            errors="coerce",
        )

        invalid_mask = pd.Series(
            False,
            index=df.index,
        )

        if "min" in rules:
            invalid_mask |= (
                series < rules["min"]
            )

        if "max" in rules:
            invalid_mask |= (
                series > rules["max"]
            )

        invalid_count = int(
            invalid_mask.sum()
        )

        if invalid_count == 0:
            continue

        affected_rows = (
            df.loc[
                invalid_mask,
                [column],
            ]
            .to_dict(
                orient="records"
            )
        )

        anomalies.append(
            {
                "column": column,
                "type": "domain_rule_violation",
                "count": invalid_count,
                "rule": rules,
                "affected_rows": affected_rows,
            }
        )

    # =====================================================
    # 2. Detect invalid infinite numerical values
    # =====================================================

    numerical_columns = df.select_dtypes(
        include=["number"]
    ).columns.tolist()

    for column in numerical_columns:

        series = df[column]

        infinite_mask = pd.Series(
            np.isinf(series),
            index=df.index,
        )

        infinite_count = int(
            infinite_mask.sum()
        )

        if infinite_count == 0:
            continue

        affected_rows = (
            df.loc[
                infinite_mask,
                [column],
            ]
            .to_dict(
                orient="records"
            )
        )

        anomalies.append(
            {
                "column": column,
                "type": "invalid_infinite_value",
                "count": infinite_count,
                "affected_rows": affected_rows,
            }
        )

    # =====================================================
    # 3. Generic negative-value detection
    # =====================================================

    for column in numerical_columns:

        # IDs can legitimately be positive/negative in
        # some systems, so skip them.
        if is_identifier_column(
            df,
            column,
        ):
            continue

        if not looks_non_negative(
            column
        ):
            continue

        series = df[column]

        negative_mask = (
            series < 0
        )

        negative_count = int(
            negative_mask.sum()
        )

        if negative_count == 0:
            continue

        affected_rows = (
            df.loc[
                negative_mask,
                [column],
            ]
            .to_dict(
                orient="records"
            )
        )

        anomalies.append(
            {
                "column": column,
                "type": "negative_value_warning",
                "count": negative_count,
                "affected_rows": affected_rows,
                "message": (
                    "Negative values were found in a "
                    "column that normally represents "
                    "a non-negative measurement."
                ),
            }
        )

    # =====================================================
    # 4. IQR statistical outlier detection
    # =====================================================

    for column in numerical_columns:

        # Don't calculate statistical outliers for IDs.
        if is_identifier_column(
            df,
            column,
        ):
            continue

        series = (
            pd.to_numeric(
                df[column],
                errors="coerce",
            )
            .replace(
                [np.inf, -np.inf],
                np.nan,
            )
            .dropna()
        )

        # Need enough observations for a meaningful IQR.
        if len(series) < 4:
            continue

        q1 = series.quantile(
            0.25
        )

        q3 = series.quantile(
            0.75
        )

        iqr = q3 - q1

        # If all values are identical, there is no
        # meaningful statistical spread.
        if iqr == 0:
            continue

        lower_bound = (
            q1 - 1.5 * iqr
        )

        upper_bound = (
            q3 + 1.5 * iqr
        )

        outlier_mask = (
            (df[column] < lower_bound)
            | (
                df[column]
                > upper_bound
            )
        )

        outlier_count = int(
            outlier_mask.sum()
        )

        if outlier_count == 0:
            continue

        affected_rows = (
            df.loc[
                outlier_mask,
                [column],
            ]
            .to_dict(
                orient="records"
            )
        )

        anomalies.append(
            {
                "column": column,
                "type": "statistical_outlier",
                "count": outlier_count,
                "lower_bound": round(
                    float(lower_bound),
                    2,
                ),
                "upper_bound": round(
                    float(upper_bound),
                    2,
                ),
                "affected_rows": affected_rows,
            }
        )

    return df, anomalies