from typing import Any, Optional
from core.exception.llm_config_exception import InvalidLLMProviderError
from core.llm.llm_provider import LLMProvider
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.models.anthropic import AnthropicChatCompletionClient
from autogen_ext.models.ollama import OllamaChatCompletionClient
from modules.workflow_modules.workflow import LLM

class AutogenLLMProvider(LLMProvider):

    def get_openai_client(llm: LLM):
        return OpenAIChatCompletionClient(
            model=llm.model,
            temperature=llm.temperature,
            top_p=llm.top_probability,
            max_tokens=llm.max_tokens,
        )

    def get_anthropic_client(llm: LLM):
        return AnthropicChatCompletionClient(
            model=llm.model,
            temperature=llm.temperature,
            top_p=llm.top_probability,
            max_tokens=llm.max_tokens,
        )

    def get_ollama_client(llm: LLM):
        return OllamaChatCompletionClient(
            model=llm.model,
            temperature=llm.temperature,
            top_p=llm.top_probability,
            max_tokens=llm.max_tokens,
        )

    def get_llm_instance(self, llm: LLM = None):
        if llm is None:
            return None
        match llm.provider.lower():
            case "openai" | "gemini" | "llama":
                return self.get_openai_client(llm=llm)
            case "anthropic":
                return self.get_anthropic_client(llm=llm)
            case "ollama":
                return self.get_ollama_client(llm=llm)
            case _:
                raise InvalidLLMProviderError()
