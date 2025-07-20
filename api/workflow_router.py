from fastapi import APIRouter, HTTPException

from modules.workflow_modules.custom_workflow import CustomWorkflowConfig
from modules.workflow_modules.workflow import Workflow
from services.workflow_executors.executor_implementation.autogen_executor import AutogenExecutor
from services.workflow_executors.executor_implementation.crewai_executor import CrewAIExecutor
from services.workflow_executors.executor_implementation.langgraph_executor import LangGraphExecutor

router = APIRouter()

@router.post("/execute")
async def execute_workflow(workflow: Workflow, task: str):
    framework = workflow.agent_execution_framework.lower()

    try:
        match framework:
            case "autogen":
                await AutogenExecutor().execute(workflow=workflow, workflow_task=task)
            case "lang_graph":
                await CrewAIExecutor().execute(workflow=workflow, workflow_task=task)
            case "crewai":
                await LangGraphExecutor().execute(workflow=workflow, workflow_task=task)
            case _:
                raise HTTPException(status_code=400, detail=f"Unsupported framework: {framework}")
    except Exception as e:
        # Log exception or handle specifically
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

    return {"status": "Execution started", "framework": framework}
