import numpy as np
import pandas as pd

from services.dataframe_utils import (
    numeric_columns as get_numeric_columns,
    safe_float,
    text_columns,
)


HISTOGRAM_BINS = 10


def is_identifier_column(df: pd.DataFrame, column: str) -> bool:
    """
    Detect columns that are probably identifiers rather than
    meaningful analytical variables.
    """

    name = str(column).lower().strip()

    # Strong ID naming patterns
    if (
        name == "id"
        or name.endswith("_id")
        or name.endswith(" id")
        or "identifier" in name
    ):
        return True

    return False


def parse_dates(series: pd.Series) -> pd.Series:
    try:
        return pd.to_datetime(
            series,
            errors="coerce",
            format="mixed",
        )
    except (TypeError, ValueError):
        return pd.to_datetime(
            series,
            errors="coerce",
        )


def detect_date_columns(df: pd.DataFrame) -> list[str]:
    """
    Detect columns that are likely to contain dates or timestamps.
    """

    date_columns = []

    date_keywords = [
        "date",
        "time",
        "timestamp",
        "joined",
        "joining",
        "created",
        "updated",
    ]

    for column in df.columns:

        # Already a datetime column
        if pd.api.types.is_datetime64_any_dtype(df[column]):
            date_columns.append(column)
            continue

        # Don't try to parse numeric columns as dates
        if pd.api.types.is_numeric_dtype(df[column]):
            continue

        column_name = str(column).lower()

        # Only attempt parsing when the column name suggests a date
        if not any(
            keyword in column_name
            for keyword in date_keywords
        ):
            continue

        parsed = parse_dates(df[column])

        # At least 70% of the values should be valid dates
        if parsed.notna().mean() >= 0.7:
            date_columns.append(column)

    return date_columns


def finite_numeric(series: pd.Series) -> pd.Series:
    return (
        pd.to_numeric(series, errors="coerce")
        .replace([np.inf, -np.inf], np.nan)
    )


def format_bin_edge(value: float) -> str:
    if float(value).is_integer():
        return str(int(value))

    return f"{value:.2f}"


def histogram_bins(values: pd.Series) -> list[dict]:
    counts, edges = np.histogram(
        values,
        bins=min(HISTOGRAM_BINS, max(values.nunique(), 1)),
    )

    return [
        {
            "bin": f"{format_bin_edge(edges[i])}-{format_bin_edge(edges[i + 1])}",
            "count": int(counts[i]),
        }
        for i in range(len(counts))
    ]


def select_columns(df: pd.DataFrame) -> dict[str, list[str]]:
    """
    Classify columns into numeric, categorical and date columns
    that are worth visualizing.
    """

    identifier_columns = [
        column
        for column in df.columns
        if is_identifier_column(df, column)
    ]

    numeric_columns = [
        column
        for column in get_numeric_columns(df)
        if column not in identifier_columns
    ]

    candidate_columns = text_columns(df) + [
        column
        for column in df.columns
        if pd.api.types.is_bool_dtype(df[column])
    ]

    date_columns = detect_date_columns(df)

    categorical_columns = []

    for column in candidate_columns:

        if column in identifier_columns or column in date_columns:
            continue

        unique_count = df[column].nunique(dropna=True)

        # Ignore columns with no variation
        if unique_count <= 1:
            continue

        # Ignore extremely high-cardinality columns
        # Example: Name column with almost every value different
        if unique_count > 10:
            continue

        unique_ratio = unique_count / max(len(df), 1)

        # Ignore columns where most values are unique
        if unique_ratio > 0.5:
            continue

        categorical_columns.append(column)

    return {
        "numeric": numeric_columns,
        "categorical": categorical_columns,
        "date": date_columns,
    }


def generate_visualizations(df: pd.DataFrame) -> list[dict]:
    """
    Automatically generate chart specifications for a tabular dataset.

    Each item matches the frontend VisualizationItem type:
    {id, title, chartType, description, columnsUsed, reasonSelected,
     data, xKey, yKey}

    Supported visualizations:

    1. Numerical histograms
    2. Categorical bar charts
    3. Date-based line charts

    ID and high-cardinality columns are skipped.
    """

    visualizations = []

    if df.empty:
        return visualizations

    columns = select_columns(df)
    numeric_columns = columns["numeric"]
    categorical_columns = columns["categorical"]
    date_columns = columns["date"]

    # ---------------------------------------------------------
    # 1. Numerical histograms
    # ---------------------------------------------------------

    for column in numeric_columns[:5]:

        values = finite_numeric(df[column]).dropna()

        if values.empty:
            continue

        visualizations.append({
            "id": f"histogram_{column}",
            "title": f"Distribution of {column}",
            "chartType": "histogram",
            "description": (
                f"How values of {column} are spread across "
                "equal-width ranges."
            ),
            "columnsUsed": [column],
            "reasonSelected": f"{column} is a numerical measurement.",
            "data": histogram_bins(values),
            "xKey": "bin",
            "yKey": "count",
        })

    # ---------------------------------------------------------
    # 2. Categorical bar charts
    # ---------------------------------------------------------

    for column in categorical_columns[:5]:

        counts = (
            df[column]
            .astype(object)
            .fillna("Missing")
            .astype(str)
            .value_counts()
            .head(10)
        )

        if counts.empty:
            continue

        visualizations.append({
            "id": f"bar_{column}",
            "title": f"{column} Distribution",
            "chartType": "bar",
            "description": f"Number of rows for each {column} value.",
            "columnsUsed": [column],
            "reasonSelected": (
                f"{column} is categorical with "
                f"{df[column].nunique(dropna=True)} distinct values."
            ),
            "data": [
                {"name": str(name), "count": int(count)}
                for name, count in counts.items()
            ],
            "xKey": "name",
            "yKey": "count",
        })

    # ---------------------------------------------------------
    # 3. Date-based trends
    # ---------------------------------------------------------

    for date_column in date_columns[:2]:

        dates = parse_dates(df[date_column])

        valid_mask = dates.notna()

        if not valid_mask.any():
            continue

        # Generate trends for up to 2 numerical columns
        for numeric_column in numeric_columns[:2]:

            trend_df = pd.DataFrame({
                "date": dates[valid_mask],
                "value": finite_numeric(
                    df.loc[valid_mask, numeric_column]
                ),
            }).dropna()

            if trend_df.empty:
                continue

            # Sort by date and aggregate duplicate dates
            trend_df = (
                trend_df
                .sort_values("date")
                .groupby("date", as_index=False)["value"]
                .mean()
            )

            visualizations.append({
                "id": f"line_{date_column}_{numeric_column}",
                "title": f"{numeric_column} Over Time",
                "chartType": "line",
                "description": (
                    f"Average {numeric_column} per {date_column}."
                ),
                "columnsUsed": [date_column, numeric_column],
                "reasonSelected": (
                    f"{date_column} contains dates and "
                    f"{numeric_column} is numerical."
                ),
                "data": [
                    {
                        "date": row["date"].isoformat(),
                        "value": safe_float(row["value"], 4),
                    }
                    for _, row in trend_df.iterrows()
                ],
                "xKey": "date",
                "yKey": "value",
            })

    return visualizations


def correlation_matrix(df: pd.DataFrame) -> dict:
    """
    Pearson correlation between the non-identifier numeric columns.
    """

    numeric_columns = select_columns(df)["numeric"]

    if len(numeric_columns) < 2:
        return {"columns": numeric_columns, "matrix": []}

    correlation = (
        df[numeric_columns]
        .apply(finite_numeric)
        .corr()
        .round(3)
        .fillna(0)
    )

    return {
        "columns": numeric_columns,
        "matrix": correlation.values.tolist(),
    }
