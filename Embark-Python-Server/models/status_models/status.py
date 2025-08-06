
from pydantic import BaseModel
from enum import Enum

class WorkflowStatus(str, Enum):
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class WorkflowItem(BaseModel):
    name: str
    status: WorkflowStatus