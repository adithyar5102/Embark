from typing import Optional


class InvalidProcessTypeException(Exception):
    """
    Exception raised when an invalid process type is provided.
    Valid types: 'sequential' or 'hierarchical'.
    """
    def __init__(self, process_type: str):
        super().__init__(f"Invalid process type: '{process_type}'. Must be 'sequential' or 'hierarchical'.")

class InvalidTeamTypeException(Exception):
    """
    Exception raised when an invalid team type is provided.
    Valid types: 'round_robin' or 'selector_group_chat'.
    """
    def __init__(self, process_type: str):
        super().__init__(f"Invalid process type: '{process_type}'. Must be 'round_robin' or 'selector_group_chat'.")

class InvalidJsonResponse():
    def __init__(self, error_message: Optional[str] = None):
        message = "The agent response does not follow the provided pydantic structure.\n"
        message += error_message if error_message else ""
        super().__init__(message)

class EntryPointNotFoundException():
    def __init__(self):
        message = "The Entry point for the execution workflow is missing.\n"
        super().__init__(message)

class CyclicWorkflowException():
    def __init__(self):
        message = "The workflow configuration consists a agent cycle.\n"
        super().__init__(message)

