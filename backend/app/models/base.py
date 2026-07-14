from abc import ABC, abstractmethod


class EmbeddingModel(ABC):
    @abstractmethod
    def embed(self, texts: list[str]) -> list[list[float]]:
        """Return one embedding vector per input text, in order."""


class GenerationModel(ABC):
    @abstractmethod
    def generate(self, prompt: str, max_tokens: int = 512) -> str:
        """Return the model's completion for a single prompt."""
