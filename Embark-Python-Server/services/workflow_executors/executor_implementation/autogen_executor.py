from typing import Optional
from core.prompts.manager_prompt import REFLECTION_AGENT_EXPECTED_OUTPUT, REFLECTION_AGENT_GOAL, REFLECTION_AGENT_PROMPT, REFLECTION_AGENT_RESPONSIBILITY
from models.workflow_models.workflow import LLM, Agent, Workflow
from services.workflow_executors.agent_executor import AgentExecutor
from shared.autogen.autogen_agent import AutogenAgent

class AutogenExecutor(AgentExecutor):
    def __init__(self):
        self.autogen_agent_instance = AutogenAgent()
    
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
        return await self.autogen_agent_instance.register_agent(
            agent=reflection_instructions
        )
    
    async def get_agents_for_workflow(self, workflow: Workflow):
        agents = []

        for agent_config in workflow.agents:

            # Register the agent
            agent_instance = await self.autogen_agent_instance.register_agent(
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
        agents.append(reflection_agent)

        team = self.autogen_agent_instance.get_team(
            agents,
            workflow.execution_type
        )

        result = await team.run(task=workflow_task)

        return str(result)