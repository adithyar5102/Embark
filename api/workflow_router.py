from fastapi import APIRouter, HTTPException

from modules.api_modules.workflow import WorkflowModel
from modules.workflow_modules.custom_workflow import CustomWorkflowConfig
from modules.workflow_modules.workflow import Workflow
from services.workflow_executors.executor_implementation.autogen_executor import AutogenExecutor
from services.workflow_executors.executor_implementation.crewai_executor import CrewAIExecutor
from services.workflow_executors.executor_implementation.langgraph_executor import LangGraphExecutor

router = APIRouter()

@router.post("/execute")
async def execute_workflow(request: WorkflowModel):
    framework = request.workflow.agent_execution_framework.lower()

    try:
        match framework:
            case "autogen":
                await AutogenExecutor().execute(workflow=request.workflow, workflow_task=request.task)
            case "lang_graph":
                await CrewAIExecutor().execute(workflow=request.workflow, workflow_task=request.task)
            case "crewai":
                await LangGraphExecutor().execute(workflow=request.workflow, workflow_task=request.task)
            case _:
                raise HTTPException(status_code=400, detail=f"Unsupported framework: {framework}")
    except Exception as e:
        # Log exception or handle specifically
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

    return {"status": "Execution started", "framework": framework}
