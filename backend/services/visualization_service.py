import pandas as pd


def is_identifier_column(df: pd.DataFrame, column: str) -> bool:
    """
    Detect columns that are probably identifiers rather than
    meaningful analytical variables.
    """

    name = column.lower().strip()

    # Strong ID naming patterns
    if (
        name == "id"
        or name.endswith("_id")
        or name.endswith(" id")
        or "identifier" in name
    ):
        return True

    return False


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

        column_name = column.lower()

        # Only attempt parsing when the column name suggests a date
        if not any(
            keyword in column_name
            for keyword in date_keywords
        ):
            continue

        try:
            parsed = pd.to_datetime(
                df[column],
                errors="coerce",
                format="mixed",
            )
        except (TypeError, ValueError):
            parsed = pd.to_datetime(
                df[column],
                errors="coerce",
            )

        # At least 70% of the values should be valid dates
        if parsed.notna().mean() >= 0.7:
            date_columns.append(column)

    return date_columns


def generate_visualizations(df: pd.DataFrame) -> list[dict]:
    """
    Automatically generate useful visualization specifications
    for a tabular dataset.

    Supported visualizations:

    1. Numerical histograms
    2. Categorical bar charts
    3. Date-based line charts
    4. Numerical correlation matrix

    The function attempts to be dataset-independent and avoids
    unnecessary visualizations for ID and high-cardinality columns.
    """

    visualizations = []

    # ---------------------------------------------------------
    # Basic validation
    # ---------------------------------------------------------

    if df.empty:
        return visualizations

    # ---------------------------------------------------------
    # Identify ID columns
    # ---------------------------------------------------------

    identifier_columns = [
        column
        for column in df.columns
        if is_identifier_column(df, column)
    ]

    # ---------------------------------------------------------
    # Identify numerical columns
    # ---------------------------------------------------------

    numeric_columns = [
        column
        for column in df.select_dtypes(include="number").columns
        if column not in identifier_columns
    ]

    # ---------------------------------------------------------
    # Identify categorical columns
    # ---------------------------------------------------------

    categorical_columns = []

    for column in df.select_dtypes(
        include=["object", "category", "bool"]
    ).columns:

        if column in identifier_columns:
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

    # ---------------------------------------------------------
    # Identify date columns
    # ---------------------------------------------------------

    date_columns = detect_date_columns(df)

    # Date columns should not also be treated as categories
    categorical_columns = [
        column
        for column in categorical_columns
        if column not in date_columns
    ]

    # ---------------------------------------------------------
    # 1. Numerical histograms
    # ---------------------------------------------------------

    for column in numeric_columns[:5]:

        values = (
            pd.to_numeric(
                df[column],
                errors="coerce",
            )
            .dropna()
            .tolist()
        )

        if not values:
            continue

        visualizations.append({
            "type": "histogram",
            "title": f"Distribution of {column}",
            "column": column,
            "data": values,
        })

    # ---------------------------------------------------------
    # 2. Categorical bar charts
    # ---------------------------------------------------------

    for column in categorical_columns[:5]:

        counts = (
            df[column]
            .fillna("Missing")
            .astype(str)
            .value_counts()
            .head(10)
        )

        if counts.empty:
            continue

        visualizations.append({
            "type": "bar",
            "title": f"{column} Distribution",
            "column": column,
            "labels": counts.index.tolist(),
            "values": counts.values.tolist(),
        })

    # ---------------------------------------------------------
    # 3. Date-based trends
    # ---------------------------------------------------------

    for date_column in date_columns[:2]:

        try:
            dates = pd.to_datetime(
                df[date_column],
                errors="coerce",
                format="mixed",
            )
        except (TypeError, ValueError):
            dates = pd.to_datetime(
                df[date_column],
                errors="coerce",
            )

        valid_mask = dates.notna()

        if not valid_mask.any():
            continue

        # Generate trends for up to 2 numerical columns
        for numeric_column in numeric_columns[:2]:

            trend_df = pd.DataFrame({
                "date": dates[valid_mask],
                "value": pd.to_numeric(
                    df.loc[valid_mask, numeric_column],
                    errors="coerce",
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
                "type": "line",
                "title": f"{numeric_column} Over Time",
                "date_column": date_column,
                "value_column": numeric_column,
                "data": [
                    {
                        "date": row["date"].isoformat(),
                        "value": float(row["value"]),
                    }
                    for _, row in trend_df.iterrows()
                ],
            })

    # ---------------------------------------------------------
    # 4. Correlation matrix
    # ---------------------------------------------------------

    if len(numeric_columns) >= 2:

        correlation = (
            df[numeric_columns]
            .corr()
            .round(3)
        )

        visualizations.append({
            "type": "correlation",
            "title": "Numeric Correlation Matrix",
            "columns": numeric_columns,
            "values": correlation.fillna(0).values.tolist(),
        })

    # ---------------------------------------------------------
    # Return all visualization specifications
    # ---------------------------------------------------------

    return visualizations