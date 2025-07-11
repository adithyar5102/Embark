# src/research_crew/crew.py
from crewai import Agent, Crew, Process, Task
from crewai_tools import SerperDevTool
from typing import List, Optional
from Embark.core.prompts.manager_prompt import REFLECTION_PROMPT
from Embark.core.exception.workflow_execution_exception import InvalidProcessTypeException
from core.llm.llm_provider_impl.crewai_llm_config import CrewAILLMProvider
from modules.workflow_modules.workflow import ExecutionTypeCrewAI, Tool, Workflow, LLM
from modules.workflow_modules.workflow import Agent as WorkflowAgent
from services.agent_executors.executor import AgentExecutor
from crewai.tools.base_tool import BaseTool
from crewai.agents.agent_builder.base_agent import BaseAgent

class CrewAIExecutor(AgentExecutor):

    async def register_agent(self, agent: WorkflowAgent):
        return Agent(
            role=agent.name,
            goal=agent.goal,
            backstory=agent.detailed_prompt,
            llm=CrewAILLMProvider().get_llm_instance(agent.llm),
            verbose=False,
            tools=self.get_tools(agent.tools)
        )

    async def register_task(self, agent: WorkflowAgent):
        return Task(
            description=agent.agent_responsibility,
            expected_output=agent.expected_output,
            agent=agent,
        )
    
    def get_tools(self, tools: Optional[List[Tool]] = []):
        pass

    async def initialize_reflection(self, task: str, manager_additional_instructions: Optional[str]):
        manager_additional_instructions = f"\nInstructions:\n{manager_additional_instructions}\n" if manager_additional_instructions else ""
        task_instructions = f"{manager_additional_instructions}\n**TASK**\n{task}\n"
        reflection_instructions = WorkflowAgent(
            name="reflection_agent",
            goal="You are a reflection agent responsible for overseeing the execution and ensuring the task is executed efficiently.",
            detailed_prompt=f"{REFLECTION_PROMPT}\n{task_instructions}",
            agent_responsibility="",
            expected_output="",
            tools=[],
            llm=None
        )
        return await self.register_agent(
            agent=reflection_instructions
        )


    async def get_agents_for_workflow(self, workflow: Workflow):
        agents = []
        tasks = []

        for agent_config in workflow.agents:
            # Convert Tool to BaseTool, assuming a conversion function or class exists
            base_tools = [self.get_tool(tool) for tool in agent_config.tools]

            # Register the agent
            agent_instance = await self.register_agent(
                agent_config,
                base_tools
            )
            agents.append(agent_instance)

            # Register the corresponding task
            task = await self.register_task(
                agent_config
            )
            tasks.append(task)

        return agents, tasks

    def get_process(self,process_type: str):
        match (process_type.lower()):
            case ExecutionTypeCrewAI.HIERARCHICAL.value:
                return Process.hierarchical
            case ExecutionTypeCrewAI.SEQUENTIAL.value:
                return Process.sequential
            case _:
                raise InvalidProcessTypeException(process_type=process_type)

    async def execute(self, workflow: Workflow, workflow_task: str):

        agents, tasks = await self.get_agents_for_workflow(workflow)
        reflection_agnet = await self.initialize_reflection(
            task=workflow_task,
            manager_additional_instructions=workflow.reflection_additional_instruction
        )
        reflection_llm = CrewAILLMProvider().get_llm_instance(workflow.reflection_llm_config)

        crew = Crew(
            agents=agents,
            tasks=tasks,
            process=self.get_process(workflow.execution_type),
            verbose=True,
            manager_agent=reflection_agnet,
            manager_llm=reflection_llm
        )

        # Create and run the crew
        result = await crew.kickoff_async()

        return result

# class ResearchCrew():
#     """Research crew for comprehensive topic analysis and reporting"""

#     def researcher(self) -> Agent:
#         return Agent(
#             role="Senior Research Specialist for {topic}",
#             goal="Find comprehensive and accurate information about {topic} with a focus on recent developments and key insights",
#             backstory="You are an experienced research specialist with a talent for finding relevant information from various sources. You excel at organizing information in a clear and structured manner, making complex topics accessible to others.",
#             llm=self.llm,  # Replace with your actual LLM provider/model-id
#             verbose=True,
#             tools=[SerperDevTool()]
#         )

#     def analyst(self) -> Agent: # Changed to analyst based on your YAML
#         return Agent(
#             role="Data Analyst and Report Writer for {topic}",
#             goal="Analyze research findings and create a comprehensive, well-structured report that presents insights in a clear and engaging way",
#             backstory="You are a skilled analyst with a background in data interpretation and technical writing. You have a talent for identifying patterns and extracting meaningful insights from research data, then communicating those insights effectively through well-crafted reports.",
#             llm=self.llm,  # Replace with your actual LLM provider/model-id
#             verbose=True,
#             # You might want different tools for the analyst, or none if their role is purely analytical
#             # For now, keeping SerperDevTool as an example, but you should adjust this.
#             tools=[SerperDevTool()]
#         )

#     def research_task(self) -> Task:
#         return Task(
#             description="""
#             Conduct thorough research on {topic}. Focus on:
#             1. Key concepts and definitions
#             2. Historical development and recent trends
#             3. Major challenges and opportunities
#             4. Notable applications or case studies
#             5. Future outlook and potential developments

#             Make sure to organize your findings in a structured format with clear sections.
#             """,
#             expected_output="""
#             A comprehensive research document with well-organized sections covering
#             all the requested aspects of {topic}. Include specific facts, figures,
#             and examples where relevant.
#             """,
#             agent=self.researcher(),
#         )

#     def analysis_task(self) -> Task:
#         return Task(
#             description="""
#             Analyze the research findings and create a comprehensive report on {topic}.
#             Your report should:
#             1. Begin with an executive summary
#             2. Include all key information from the research
#             3. Provide insightful analysis of trends and patterns
#             4. Offer recommendations or future considerations
#             5. Be formatted in a professional, easy-to-read style with clear headings
#             """,
#             expected_output="""
#             A polished, professional report on {topic} that presents the research
#             findings with added analysis and insights. The report should be well-structured
#             with an executive summary, main sections, and conclusion.
#             """,
#             agent=self.analyst(),
#             context=[self.research_task()], # Assuming self.research_task() refers to the output of the research_task
#         )

#     def crew(self) -> Crew:
#         """Creates the research crew"""
#         return Crew(
#             agents=[self.researcher(), self.analyst()],
#             tasks=[self.research_task(), self.analysis_task()],
#             process=Process.sequential,
#             verbose=True,
#         )

# def run():
#     """
#     Run the research crew.
#     """
#     inputs = {
#         'topic': 'Artificial Intelligence in Healthcare'
#     }

#     # Create and run the crew
#     result = ResearchCrew().crew().kickoff(inputs=inputs)

#     # Print the result
#     print("\n\n=== FINAL REPORT ===\n\n")
#     print(result.raw)

#     print("\n\nReport has been saved to output/report.md")


# if __name__ == "__main__":
#     run()