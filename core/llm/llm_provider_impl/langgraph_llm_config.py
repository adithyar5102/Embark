from core.llm.llm_provider import LLMProvider
from modules.workflow_modules.workflow import LLM
from langchain.chat_models import init_chat_model

class LangGraphLLMProvider(LLMProvider):
    def get_llm_instance(self, llm: LLM = None):
        if llm is None:
            return None
        return init_chat_model(
            model=llm.model,
            model_provider=llm.provider,
            temperature=llm.temperature,
            max_tokens=llm.max_tokens
        )