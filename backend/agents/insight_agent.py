import os
import json
import time

from dotenv import load_dotenv
from google import genai


load_dotenv()


# Try a few stable Flash models.
MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
]

# Keys holding row samples; they are dropped from prompts to keep
# them small and to avoid sending raw records to the model.
ROW_SAMPLE_KEYS = {"affected_rows", "rows_removed", "row_indices"}


class GeminiUnavailableError(Exception):
    pass


def compact(items: list) -> list:
    return [
        {
            key: value
            for key, value in item.items()
            if key not in ROW_SAMPLE_KEYS
        }
        for item in items
    ]


def strip_code_fences(content: str) -> str:
    content = content.strip()

    # Remove markdown JSON fences
    if content.startswith("```json"):
        content = content[7:]

    elif content.startswith("```"):
        content = content[3:]

    if content.endswith("```"):
        content = content[:-3]

    return content.strip()


def call_gemini(prompt: str) -> tuple[str, str]:
    """
    Send a prompt to Gemini, falling back across models and retrying
    temporary 503/429 errors.

    Returns (response text, model name).
    Raises GeminiUnavailableError if every attempt fails.
    """

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise GeminiUnavailableError("GEMINI_API_KEY was not found.")

    client = genai.Client(
        api_key=api_key
    )

    last_error = None

    for model_name in MODELS:

        # Retry each model for temporary 503/429 errors.
        for attempt in range(3):

            try:

                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )

                if not response.text:
                    raise ValueError("Gemini returned an empty response")

                return response.text, model_name

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
                    # invalid request, etc.
                    break

    raise GeminiUnavailableError(
        "Gemini API is temporarily unavailable after trying "
        f"multiple models and retries. Last error: {last_error}"
    )


def generate_insights(
    profile: dict,
    cleaning_actions: list,
    anomalies: list,
    quality_score: float,
) -> dict:

    prompt = f"""
You are AURA, an AI Data Intelligence Assistant.

Analyze the following dataset processing information.

DATASET PROFILE:
{json.dumps(profile, default=str, indent=2)}

CLEANING ACTIONS:
{json.dumps(compact(cleaning_actions), default=str, indent=2)}

ANOMALIES:
{json.dumps(compact(anomalies), default=str, indent=2)}

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
    ],
    "findings": [
        {{
            "title": "Short title of finding 1",
            "description": "Finding 1 explained in one or two sentences",
            "category": "One of: Correlation, Distribution, Data Quality, Anomaly, Trend",
            "impact": "One of: high, medium, low",
            "confidence": 0-100 (how strongly the provided data supports it),
            "recommendation": "What to do about it"
        }}
    ]
}}

"findings" must contain one entry per item in "key_findings", in the same order.
"""

    try:
        content, model_name = call_gemini(prompt)
        insights = json.loads(strip_code_fences(content))

    except GeminiUnavailableError as e:
        return {
            "status": "error",
            "message": str(e),
        }

    except json.JSONDecodeError:
        return {
            "status": "error",
            "message": "Gemini returned a response that was not valid JSON.",
        }

    return {
        "status": "success",
        "model": model_name,
        "insights": insights,
    }


def answer_question(
    message: str,
    context: dict | None,
    history: list[dict] | None = None,
) -> dict:
    """
    Answer a user question about a processed dataset.

    Returns {"message": str, "suggestedQuestions": list[str]}.
    Raises GeminiUnavailableError if Gemini cannot be reached.
    """

    history_text = "\n".join(
        f"{turn.get('role', 'user').upper()}: {turn.get('content', '')}"
        for turn in (history or [])[-10:]
    )

    context_text = (
        json.dumps(context, default=str, indent=2)
        if context
        else "No dataset has been selected."
    )

    prompt = f"""
You are AURA, an AI Data Intelligence Assistant.

Answer the user's question using ONLY the dataset information below.
If the information is not available, say so plainly. Do not invent numbers.

DATASET INFORMATION:
{context_text}

CONVERSATION SO FAR:
{history_text or "(none)"}

USER QUESTION:
{message}

Return ONLY valid JSON:

{{
    "message": "Your answer in plain text",
    "suggestedQuestions": ["Follow-up 1", "Follow-up 2", "Follow-up 3"]
}}
"""

    content, _ = call_gemini(prompt)

    try:
        answer = json.loads(strip_code_fences(content))
        return {
            "message": str(answer.get("message", "")),
            "suggestedQuestions": [
                str(question)
                for question in answer.get("suggestedQuestions", [])
            ][:3],
        }

    except (json.JSONDecodeError, AttributeError):
        # Fall back to the raw text if the model ignored the format.
        return {
            "message": content.strip(),
            "suggestedQuestions": [],
        }
