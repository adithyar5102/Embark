from abc import ABC, abstractmethod
from typing import Any

class BaseLLMProvider(ABC):
    @abstractmethod
    async def execute(
        model: str,
        prompt: str,
        system_message: str,
        top_probability: float = 1.0,
        temperature: float = 0,
        max_tokens: int = None,
        base64_encoded_image: list = None,
        response_format: Any = None,
    ):
        ...
        