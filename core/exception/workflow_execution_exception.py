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
    Valid types: 'round_robbin' or 'selector_group_chat'.
    """
    def __init__(self, process_type: str):
        super().__init__(f"Invalid process type: '{process_type}'. Must be 'round_robbin' or 'selector_group_chat'.")
