import os
import json
import time

from dotenv import load_dotenv
from google import genai


load_dotenv()


def generate_insights(
    profile: dict,
    cleaning_actions: list,
    anomalies: list,
    quality_score: float,
) -> dict:

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return {
            "status": "error",
            "message": "GEMINI_API_KEY was not found.",
        }

    client = genai.Client(
        api_key=api_key
    )

    prompt = f"""
You are AURA, an AI Data Intelligence Assistant.

Analyze the following dataset processing information.

DATASET PROFILE:
{json.dumps(profile, default=str, indent=2)}

CLEANING ACTIONS:
{json.dumps(cleaning_actions, default=str, indent=2)}

ANOMALIES:
{json.dumps(anomalies, default=str, indent=2)}

QUALITY SCORE:
{quality_score}

Generate concise and useful data intelligence.

Focus on:

1. Overall dataset summary
2. Important data-quality findings
3. Important anomalies
4. Important patterns
5. Recommendations

Rules:

- Do not invent facts.
- Only use information provided above.
- Statistical outliers are not automatically errors.
- Business-rule violations are important issues.

Return ONLY valid JSON:

{{
    "summary": "Short overall summary",
    "key_findings": [
        "Finding 1",
        "Finding 2",
        "Finding 3"
    ],
    "data_quality_explanation": "Explain the quality score.",
    "recommendations": [
        "Recommendation 1",
        "Recommendation 2",
        "Recommendation 3"
    ]
}}
"""

    # Try a few stable Flash models.
    models = [
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
    ]

    last_error = None

    for model_name in models:

        # Retry each model for temporary 503/429 errors.
        for attempt in range(3):

            try:

                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )

                content = response.text.strip()

                # Remove markdown JSON fences
                if content.startswith("```json"):
                    content = content[7:]

                elif content.startswith("```"):
                    content = content[3:]

                if content.endswith("```"):
                    content = content[:-3]

                content = content.strip()

                insights = json.loads(content)

                return {
                    "status": "success",
                    "model": model_name,
                    "insights": insights,
                }

            except Exception as e:

                last_error = str(e)

                # Retry temporary service errors
                if (
                    "503" in last_error
                    or "UNAVAILABLE" in last_error
                    or "429" in last_error
                    or "RESOURCE_EXHAUSTED" in last_error
                ):

                    wait_time = 2 ** attempt

                    print(
                        f"Gemini temporarily unavailable "
                        f"using {model_name}. "
                        f"Retrying in {wait_time}s..."
                    )

                    time.sleep(wait_time)

                else:
                    # Don't retry authentication,
                    # invalid request, JSON, etc.
                    break

    return {
        "status": "error",
        "message": (
            "Gemini API is temporarily unavailable "
            "after trying multiple models and retries."
        ),
        "details": last_error,
    }