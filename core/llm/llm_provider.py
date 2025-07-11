from abc import ABC


class LLMProvider(ABC):
    def get_llm_instance(self, model_name: str, provider: str):
        ...