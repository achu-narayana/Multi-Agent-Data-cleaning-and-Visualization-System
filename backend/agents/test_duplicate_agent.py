import pandas as pd

from duplicate_agent import handle_duplicates


df = pd.DataFrame(
    {
        "Employee_ID": [1001, 1002, 1003, 1003, 1004],
        "Name": [
            "Ananya",
            "Rahul",
            "Priya",
            "Priya",
            "Arjun",
        ],
        "Department": [
            "IT",
            "IT",
            "HR",
            "HR",
            "Finance",
        ],
    }
)

print("BEFORE:")
print(df)

cleaned_df, actions = handle_duplicates(df)

print("\nAFTER:")
print(cleaned_df)

print("\nACTIONS:")
for action in actions:
    print(action)