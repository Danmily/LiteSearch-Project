import os

import httpx

from app.models.base import GenerationModel

API_URL = "https://api.deepseek.com/chat/completions"
MODEL_NAME = "deepseek-chat"


class DeepSeekLLM(GenerationModel):
    def __init__(self):
        self._api_key = os.environ["DEEPSEEK_API_KEY"]

    def generate(self, prompt: str, max_tokens: int = 512) -> str:
        resp = httpx.post(
            API_URL,
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={
                "model": MODEL_NAME,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "stream": False,
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
