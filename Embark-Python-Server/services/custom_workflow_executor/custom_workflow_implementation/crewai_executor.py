
import json
from typing import Any
from core.exception.workflow_execution_exception import InvalidJsonResponse
from shared.crewai.crewai_agent import CrewAIAgent
from services.custom_workflow_executor.custom_agent_executor import CustomAgentExecutor
from models.workflow_models.workflow import Agent
from crewai import Crew
from crewai_tools import MCPServerAdapter
import logging

logger = logging.getLogger(__name__)

# TODO Handle Multiple MCP for a agent
server_params = {
    "url": "http://localhost:8001/sse",
    "transport": "sse"
}

adapter = MCPServerAdapter(server_params)

class CrewAIExecutor(CustomAgentExecutor):
    def __init__(self):
        self.crew_ai_instance = CrewAIAgent(adapter)

    def close_mcp_connection(self):
        if adapter:
            adapter.stop()
        
    async def execute(self, agent: Agent, response_format: Any, task_message: str):
        crew_ai_agent = await self.crew_ai_instance.register_agent(agent)

        agent_responsibility_with_input = f"{agent.agent_responsibility}\n\n**Input/Additional Context:**\n{task_message}"
        agent.agent_responsibility = agent_responsibility_with_input
        crew_ai_task = await self.crew_ai_instance.register_task(
            agent,
            crew_ai_agent,
            response_format
        )
        crew: Crew = await self.crew_ai_instance.get_crew(
            crew_agents=[crew_ai_agent],
            tasks=[crew_ai_task],
        )

        result = await crew.kickoff_async()

        if result.pydantic is None:
            raise InvalidJsonResponse()
        
        try:
            json_response = result.pydantic.model_dump()
            print("JSON RESPONSE")
            print(json_response)
            return json_response
        except Exception as e:
            raise InvalidJsonResponse(str(e))
