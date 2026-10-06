import pandas as pd

from services.visualization_service import (
    generate_visualizations,
)


df = pd.DataFrame({
    "Name": [
        "Ananya",
        "Rahul",
        "Priya",
        "Arjun",
    ],
    "Department": [
        "IT",
        "HR",
        "IT",
        "Finance",
    ],
    "Age": [
        25,
        30,
        28,
        35,
    ],
    "Salary": [
        50000,
        60000,
        55000,
        70000,
    ],
})


visualizations = generate_visualizations(df)

print("\nGENERATED VISUALIZATIONS:\n")

for visualization in visualizations:
    print(visualization)