import pandas as pd


def handle_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, list]:
    """
    Detect and remove duplicate rows while recording
    what was removed.
    """

    duplicate_mask = df.duplicated(keep="first")
    duplicate_count = int(duplicate_mask.sum())

    actions = []

    if duplicate_count > 0:
        duplicate_rows = df[duplicate_mask].to_dict(orient="records")

        df = df.drop_duplicates(
            keep="first"
        ).reset_index(drop=True)

        actions.append(
            {
                "duplicates_removed": duplicate_count,
                "method": "exact_duplicate_removal",
                "rows_removed": duplicate_rows,
            }
        )

    return df, actions