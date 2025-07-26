
from crewai import LLM
from core.llm.llm_provider import LLMProvider
from modules.workflow_modules.workflow import LLM as WorkflowLLM

class CrewAILLMProvider(LLMProvider):
    def get_llm_instance(self, llm: WorkflowLLM = None):
        if llm is None:
            return None
        return LLM(
            model=f"{llm.provider}/{llm.model}",
            temperature=llm.temperature,
            max_completion_tokens=llm.max_tokens,
            top_p=llm.top_probability,
            stop=None,
            stream=False,
        )