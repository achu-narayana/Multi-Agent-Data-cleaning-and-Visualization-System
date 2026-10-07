import re

import pandas as pd

from services.dataframe_utils import text_columns


# Common acronyms that should always be upper-case.
ACRONYMS = {
    "it": "IT",
    "hr": "HR",
    "ai": "AI",
    "ml": "ML",
    "sql": "SQL",
    "api": "API",
    "ui": "UI",
    "ux": "UX",
}


def clean_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def variant_key(value: str) -> str:
    return clean_whitespace(value).lower()


def choose_canonical(key: str, variants: pd.Series) -> str:
    """
    Pick the canonical spelling for a group of values that differ
    only by case or whitespace.

    Acronyms win first, then the most frequent spelling, and ties
    are broken by preferring the title-cased spelling.
    """

    if key in ACRONYMS:
        return ACRONYMS[key]

    counts = variants.value_counts()
    top_count = counts.iloc[0]
    candidates = counts[counts == top_count].index.tolist()

    for candidate in candidates:
        if candidate == candidate.title():
            return candidate

    return candidates[0]


def standardize_categorical_values(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, list]:
    """
    Merge spelling variants of the same categorical value.

    Values are only changed when another value in the same column
    differs from them just by case or whitespace (e.g. "it", " IT ",
    "It" -> "IT"). Unique values such as names or e-mail addresses
    keep their original casing; surrounding whitespace is trimmed.
    """

    df = df.copy()

    actions = []

    for column in text_columns(df):

        series = df[column]

        string_mask = series.map(lambda value: isinstance(value, str))

        if not string_mask.any():
            continue

        original_values = series[string_mask]

        trimmed = original_values.map(clean_whitespace)
        keys = original_values.map(variant_key)

        canonical = {
            key: choose_canonical(key, trimmed[keys == key])
            for key in keys.unique()
        }

        standardized_values = keys.map(canonical)

        changed_mask = original_values != standardized_values
        changed_count = int(changed_mask.sum())

        if changed_count == 0:
            continue

        df[column] = df[column].astype(object)
        df.loc[standardized_values.index, column] = standardized_values

        examples = (
            pd.DataFrame(
                {
                    "from": original_values[changed_mask],
                    "to": standardized_values[changed_mask],
                }
            )
            .drop_duplicates()
            .head(10)
            .to_dict(orient="records")
        )

        actions.append(
            {
                "column": column,
                "values_changed": changed_count,
                "method": "trim_and_case_normalization",
                "examples": examples,
            }
        )

    return df, actions
