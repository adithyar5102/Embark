
from fastapi import APIRouter
from core.datastore.datastore import custom_workflow_status, workflow_status
from models.status_models.status import WorkflowItem

execution_status_router = APIRouter()

@execution_status_router.get("/workflow/")
async def get_execution_status() -> list[WorkflowItem]:
    return workflow_status.get_status()

@execution_status_router.get("/custom-workflow/")
async def get_custom_workflow_status() -> list[WorkflowItem]:
    return custom_workflow_status.get_status()
