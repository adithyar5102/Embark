from abc import ABC

from modules.workflow_modules.workflow import Agent

class CustomAgentExecutor(ABC):
    async def execute(agent: Agent):
        ...