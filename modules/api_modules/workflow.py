from pydantic import BaseModel

from modules.workflow_modules.workflow import Workflow

class WorkflowModel(BaseModel):
    workflow: Workflow
    task: str