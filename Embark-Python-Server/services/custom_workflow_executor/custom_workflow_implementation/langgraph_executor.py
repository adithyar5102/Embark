
from typing import Any
from shared.langgraph.langgraph_agent import LangGraphAgent
from services.custom_workflow_executor.custom_agent_executor import CustomAgentExecutor
from modules.workflow_modules.workflow import Agent

class LangGraphExecutor(CustomAgentExecutor):
    def __init__(self):
        self.lang_graph_agent_instance = LangGraphAgent()
    
    async def execute(self, agent: Agent, response_format: Any, task_message: str):
        lang_graph_agent = await self.lang_graph_agent_instance.register_agent(
            agent=agent,
            response_format=response_format
        )

        message = {
            "message": task_message
        }
        
        result = await lang_graph_agent.ainvoke(
            input=message
        )

        return result["structured_response"]
