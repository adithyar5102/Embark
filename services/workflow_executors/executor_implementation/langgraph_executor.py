from contextlib import AsyncExitStack
import json
from typing import Dict, List, Optional, Tuple, Union

from mcp import StdioServerParameters, ClientSession, stdio_client
from mcp.client.sse import sse_client

from core.llm.llm_provider_impl.langgraph_llm_config import LangGraphLLMProvider
from core.prompts.manager_prompt import REFLECTION_AGENT_PROMPT
from modules.workflow_modules.workflow import LLM, Agent, Stdio, Tool, Workflow
from services.workflow_executors.executor import AgentExecutor

from langgraph.prebuilt import create_react_agent

class LangGraphExecutor(AgentExecutor):
    def __init__(self):
        self._tool_cache: Dict[Tuple[str, Union[str, None]], List] = {}

    async def register_agent(self, agent: Agent):
        return create_react_agent(
            model=LangGraphLLMProvider().get_llm_instance(llm=agent.llm),
            tools=self.get_tools(agent.tools),
            name=agent.name,
            prompt=f"""**Goal**: {agent.goal}.
{agent.detailed_prompt}

**Responsibilities**
{agent.agent_responsibility}

**Expected Output**
{agent.expected_output}
"""
        )
    
    async def initialize_reflection(self, manager_additional_instructions: Optional[str], llm: LLM, tools: List):
        manager_additional_instructions = f"\nInstructions:\n{manager_additional_instructions}\n" if manager_additional_instructions else ""
        return create_react_agent(
            model=LangGraphLLMProvider().get_llm_instance(llm=llm),
            tools=tools,
            prompt=f"{REFLECTION_AGENT_PROMPT}\n{manager_additional_instructions}\n"
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
                if isinstance(stdio_sse_tool.connection, Stdio):
                    exit_stack = AsyncExitStack()
                    stdio_transport = await exit_stack.enter_async_context(
                        stdio_client(server_params)
                    )
                    stdio, write = stdio_transport
                    session = await exit_stack.enter_async_context(ClientSession(stdio, write))
                    await session.initialize()

                    result = await session.list_tools()
                    tools_result = result.tools
                    self._tool_cache[cache_key] = tools_result
                    await exit_stack.aclose()
                else:
                    exit_stack = AsyncExitStack()
                    streams_context = sse_client(url=stdio_sse_tool.connection.connection_url)
                    streams = await streams_context.__aenter__()
                    session_context = ClientSession(*streams)
                    session = await session_context.__aenter__()
                    await session.initialize()

                    result = await session.list_tools()
                    tools_result = result.tools
                    self._tool_cache[cache_key] = tools_result

                    await session_context.__aexit__()
                    await streams_context.__aexit__()


            for tool in tools_result:
                if tool.name == stdio_sse_tool.name:
                    tools_list.append(tool)

        return tools_list

    async def get_agents_for_workflow(self, workflow: Workflow):
        agents = []

        for agent_config in workflow.agents:

            # Register the agent
            agent_instance = await self.register_agent(
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

        return json.dumps(result)