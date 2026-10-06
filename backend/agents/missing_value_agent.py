import pandas as pd


def handle_missing_values(df: pd.DataFrame) -> tuple[pd.DataFrame, list]:
    """
    Detect and handle missing values using simple,
    explainable rules.
    """

    actions = []

    for column in df.columns:

        missing_count = int(df[column].isna().sum())

        if missing_count == 0:
            continue

        # Numerical columns
        if pd.api.types.is_numeric_dtype(df[column]):

            median_value = df[column].median()

            df[column] = df[column].fillna(median_value)

            actions.append(
                {
                    "column": column,
                    "missing_values": missing_count,
                    "method": "median",
                    "replacement_value": float(median_value),
                }
            )

        # Categorical / text columns
        else:

            mode = df[column].mode()

            if not mode.empty:

                replacement_value = mode.iloc[0]

                df[column] = df[column].fillna(replacement_value)

                actions.append(
                    {
                        "column": column,
                        "missing_values": missing_count,
                        "method": "mode",
                        "replacement_value": str(replacement_value),
                    }
                )

    return df, actions