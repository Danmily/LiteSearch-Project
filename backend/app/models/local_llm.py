from functools import lru_cache

from mlx_lm import generate, load

from app.models.base import GenerationModel

MODEL_NAME = "mlx-community/Qwen2.5-3B-Instruct-4bit"


class LocalLLM(GenerationModel):
    def __init__(self, model_name: str = MODEL_NAME):
        self._model, self._tokenizer = load(model_name)

    def generate(self, prompt: str, max_tokens: int = 512) -> str:
        messages = [{"role": "user", "content": prompt}]
        formatted = self._tokenizer.apply_chat_template(
            messages, add_generation_prompt=True
        )
        return generate(
            self._model, self._tokenizer, prompt=formatted, max_tokens=max_tokens
        )


@lru_cache(maxsize=1)
def get_generation_model() -> GenerationModel:
    return LocalLLM()
