# src/research_crew/crew.py
import json
from crewai import Agent, Crew, Process, Task
from typing import Dict, List, Optional, Tuple, Union
from shared.crewai.crewai_agent import CrewAIAgent
from core.prompts.manager_prompt import REFLECTION_AGENT_GOAL, REFLECTION_AGENT_PROMPT
from core.exception.workflow_execution_exception import InvalidProcessTypeException
from core.llm.llm_provider_impl.crewai_llm_config import CrewAILLMProvider
from modules.workflow_modules.workflow import ExecutionTypeCrewAI, Stdio, Tool, Workflow, LLM
from modules.workflow_modules.workflow import Agent as WorkflowAgent
from services.workflow_executors.agent_executor import AgentExecutor
from crewai.tools.base_tool import BaseTool
from crewai.agents.agent_builder.base_agent import BaseAgent
from mcp import StdioServerParameters
from crewai_tools import MCPServerAdapter

class CrewAIExecutor(AgentExecutor):

    def __init__(self):
        self.crewai_agent_instance = CrewAIAgent()

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
        return await self.crewai_agent_instance.register_agent(
            agent=reflection_instructions
        )


    async def get_agents_for_workflow(self, workflow: Workflow):
        agents = []
        tasks = []

        for agent_config in workflow.agents:

            # Register the agent
            agent_instance = await self.crewai_agent_instance.register_agent(
                agent_config,
            )
            agents.append(agent_instance)

            # Register the corresponding task
            task = await self.crewai_agent_instance.register_task(
                agent_config
            )
            tasks.append(task)

        return agents, tasks

    async def execute(self, workflow: Workflow, workflow_task: str):

        agents, tasks = await self.get_agents_for_workflow(workflow)
        reflection_agnet = await self.initialize_reflection(
            task=workflow_task,
            manager_additional_instructions=workflow.reflection_additional_instruction,
        )
        reflection_llm = CrewAILLMProvider().get_llm_instance(workflow.reflection_llm_config)
        
        crew_ai_process_type = await self.crewai_agent_instance.get_process(workflow.execution_type)

        crew = await self.crewai_agent_instance.get_crew(
            agents=agents,
            tasks=tasks,
            crew_ai_process_type=crew_ai_process_type,
            manager_agent=reflection_agnet,
            manager_llm=reflection_llm
        )

        # Create and run the crew
        result = await crew.kickoff_async()

        return result
