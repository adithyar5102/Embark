from typing import List
from fastapi import APIRouter, HTTPException
from models.api_models.workflow import WorkflowModel, CustomWorkflowConfig
from services.custom_workflow_executor.custom_workflow_manager import CustomWorkflowManager
from services.workflow_executors.workflow_executor_manager import WorkflowExecutorManager
from services.workflow_executors.agent_executor import AgentExecutor
from core.datastore.datastore import custom_workflow_status, workflow_status
from models.status_models.status import WorkflowItem, WorkflowStatus

router = APIRouter()

@router.post("/workflow/")
async def execute_workflow(request: List[WorkflowModel]):

    """
    Execute a list of workflows using the specified agent execution framework.

    Args:
        request (List[WorkflowModel]): A list of workflow models containing workflow and task information.

    Returns:
        dict: Status message and the framework used for execution.

    Raises:
        HTTPException: If an error occurs during workflow execution.
    """
    try:
        for workflow in request:
            workflow_status.add_item(
                WorkflowItem(name=workflow.workflow.name, status=WorkflowStatus.SCHEDULED)
            )

        for current_workflow in request:
            workflow_status.update_item(
                WorkflowItem(name=current_workflow.workflow.name, status=WorkflowStatus.RUNNING)
            )
            framework = current_workflow.workflow.agent_execution_framework.lower()
            executor: AgentExecutor = await WorkflowExecutorManager.get_executor(framework=framework)
            await executor.execute(workflow=current_workflow.workflow, workflow_task=current_workflow.task)
            workflow_status.update_item(
                WorkflowItem(name=current_workflow.workflow.name, status=WorkflowStatus.COMPLETED)
            )
        return {"status": "Execution completed", "framework": framework}
    except HTTPException as http_exc:
        workflow_status.update_item(
            WorkflowItem(name=current_workflow.workflow.name, status=WorkflowStatus.FAILED)
        )
        raise http_exc
    except Exception as e:
        workflow_status.update_item(
            WorkflowItem(name=current_workflow.workflow.name, status=WorkflowStatus.FAILED)
        )
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")

@router.post("/custom-workflow/")
async def test(request: CustomWorkflowConfig):


    """
    Execute a custom workflow configuration.

    Args:
        request (CustomWorkflowConfig): Configuration for the custom workflow, including workflows,
                                        task, and sharing options.

    Returns:
        Any: The result of the custom workflow execution.
    """
    try:
        for workflow in request.workflows:
            custom_workflow_status.add_item(
                WorkflowItem(name=workflow.agent_config.name, status=WorkflowStatus.SCHEDULED)
            )
        custom_workflow_object = CustomWorkflowManager(request.workflows)
        result = await custom_workflow_object.execute_workflow(
            request.task, share_task_among_agents=request.share_task_among_agents
        )
        return result
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Custom workflow execution failed: {str(e)}")