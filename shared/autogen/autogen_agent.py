from typing import Any, Dict, List, Optional, Tuple, Union
from core.exception.autogen_error import UnsupportedAutogenStructuredResponseError
from core.exception.workflow_execution_exception import InvalidTeamTypeException
from core.llm.llm_provider_impl.autogen_llm_config import AutogenLLMProvider
from modules.workflow_modules.workflow import Agent, Stdio, Tool
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import TextMentionTermination
from autogen_agentchat.teams import RoundRobinGroupChat, SelectorGroupChat
from autogen_ext.tools.mcp import StdioServerParams, mcp_server_tools, SseServerParams

class AutogenAgent():
    def __init__(self):
        self._tool_cache: Dict[Tuple[str, Union[str, None]], List] = {}

    async def register_agent(self, agent: Agent, response_format: Optional[Any] = None):
        if response_format is not None and agent.tools is None:
            return AssistantAgent(
                name=agent.name,
                model_client=AutogenLLMProvider().get_llm_instance(agent.llm),
                description=agent.goal,
                system_message=f"{agent.detailed_prompt}\n\n**Your Responsibility**\n\n{agent.agent_responsibility}\n\n**Expected Output**\n\n{agent.expected_output}",
                reflect_on_tool_use=False, # False for Formatted response
                model_client_stream=False,  # Enable streaming tokens from the model client.
                output_content_type=response_format # Expects a Pydantic model
            )    
        elif response_format is not None and agent.tools is not None:
            raise UnsupportedAutogenStructuredResponseError(len(agent.tools))
            
        return AssistantAgent(
            name=agent.name,
            model_client=AutogenLLMProvider().get_llm_instance(agent.llm),
            tools=await self.get_tools(agent.tools),
            description=agent.goal,
            system_message=f"{agent.detailed_prompt}\n\n**Your Responsibility**\n\n{agent.agent_responsibility}\n\n**Expected Output**\n\n{agent.expected_output}",
            reflect_on_tool_use=True,
            model_client_stream=False,  # Enable streaming tokens from the model client.
        )    
    
    async def get_tools(self, tools: Optional[List[Tool]] = []) -> List[Tool]:
        tools_list = []

        for stdio_sse_tool in tools:
            cache_key = None
            tools_result = None

            if isinstance(stdio_sse_tool.connection, Stdio):
                stdio_server_params = StdioServerParams(
                    command=stdio_sse_tool.connection.command,
                    args=stdio_sse_tool.connection.arguments,
                    read_timeout_seconds=60 * 5 # wait for 5 min
                )

                # Create a hashable cache key for stdio
                cache_key = ("stdio", stdio_server_params.command, tuple(stdio_server_params.args))

            else:
                if stdio_sse_tool.connection.bearer_token:
                    headers={"Authorization": f"Bearer {stdio_sse_tool.connection.bearer_token}"}
                else:
                    headers=None
                
                sse_server_params = SseServerParams(
                    url=stdio_sse_tool.connection.connection_url,
                    headers=headers
                )

                # Create a hashable cache key for SSE
                cache_key = (
                    "sse",
                    sse_server_params.url
                )

            # Check the cache
            if cache_key in self._tool_cache:
                tools_result = self._tool_cache[cache_key]
            else:
                if isinstance(stdio_sse_tool.connection, Stdio):
                    tools_result = await mcp_server_tools(stdio_server_params)
                else:
                    tools_result = await mcp_server_tools(sse_server_params)
                self._tool_cache[cache_key] = tools_result

            for tool in tools_result:
                if tool.name == stdio_sse_tool.name:
                    tools_list.append(tool)

        return tools_list
    
    def get_team(agents: List[AssistantAgent], execution_type: str):
        text_termination = TextMentionTermination("TERMINATE")
        match execution_type.lower():
            case "round_robbin":
                return RoundRobinGroupChat(agents, termination_condition=text_termination)
            case "selector_group_chat":
                return SelectorGroupChat(agents, termination_condition=text_termination)
            case _:
                raise InvalidTeamTypeException(execution_type)