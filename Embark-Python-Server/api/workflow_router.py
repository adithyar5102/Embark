from typing import List
from fastapi import APIRouter, HTTPException

from services.custom_workflow_executor.custom_workflow_manager import CustomWorkflowManager
from modules.api_modules.workflow import WorkflowModel, CustomWorkflowConfig
from modules.workflow_modules.workflow import Workflow
from services.workflow_executors.executor_implementation.autogen_executor import AutogenExecutor
from services.workflow_executors.executor_implementation.crewai_executor import CrewAIExecutor
from services.workflow_executors.executor_implementation.langgraph_executor import LangGraphExecutor

router = APIRouter()

@router.post("/execute")
async def execute_workflow(request: List[WorkflowModel]):
    for current_workflow in request:
        framework = current_workflow.workflow.agent_execution_framework.lower()

        try:
            match framework:
                case "autogen":
                    await AutogenExecutor().execute(workflow=current_workflow.workflow, workflow_task=current_workflow.task)
                case "lang_graph":
                    await CrewAIExecutor().execute(workflow=current_workflow.workflow, workflow_task=current_workflow.task)
                case "crewai":
                    await LangGraphExecutor().execute(workflow=current_workflow.workflow, workflow_task=current_workflow.task)
                case _:
                    raise HTTPException(status_code=400, detail=f"Unsupported framework: {framework}")
        except Exception as e:
            # Log exception or handle specifically
            # status update
            raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

        # status update

    return {"status": "Execution completed", "framework": framework}

@router.post("/custom_workflow/execute")
async def test(request: CustomWorkflowConfig):
    custom_workflow_object = CustomWorkflowManager(request.workflows)
    result = await custom_workflow_object.execute_workflow(request.task)
    return result