import os
from functools import lru_cache

from app.models.base import GenerationModel


@lru_cache(maxsize=1)
def get_generation_model() -> GenerationModel:
    if os.environ.get("DEEPSEEK_API_KEY"):
        from app.models.deepseek_llm import DeepSeekLLM

        return DeepSeekLLM()

    # local_llm imports mlx_lm at module scope, which only installs on
    # Apple Silicon — deferred so a deployed (non-macOS) process never
    # touches this import path.
    from app.models.local_llm import LocalLLM

    return LocalLLM()
