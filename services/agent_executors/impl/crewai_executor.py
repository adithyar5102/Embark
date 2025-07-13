# src/research_crew/crew.py
import json
from crewai import Agent, Crew, Process, Task
from typing import Dict, List, Optional, Tuple, Union
from core.prompts.manager_prompt import REFLECTION_AGENT_GOAL, REFLECTION_AGENT_PROMPT
from core.exception.workflow_execution_exception import InvalidProcessTypeException
from core.llm.llm_provider_impl.crewai_llm_config import CrewAILLMProvider
from modules.workflow_modules.workflow import ExecutionTypeCrewAI, Stdio, Tool, Workflow, LLM
from modules.workflow_modules.workflow import Agent as WorkflowAgent
from services.agent_executors.executor import AgentExecutor
from crewai.tools.base_tool import BaseTool
from crewai.agents.agent_builder.base_agent import BaseAgent
from mcp import StdioServerParameters
from crewai_tools import MCPServerAdapter

class CrewAIExecutor(AgentExecutor):
    def __init__(self):
        self._tool_cache: Dict[Tuple[str, Union[str, None]], List] = {}

    async def register_agent(self, agent: WorkflowAgent):
        return Agent(
            role=agent.name,
            goal=agent.goal,
            backstory=agent.detailed_prompt,
            llm=CrewAILLMProvider().get_llm_instance(agent.llm),
            verbose=False,
            tools=self.get_tools(agent.tools)
        )

    async def register_task(self, agent: WorkflowAgent):
        return Task(
            description=agent.agent_responsibility,
            expected_output=agent.expected_output,
            agent=agent,
        )
    
    async def get_tools(self, tools: Optional[List[Tool]] = []) -> List[Tool]:
        tools_list = []

        for stdio_sse_tool in tools:
            cache_key = None
            tools_result = None

            if isinstance(stdio_sse_tool.connection, Stdio):
                server_params=StdioServerParameters(
                    command=stdio_sse_tool.connection.command,
                    args=stdio_sse_tool.connection.arguments,
                )

                # Create a hashable cache key for stdio
                cache_key = ("stdio", server_params.command, tuple(server_params.args))

            else:
                sse_server_params = {
                    "url": stdio_sse_tool.connection.connection_url,
                    "transport": "sse"
                }

                # Create a hashable cache key for SSE
                cache_key = (
                    "sse",
                    sse_server_params.get('url',''),
                )

            # Check the cache
            if cache_key in self._tool_cache:
                tools_result = self._tool_cache[cache_key]
            else:
                with MCPServerAdapter(server_params) as mcp_tools:
                    tools_result = mcp_tools
                    self._tool_cache[cache_key] = tools_result

            for tool in tools_result:
                if tool.name == stdio_sse_tool.name:
                    tools_list.append(tool)

        return tools_list

    async def initialize_reflection(self, task: str, manager_additional_instructions: Optional[str], llm: LLM):
        manager_additional_instructions = f"\nInstructions:\n{manager_additional_instructions}\n" if manager_additional_instructions else ""
        task_instructions = f"{manager_additional_instructions}\n**TASK**\n{task}\n"
        reflection_instructions = Agent(
            name="reflection_agent",
            goal=REFLECTION_AGENT_GOAL,
            detailed_prompt=f"{REFLECTION_AGENT_PROMPT}\n{task_instructions}\n",
            agent_responsibility="",
            expected_output="",
            tools=[],
            llm=None
        )
        return await self.register_agent(
            agent=reflection_instructions
        )


    async def get_agents_for_workflow(self, workflow: Workflow):
        agents = []
        tasks = []

        for agent_config in workflow.agents:

            # Register the agent
            agent_instance = await self.register_agent(
                agent_config,
            )
            agents.append(agent_instance)

            # Register the corresponding task
            task = await self.register_task(
                agent_config
            )
            tasks.append(task)

        return agents, tasks

    def get_process(self,process_type: str):
        match (process_type.lower()):
            case ExecutionTypeCrewAI.HIERARCHICAL.value:
                return Process.hierarchical
            case ExecutionTypeCrewAI.SEQUENTIAL.value:
                return Process.sequential
            case _:
                raise InvalidProcessTypeException(process_type=process_type)

    async def execute(self, workflow: Workflow, workflow_task: str):

        agents, tasks = await self.get_agents_for_workflow(workflow)
        reflection_agnet = await self.initialize_reflection(
            task=workflow_task,
            manager_additional_instructions=workflow.reflection_additional_instruction,
        )
        reflection_llm = CrewAILLMProvider().get_llm_instance(workflow.reflection_llm_config)

        crew = Crew(
            agents=agents,
            tasks=tasks,
            process=self.get_process(workflow.execution_type),
            verbose=True,
            manager_agent=reflection_agnet,
            manager_llm=reflection_llm
        )

        # Create and run the crew
        result = await crew.kickoff_async()

        return json.dumps(result.model_dump())
