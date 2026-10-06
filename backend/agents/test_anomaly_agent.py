import pandas as pd

from agents.anomaly_agent import detect_anomalies


df = pd.DataFrame({
    "Employee_ID": [1001, 1002, 1003, 1004, 1005],
    "Name": [
        "Ananya",
        "Rahul",
        "Priya",
        "Arjun",
        "Sneha",
    ],
    "Age": [
        25,
        30,
        150,
        28,
        35,
    ],
    "Salary": [
        50000,
        60000,
        -5000,
        55000,
        70000,
    ],
    "Performance_Score": [
        8.5,
        7.0,
        10.5,
        9.0,
        8.0,
    ],
    "Experience_Years": [
        2,
        5,
        10,
        3,
        15,
    ],
})


_, anomalies = detect_anomalies(df)


print("\nDETECTED ANOMALIES:\n")

for anomaly in anomalies:
    print(anomaly)