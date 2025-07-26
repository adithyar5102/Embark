from contextlib import AsyncExitStack
from crewai import Agent, Crew, Process, Task
from crewai.llm import LLM
from typing import Any, Dict, List, Optional, Tuple, Union
from core.exception.workflow_execution_exception import InvalidProcessTypeException
from core.llm.llm_provider_impl.crewai_llm_config import CrewAILLMProvider
from modules.workflow_modules.workflow import ExecutionTypeCrewAI, Stdio, Tool
from modules.workflow_modules.workflow import Agent as WorkflowAgent
from mcp import StdioServerParameters, ClientSession, stdio_client
from mcp.client.sse import sse_client
from crewai_tools import MCPServerAdapter

class CrewAIAgent():
    def __init__(self):
        self._tool_cache: Dict[Tuple[str, Union[str, None]], List] = {}

    async def register_agent(self, agent: WorkflowAgent):
        return Agent(
            role=agent.name,
            goal=agent.goal,
            backstory=agent.detailed_prompt,
            llm=CrewAILLMProvider().get_llm_instance(llm=agent.llm),
            verbose=False,
            tools=self.get_tools(agent.tools)
        )

    async def register_task(self, agent: WorkflowAgent, response_format: Optional[Any] = None):
        return Task(
            description=agent.agent_responsibility,
            expected_output=agent.expected_output,
            agent=agent,
            output_pydantic=response_format
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
                # Create a hashable cache key for SSE
                cache_key = (
                    "sse",
                    stdio_sse_tool.connection.connection_url,
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
