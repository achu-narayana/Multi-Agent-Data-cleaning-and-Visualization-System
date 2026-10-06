import pandas as pd

from standardization_agent import standardize_categorical_values


df = pd.DataFrame(
    {
        "Department": [
            "IT",
            "it",
            "Finance",
            " sales ",
            "Sales",
            "HR",
        ]
    }
)

print("BEFORE:")
print(df)

cleaned_df, actions = standardize_categorical_values(df)

print("\nAFTER:")
print(cleaned_df)

print("\nACTIONS:")
for action in actions:
    print(action)