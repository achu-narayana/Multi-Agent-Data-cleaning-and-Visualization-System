import pandas as pd

from graph.workflow import workflow


df = pd.DataFrame(
    {
        "Employee_ID": [
            1001,
            1002,
            1003,
            1003,
            1004,
        ],
        "Name": [
            "Ananya",
            "Rahul",
            "Priya",
            "Priya",
            "Arjun",
        ],
        "Department": [
            "IT",
            "it",
            "HR",
            "HR",
            "Finance",
        ],
        "Age": [
            25,
            None,
            30,
            30,
            150,
        ],
        "Salary": [
            50000,
            60000,
            None,
            None,
            -5000,
        ],
    }
)


initial_state = {
    "dataset_id": "test-dataset",
    "filename": "test_employee.csv",
    "dataframe": df,
    "profile": {},
    "cleaning_actions": [],
    "anomalies": [],
    "errors": [],
}


print("STARTING WORKFLOW...\n")

result = workflow.invoke(initial_state)


print("WORKFLOW COMPLETE\n")

print("CLEANED DATA:")
print(result["dataframe"])

print("\nCLEANING ACTIONS:")

for action in result.get("cleaning_actions", []):
    print(action)

print("\nANOMALIES:")

for anomaly in result.get("anomalies", []):
    print(anomaly)

print("\nVALIDATION:")
print(result.get("validation_result"))

print("\nQUALITY SCORE:")
print(result.get("quality_score"))

print("\nSTATUS:")
print(result.get("status"))