import pandas as pd

from validation_agent import validate_dataset


# Clean dataset
df = pd.DataFrame(
    {
        "Employee_ID": [1001, 1002, 1002],
        "Name": [
            "Ananya",
            "Rahul",
            "Rahul",
        ],
        "Age": [
            25,
            None,
            30,
        ],
        "Salary": [
            50000,
            60000,
            70000,
        ],
    }
)


result = validate_dataset(df)


print("VALIDATION RESULT:")
print(result)
