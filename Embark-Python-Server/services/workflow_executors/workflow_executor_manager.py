from fastapi import HTTPException
from services.workflow_executors.executor_implementation.autogen_executor import AutogenExecutor
from services.workflow_executors.executor_implementation.crewai_executor import CrewAIExecutor
from services.workflow_executors.executor_implementation.langgraph_executor import LangGraphExecutor
from services.workflow_executors.agent_executor import AgentExecutor

class WorkflowExecutorManager():

    async def get_executor(framework: str):
        try:
            match framework:
                case "autogen":
                    return AutogenExecutor()
                case "lang_graph":
                    return CrewAIExecutor()
                case "crewai":
                    return LangGraphExecutor()
                case _:
                    raise HTTPException(status_code=400, detail=f"Unsupported framework: {framework}")
        except Exception as e:
            # Log exception or handle specifically
            # status update
            raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")