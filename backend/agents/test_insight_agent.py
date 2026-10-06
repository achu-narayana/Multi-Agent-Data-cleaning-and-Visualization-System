from agents.insight_agent import generate_insights


profile = {
    "rows": 100,
    "columns": 6,
    "column_names": [
        "Age",
        "Salary",
        "Department",
        "Experience",
        "Score",
        "Joining_Date",
    ],
    "missing_values": {
        "Age": 3,
        "Salary": 1,
    },
    "duplicate_rows": 2,
}


cleaning_actions = [
    {
        "column": "Age",
        "missing_values": 3,
        "method": "median",
        "replacement_value": 28,
    },
    {
        "duplicates_removed": 2,
        "method": "exact_duplicate_removal",
    },
]


anomalies = [
    {
        "column": "Age",
        "type": "business_rule_violation",
        "count": 1,
    }
]


result = generate_insights(
    profile=profile,
    cleaning_actions=cleaning_actions,
    anomalies=anomalies,
    quality_score=82,
)


print("\nGEMINI INSIGHTS:\n")
print(result)