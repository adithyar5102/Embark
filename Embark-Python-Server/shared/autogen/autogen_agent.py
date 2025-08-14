from typing import Any, Dict, List, Optional, Tuple, Union
from core.exception.autogen_error import UnsupportedAutogenStructuredResponseError
from core.exception.workflow_execution_exception import InvalidTeamTypeException
from core.llm.agent_llm_providers.llm_provider_impl.autogen_llm_config import AutogenLLMProvider
from models.workflow_models.workflow import Agent, Stdio, Tool
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import TextMentionTermination
from autogen_agentchat.teams import RoundRobinGroupChat, SelectorGroupChat
from autogen_ext.tools.mcp import StdioServerParams, mcp_server_tools, SseServerParams
from shared.base_agent import BaseAgent

class AutogenAgent(BaseAgent):

    async def register_agent(self, agent: Agent):            
        return AssistantAgent(
            name=agent.name,
            model_client=AutogenLLMProvider().get_llm_instance(agent.llm),
            tools=await self.get_tools(agent.tools),
            description=agent.goal,
            system_message=f"{agent.detailed_prompt}\n\n**Your Responsibility**\n\n{agent.agent_responsibility}\n\n**Expected Output**\n\n{agent.expected_output}",
            reflect_on_tool_use=True,
            model_client_stream=False,  # Enable streaming tokens from the model client.
        )    
    
    def get_team(self, agents: List[AssistantAgent], execution_type: str):
        text_termination = TextMentionTermination("TERMINATE")
        match execution_type.lower():
            case "round_robin":
                return RoundRobinGroupChat(agents, termination_condition=text_termination)
            case "selector_group_chat":
                return SelectorGroupChat(agents, termination_condition=text_termination)
            case _:
                raise InvalidTeamTypeException(execution_type)