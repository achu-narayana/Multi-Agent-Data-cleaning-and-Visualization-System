import math
import os
from datetime import date, datetime
from typing import Any

import numpy as np
import pandas as pd


SUPPORTED_EXTENSIONS = (".csv", ".xlsx", ".xls")


def load_dataset(file_path: str) -> pd.DataFrame:
    """
    Load a CSV or Excel file into a dataframe.

    Column names are converted to strings so that every agent can
    safely call string methods on them.
    """

    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".csv":
        df = pd.read_csv(file_path)

    elif extension in (".xlsx", ".xls"):
        df = pd.read_excel(file_path)

    else:
        raise ValueError("Unsupported file format")

    df.columns = [str(column) for column in df.columns]

    return df


def is_text_column(series: pd.Series) -> bool:
    """
    True for object, string and categorical columns.

    pandas 3 stores text in a dedicated "str" dtype that is not
    selected by select_dtypes(include="object"), so check explicitly.
    """

    return (
        pd.api.types.is_object_dtype(series)
        or pd.api.types.is_string_dtype(series)
        or isinstance(series.dtype, pd.CategoricalDtype)
    )


def text_columns(df: pd.DataFrame) -> list[str]:
    return [
        column
        for column in df.columns
        if is_text_column(df[column])
    ]


def numeric_columns(df: pd.DataFrame) -> list[str]:
    return df.select_dtypes(include="number").columns.tolist()


def safe_float(value: Any, digits: int | None = None) -> float | None:
    """
    Convert a value to float, returning None for NaN and infinity
    (which cannot be represented in JSON).
    """

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if not math.isfinite(number):
        return None

    return round(number, digits) if digits is not None else number


def to_json_safe(value: Any) -> Any:
    """
    Recursively convert a structure into JSON/BSON-safe Python values.

    - NaN / infinity -> None
    - numpy scalars -> Python scalars
    - timestamps -> ISO strings
    """

    if isinstance(value, dict):
        return {
            str(key): to_json_safe(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple, set)):
        return [to_json_safe(item) for item in value]

    if isinstance(value, np.ndarray):
        return [to_json_safe(item) for item in value.tolist()]

    if value is None or value is pd.NaT:
        return None

    if isinstance(value, (bool, np.bool_)):
        return bool(value)

    if isinstance(value, (int, np.integer)):
        return int(value)

    if isinstance(value, (float, np.floating)):
        return safe_float(value)

    if isinstance(value, (pd.Timestamp, datetime, date)):
        return value.isoformat()

    if isinstance(value, str):
        return value

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    return str(value)


def dataframe_records(
    df: pd.DataFrame,
    limit: int | None = None,
) -> list[dict]:
    if limit is not None:
        df = df.head(limit)

    return to_json_safe(df.to_dict(orient="records"))
