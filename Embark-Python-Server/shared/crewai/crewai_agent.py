from contextlib import AsyncExitStack
from crewai import Agent, Crew, Process, Task
from crewai.llm import LLM
from typing import Any, Dict, List, Optional, Tuple, Union
from core.exception.workflow_execution_exception import InvalidProcessTypeException
from core.llm.agent_llm_providers.llm_provider_impl.crewai_llm_config import CrewAILLMProvider
from models.workflow_models.workflow import ExecutionTypeCrewAI, Stdio, Tool
from models.workflow_models.workflow import Agent as WorkflowAgent
from mcp import StdioServerParameters, ClientSession, stdio_client
from mcp.client.sse import sse_client
from crewai_tools import MCPServerAdapter
from shared.base_agent import BaseAgent

class CrewAIAgent(BaseAgent):

    async def register_agent(self, agent: WorkflowAgent):
        return Agent(
            role=agent.name,
            goal=agent.goal,
            backstory=agent.detailed_prompt,
            llm=CrewAILLMProvider().get_llm_instance(llm=agent.llm),
            verbose=False,
            tools=await self.get_tools(agent.tools)
        )

    async def register_task(self, agent: WorkflowAgent, response_format: Optional[Any] = None):
        return Task(
            description=agent.agent_responsibility,
            expected_output=agent.expected_output,
            agent=agent,
            output_pydantic=response_format
        )
        
    
    async def get_process(self,process_type: str):
        match (process_type.lower()):
            case ExecutionTypeCrewAI.HIERARCHICAL.value:
                return Process.hierarchical
            case ExecutionTypeCrewAI.SEQUENTIAL.value:
                return Process.sequential
            case _:
                raise InvalidProcessTypeException(process_type=process_type)
            
    async def get_crew(agents:List[Agent], tasks:List[Task], crew_ai_process_type=None, manager_agent:Agent=None, manager_llm:LLM=None):
        return Crew(
            agents=agents,
            tasks=tasks,
            process=crew_ai_process_type,
            verbose=True,
            manager_agent=manager_agent,
            manager_llm=manager_llm
        )
