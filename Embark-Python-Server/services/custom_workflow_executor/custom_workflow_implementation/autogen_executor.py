
from core.exception.autogen_error import UnsupportedAutogenStructuredResponseError
from modules.workflow_modules.workflow import Agent
from services.custom_workflow_executor.custom_agent_executor import CustomAgentExecutor


class AutogenExecutor(CustomAgentExecutor):
    
    async def execute(agent: Agent):
        raise UnsupportedAutogenStructuredResponseError(len(agent.tools))
