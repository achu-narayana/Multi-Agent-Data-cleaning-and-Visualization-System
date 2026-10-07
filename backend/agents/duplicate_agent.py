import pandas as pd

from services.dataframe_utils import dataframe_records


# Only a sample of removed rows is kept in the action log so that
# large datasets don't produce huge API responses or LLM prompts.
MAX_ROWS_REPORTED = 20


def handle_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, list]:
    """
    Detect and remove duplicate rows while recording
    what was removed.

    The original row index is preserved so that later steps can
    compare cleaned rows with the original dataset.
    """

    duplicate_mask = df.duplicated(keep="first")
    duplicate_count = int(duplicate_mask.sum())

    actions = []

    if duplicate_count > 0:
        duplicate_rows = df[duplicate_mask]

        df = df[~duplicate_mask]

        actions.append(
            {
                "duplicates_removed": duplicate_count,
                "method": "exact_duplicate_removal",
                "row_indices": [
                    int(index)
                    for index in duplicate_rows.index[:MAX_ROWS_REPORTED]
                ],
                "rows_removed": dataframe_records(
                    duplicate_rows,
                    limit=MAX_ROWS_REPORTED,
                ),
            }
        )

    return df, actions
