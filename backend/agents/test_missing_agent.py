import pandas as pd

from missing_value_agent import handle_missing_values


df = pd.DataFrame(
    {
        "Age": [24, 27, None, 35, 29],
        "Salary": [50000, None, 70000, 80000, 90000],
        "Department": ["IT", "IT", None, "Finance", "IT"],
    }
)

print("BEFORE:")
print(df)

cleaned_df, actions = handle_missing_values(df)

print("\nAFTER:")
print(cleaned_df)

print("\nACTIONS:")
for action in actions:
    print(action)