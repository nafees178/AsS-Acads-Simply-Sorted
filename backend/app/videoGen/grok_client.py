"""
Gemini API Client — thin wrapper around OpenAI SDK configured for Google Gemini.

Gemini offers an OpenAI-compatible endpoint, so we use the official `openai`
package with base_url pointed to the Gemini OpenAI endpoint.
"""

import os
from openai import OpenAI
import sys
from pathlib import Path

# Explicit sys.path injection for standalone execution resilience
APP_DIR = Path(__file__).resolve().parent.parent
if str(APP_DIR) not in sys.path:
    sys.path.append(str(APP_DIR))

import config

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


class GeminiClient:
    """Client for the Google Gemini chat completions API (OpenAI-compatible)."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "No API key found. Set GEMINI_API_KEY in your .env file or pass it directly.\n"
                "Get a key at https://aistudio.google.com/apikey"
            )
        self.model = model or DEFAULT_MODEL
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=GEMINI_BASE_URL,
        )

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 16000,
    ) -> str:
        """
        Send a chat completion request to Gemini and return the response text.

        Args:
            system_prompt: Instructions for the model (knowledge context).
            user_prompt: The user's request / topic.
            model: Override the default model for this request.
            temperature: Creativity level (0.0 = deterministic, 1.0 = creative).
            max_tokens: Maximum tokens in the response.

        Returns:
            The model's response as a string.
        """
        response = self.client.chat.completions.create(
            model=model or self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
