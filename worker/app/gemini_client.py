"""Gemini API client for summarization with Flash/Flash-Lite fallback."""

import json
import logging

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)

SUMMARY_SYSTEM_PROMPT = """You are an expert meeting analyst. Given a meeting transcript with speaker labels, produce a structured JSON summary.

Output MUST be valid JSON with exactly this schema:
{
  "overview": "A comprehensive 2-3 paragraph executive summary of the meeting.",
  "key_themes": ["theme1", "theme2", ...],
  "sentiment": "Overall meeting sentiment (e.g., 'Positive / Collaborative', 'Tense / Debated', etc.)",
  "action_items": [
    {
      "title": "Action item title",
      "description": "What needs to be done and by whom",
      "assignee": "Person responsible (or 'TBD')",
      "deadline": "Mentioned deadline (or 'TBD')"
    }
  ],
  "decisions": ["Key decision 1", "Key decision 2", ...],
  "follow_ups": ["Follow-up item 1", "Follow-up item 2", ...],
  "participants_summary": [
    {
      "speaker": "Speaker label or name",
      "role_or_context": "Inferred role based on their contributions",
      "key_contributions": "Brief summary of their main points"
    }
  ]
}

Rules:
- Be thorough but concise
- Extract ALL action items mentioned
- Identify decisions vs. open discussions
- If language is Thai, write the summary in Thai
- Output RAW JSON only, no markdown fences
"""


def summarize_transcript(
    transcript: str,
    utterances: list[dict] | None = None,
    language: str | None = None,
) -> dict:
    """
    Summarize transcript using Gemini 2.5 Flash with Flash-Lite fallback.

    Args:
        transcript: Full transcript text
        utterances: Optional speaker-labeled utterances
        language: Detected language for context

    Returns:
        dict with summary structure
    """
    settings = get_settings()

    # Build the user message with speaker info if available
    user_message = _build_user_message(transcript, utterances, language)

    # Try Gemini 2.5 Flash first, fallback to Flash-Lite
    for model_name in ["gemini-2.5-flash", "gemini-2.5-flash-lite"]:
        try:
            logger.info(f"Attempting summarization with {model_name}...")
            result = _call_gemini(settings.gemini_api_key, model_name, user_message)
            logger.info(f"Successfully summarized with {model_name}")
            return result
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                logger.warning(f"{model_name} rate limited, trying fallback...")
                continue
            else:
                logger.error(f"{model_name} failed: {e}")
                if model_name == "gemini-2.5-flash-lite":
                    raise
                continue

    raise Exception("All Gemini models exhausted")


def _call_gemini(api_key: str, model_name: str, user_message: str) -> dict:
    """Call a specific Gemini model and parse JSON response."""
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=model_name,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=SUMMARY_SYSTEM_PROMPT,
            temperature=0.3,
            max_output_tokens=4096,
            response_mime_type="application/json",
        ),
    )

    # Parse JSON response
    text = response.text.strip()

    # Remove markdown fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse JSON, returning raw text")
        return {"overview": text, "raw": True}


def _build_user_message(
    transcript: str,
    utterances: list[dict] | None = None,
    language: str | None = None,
) -> str:
    """Build the user prompt with transcript and context."""
    parts = []

    if language:
        parts.append(f"Detected language: {language}")

    if utterances:
        parts.append("=== TRANSCRIPT WITH SPEAKERS ===")
        for u in utterances:
            speaker = f"Speaker {u.get('speaker', '?')}"
            start = _format_time(u.get("start", 0))
            parts.append(f"[{start}] {speaker}: {u.get('text', '')}")
    else:
        parts.append("=== TRANSCRIPT ===")
        parts.append(transcript)

    return "\n".join(parts)


def _format_time(seconds: float) -> str:
    """Format seconds to MM:SS."""
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"
