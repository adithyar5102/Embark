from typing import List
from models.status_models.status import WorkflowItem

class StatusInterface:
    """
    Base interface for managing a list of WorkflowItems.
    """
    def __init__(self):
        self.status_items: List[WorkflowItem] = []

    def add_item(self, item: WorkflowItem):
        self.status_items.append(item)

    def get_status(self) -> List[WorkflowItem]:
        return self.status_items

    def update_item(self, item: WorkflowItem):
        for i, existing_item in enumerate(self.status_items):
            if existing_item.name == item.name:
                self.status_items[i] = item
                return

class WorkflowStatus(StatusInterface):
    """
    Manages the status of regular workflows.
    """
    pass

class CustomWorkflowStatus(StatusInterface):
    """
    Manages the status of custom workflows.
    """
    pass


# Instantiate and use them
workflow_status = WorkflowStatus()
custom_workflow_status = CustomWorkflowStatus()
