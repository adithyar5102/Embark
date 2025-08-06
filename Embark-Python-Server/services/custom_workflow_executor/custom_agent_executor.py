from abc import ABC
from typing import Any

from models.workflow_models.workflow import Agent

class CustomAgentExecutor(ABC):
    async def execute(agent: Agent, response_format: Any, task_message: str):
        ...