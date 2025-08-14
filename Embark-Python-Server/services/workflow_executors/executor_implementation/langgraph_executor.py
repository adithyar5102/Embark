from contextlib import AsyncExitStack
import json
from typing import Dict, List, Optional, Tuple, Union

from mcp import StdioServerParameters, ClientSession, stdio_client
from mcp.client.sse import sse_client

from shared.langgraph.langgraph_agent import LangGraphAgent
from core.llm.agent_llm_providers.llm_provider_impl.langgraph_llm_config import LangGraphLLMProvider
from core.prompts.manager_prompt import REFLECTION_AGENT_PROMPT
from models.workflow_models.workflow import LLM, Agent, Stdio, Tool, Workflow
from services.workflow_executors.agent_executor import AgentExecutor

from langgraph.prebuilt import create_react_agent

class LangGraphExecutor(AgentExecutor):
    def __init__(self):
        self.langgraph_agent_instance = LangGraphAgent()
        raise NotImplementedError("LangGraphExecutor is not fully implemented yet.")

    async def initialize_reflection(self, manager_additional_instructions: Optional[str], llm: LLM, tools: List):
        manager_additional_instructions = f"\nInstructions:\n{manager_additional_instructions}\n" if manager_additional_instructions else ""
        return create_react_agent(
            model=LangGraphLLMProvider().get_llm_instance(llm=llm),
            tools=tools,
            prompt=f"{REFLECTION_AGENT_PROMPT}\n{manager_additional_instructions}\n"
        )
        
    async def get_agents_for_workflow(self, workflow: Workflow):
        agents = []

        for agent_config in workflow.agents:

            # Register the agent
            agent_instance = await self.langgraph_agent_instance.register_agent(
                agent_config,
            )
            agents.append(agent_instance)

        return agents

    async def execute(self, workflow: Workflow, workflow_task: str):
        agents = await self.get_agents_for_workflow(workflow)
        reflection_agent = await self.initialize_reflection(
            manager_additional_instructions=workflow.reflection_additional_instruction,
            llm=workflow.reflection_llm_config,
            tools=agents
        )
        input = {
            "messages": [
                {
                    "role": "user",
                    "content": workflow_task
                }
            ]
        }
        result = await reflection_agent.ainvoke(
            input=input
        )

        return result