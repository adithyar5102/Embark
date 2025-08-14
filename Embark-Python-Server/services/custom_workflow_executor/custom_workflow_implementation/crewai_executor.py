
import json
from typing import Any
from core.exception.workflow_execution_exception import InvalidJsonResponse
from shared.crewai.crewai_agent import CrewAIAgent
from services.custom_workflow_executor.custom_agent_executor import CustomAgentExecutor
from models.workflow_models.workflow import Agent
from crewai import Crew

class CrewAIExecutor(CustomAgentExecutor):
    def __init__(self):
        self.crew_ai_instance = CrewAIAgent()
        
    async def execute(self, agent: Agent, response_format: Any, task_message: str):
        crew_ai_agent = await self.crew_ai_instance.register_agent(agent=agent)
        crew_ai_task = await self.crew_ai_instance.register_task(
            agent,
            crew_ai_agent,
            response_format
        )
        crew: Crew = await self.crew_ai_instance.get_crew(
            agents=[crew_ai_agent],
            crew_ai_task=[crew_ai_task],
        )
        
        message = {
            "message": task_message
        }

        result = await crew.kickoff_async(
            inputs=message
        )

        if result.pydantic is None:
            raise InvalidJsonResponse()
        
        try:
            json_response = json.loads(result.raw)
            return json_response
        except Exception as e:
            raise InvalidJsonResponse(str(e))
