
from crewai import LLM
from core.llm.agent_llm_providers.llm_provider import LLMProvider
from models.workflow_models.workflow import LLM as WorkflowLLM

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