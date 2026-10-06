import pandas as pd


def normalize_value(value: str) -> str:
    """
    Normalize a categorical value while preserving
    common acronyms such as IT, HR, SQL, AI, etc.
    """

    value = value.strip()

    # Common acronyms
    acronyms = {
        "it": "IT",
        "hr": "HR",
        "ai": "AI",
        "ml": "ML",
        "sql": "SQL",
        "api": "API",
        "ui": "UI",
        "ux": "UX",
    }

    lower_value = value.lower()

    if lower_value in acronyms:
        return acronyms[lower_value]

    # Normal words
    return value.title()


def standardize_categorical_values(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, list]:

    actions = []

    categorical_columns = df.select_dtypes(
        include=["object", "category", "string"]
    ).columns

    for column in categorical_columns:

        original_values = df[column].dropna().astype(str)

        if original_values.empty:
            continue

        standardized_values = original_values.apply(
            normalize_value
        )

        changed_count = int(
            (original_values != standardized_values).sum()
        )

        if changed_count > 0:

            # Apply normalization to the entire column
            df[column] = df[column].apply(
                lambda x: (
                    normalize_value(str(x))
                    if pd.notna(x)
                    else x
                )
            )

            actions.append(
                {
                    "column": column,
                    "values_changed": changed_count,
                    "method": "trim_and_case_normalization",
                }
            )

    return df, actions