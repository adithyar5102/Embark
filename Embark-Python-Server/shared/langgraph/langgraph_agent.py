from contextlib import AsyncExitStack
import json
from typing import Any, Dict, List, Optional, Tuple, Union

from mcp import StdioServerParameters, ClientSession, stdio_client
from mcp.client.sse import sse_client

from core.llm.agent_llm_providers.llm_provider_impl.langgraph_llm_config import LangGraphLLMProvider
from core.prompts.manager_prompt import REFLECTION_AGENT_PROMPT
from models.workflow_models.workflow import LLM, Agent, Stdio, Tool, Workflow

from langgraph.prebuilt import create_react_agent
from shared.base_agent import BaseAgent

class LangGraphAgent(BaseAgent):

    async def register_agent(self, agent: Agent, response_format: Optional[Any] = None):
        return create_react_agent(
            name=agent.name,
            response_format=response_format,
            model=LangGraphLLMProvider().get_llm_instance(llm=agent.llm),
            tools= await self.get_tools(agent.tools),
            prompt=f"""**Goal**: {agent.goal}.
{agent.detailed_prompt}

**Responsibilities**
{agent.agent_responsibility}

**Expected Output**
{agent.expected_output}
"""
        )