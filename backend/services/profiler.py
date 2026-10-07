from typing import Any

import numpy as np
import pandas as pd

from services.dataframe_utils import (
    load_dataset,
    numeric_columns,
    safe_float,
    text_columns,
    to_json_safe,
)


def profile_dataset(file_path: str) -> dict[str, Any]:
    """
    Analyze an uploaded CSV or Excel dataset and return
    a structured data-quality profile.
    """

    return profile_dataframe(load_dataset(file_path))


def profile_dataframe(df: pd.DataFrame) -> dict[str, Any]:
    """
    Return a structured, JSON-safe data-quality profile
    for a dataframe.
    """

    # -----------------------------
    # Basic dataset information
    # -----------------------------

    rows, columns = df.shape

    column_information = []

    for column in df.columns:
        column_information.append(
            {
                "name": column,
                "data_type": str(df[column].dtype),
                "missing_count": int(df[column].isna().sum()),
                "missing_percentage": round(
                    float(df[column].isna().mean() * 100), 2
                ),
                "unique_values": int(df[column].nunique(dropna=True)),
            }
        )

    # -----------------------------
    # Missing values
    # -----------------------------

    missing_values = {}

    for column in df.columns:
        count = int(df[column].isna().sum())

        if count > 0:
            missing_values[column] = count

    # -----------------------------
    # Duplicate rows
    # -----------------------------

    duplicate_rows = int(df.duplicated().sum())

    # -----------------------------
    # Numerical statistics
    # -----------------------------

    numerical_columns = numeric_columns(df)

    numerical_statistics = {}

    for column in numerical_columns:
        series = finite_values(df[column])

        if len(series) == 0:
            continue

        # The standard deviation of a single value is undefined,
        # so safe_float returns None for it.
        numerical_statistics[column] = {
            "min": safe_float(series.min()),
            "max": safe_float(series.max()),
            "mean": safe_float(series.mean(), 2),
            "median": safe_float(series.median(), 2),
            "standard_deviation": safe_float(series.std(), 2),
        }

    # -----------------------------
    # Potential outliers
    # IQR method
    # -----------------------------

    outliers = {}

    for column in numerical_columns:
        series = finite_values(df[column])

        if len(series) < 4:
            continue

        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        outlier_count = int(
            ((series < lower_bound) | (series > upper_bound)).sum()
        )

        if outlier_count > 0:
            outliers[column] = {
                "count": outlier_count,
                "lower_bound": round(float(lower_bound), 2),
                "upper_bound": round(float(upper_bound), 2),
            }

    # -----------------------------
    # Categorical value overview
    # -----------------------------

    categorical_columns = text_columns(df)

    categorical_information = {}

    for column in categorical_columns:
        values = df[column].dropna().astype(str)

        categorical_information[column] = {
            "unique_count": int(values.nunique()),
            "top_values": values.value_counts().head(10).to_dict(),
        }

    # -----------------------------
    # Data quality score
    # -----------------------------

    total_cells = rows * columns

    if total_cells > 0:
        missing_cells = int(df.isna().sum().sum())
        missing_rate = missing_cells / total_cells
    else:
        missing_rate = 0

    duplicate_rate = (
        duplicate_rows / rows
        if rows > 0
        else 0
    )

    quality_score = 100

    quality_score -= missing_rate * 40
    quality_score -= duplicate_rate * 30

    quality_score = max(0, min(100, quality_score))

    # -----------------------------
    # Final profile
    # -----------------------------

    return to_json_safe({
        "dataset": {
            "rows": rows,
            "columns": columns,
            "column_names": df.columns.tolist(),
        },
        "columns": column_information,
        "missing_values": missing_values,
        "duplicate_rows": duplicate_rows,
        "numerical_statistics": numerical_statistics,
        "outliers": outliers,
        "categorical_information": categorical_information,
        "quality_score": round(quality_score, 2),
    })


def finite_values(series: pd.Series) -> pd.Series:
    return (
        pd.to_numeric(series, errors="coerce")
        .replace([np.inf, -np.inf], np.nan)
        .dropna()
    )