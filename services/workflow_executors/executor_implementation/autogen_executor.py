from typing import Dict, List, Optional, Tuple, Union
from core.exception.workflow_execution_exception import InvalidTeamTypeException
from core.llm.llm_provider_impl.autogen_llm_config import AutogenLLMProvider
from core.prompts.manager_prompt import REFLECTION_AGENT_EXPECTED_OUTPUT, REFLECTION_AGENT_GOAL, REFLECTION_AGENT_PROMPT, REFLECTION_AGENT_RESPONSIBILITY
from modules.workflow_modules.workflow import LLM, Agent, Stdio, Tool, Workflow
from services.workflow_executors.executor import AgentExecutor
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import TextMentionTermination
from autogen_agentchat.teams import RoundRobinGroupChat, SelectorGroupChat
from autogen_ext.tools.mcp import StdioServerParams, mcp_server_tools, SseServerParams

class AutogenExecutor(AgentExecutor):
    def __init__(self):
        self._tool_cache: Dict[Tuple[str, Union[str, None]], List] = {}

    async def register_agent(self, agent: Agent):
        return AssistantAgent(
            name=agent.name,
            model_client=AutogenLLMProvider().get_llm_instance(agent.llm),
            tools=self.get_tools(agent.tools),
            description=agent.goal,
            system_message=f"{agent.detailed_prompt}\n\n**Your Responsibility**\n\n{agent.agent_responsibility}\n\n**Expected Output**\n\n{agent.expected_output}",
            reflect_on_tool_use=True,
            model_client_stream=False,  # Enable streaming tokens from the model client.
        )
    
    async def initialize_reflection(self, manager_additional_instructions: Optional[str], llm: LLM):
        manager_additional_instructions = f"\nInstructions:\n{manager_additional_instructions}\n" if manager_additional_instructions else ""
        reflection_instructions = Agent(
            name="reflection_agent",
            goal=REFLECTION_AGENT_GOAL,
            detailed_prompt=f"{REFLECTION_AGENT_PROMPT}\n{manager_additional_instructions}\n",
            agent_responsibility=REFLECTION_AGENT_RESPONSIBILITY,
            expected_output=REFLECTION_AGENT_EXPECTED_OUTPUT,
            tools=[],
            llm=llm
        )
        return await self.register_agent(
            agent=reflection_instructions
        )
    
    def get_team(agents: List[AssistantAgent], execution_type: str):
        text_termination = TextMentionTermination("TERMINATE")
        match execution_type.lower():
            case "round_robbin":
                return RoundRobinGroupChat(agents, termination_condition=text_termination)
            case "selector_group_chat":
                return SelectorGroupChat(agents, termination_condition=text_termination)
            case _:
                raise InvalidTeamTypeException(execution_type)
    
    async def get_tools(self, tools: Optional[List[Tool]] = []) -> List[Tool]:
        tools_list = []

        for stdio_sse_tool in tools:
            cache_key = None
            tools_result = None

            if isinstance(stdio_sse_tool.connection, Stdio):
                stdio_server_params = StdioServerParams(
                    command=stdio_sse_tool.connection.command,
                    args=stdio_sse_tool.connection.arguments,
                )

                # Create a hashable cache key for stdio
                cache_key = ("stdio", stdio_server_params.command, tuple(stdio_server_params.args))

            else:
                sse_server_params = SseServerParams(
                    url=stdio_sse_tool.connection.connection_url,
                    headers={"Authorization": f"Bearer {stdio_sse_tool.connection.bearer_token}"}
                )

                # Create a hashable cache key for SSE
                cache_key = (
                    "sse",
                    sse_server_params.url,
                    sse_server_params.headers.get("Authorization")
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
            llm=workflow.reflection_llm_config
        )
        agents.extend(reflection_agent)

        team = self.get_team(workflow.execution_type)

        result = await team.run(task=workflow_task)

        return str(result)