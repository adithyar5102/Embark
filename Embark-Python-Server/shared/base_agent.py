from abc import ABC, abstractmethod
from models.workflow_models.workflow import Agent
from contextlib import AsyncExitStack
from typing import Dict, List, Optional, Tuple, Union
from models.workflow_models.workflow import Stdio, Tool
from mcp import StdioServerParameters, ClientSession, stdio_client
from mcp.client.sse import sse_client

class BaseAgent(ABC):
    def __init__(self):
        self._tool_cache: Dict[Tuple[str, Union[str, None]], List] = {}

    @abstractmethod
    async def register_agent(self, agent: Agent):
        ...

    async def get_tools(self, tools: Optional[List[Tool]] = None) -> List:
        if tools is None:
            return []
        
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
    