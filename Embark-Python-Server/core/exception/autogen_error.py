class UnsupportedAutogenStructuredResponseError(NotImplementedError):
    def __init__(self, num_tools: int = 0):
        message = (
            "Structured or formatted responses with tool calls are not yet supported "
            "in the current version of the AutoGen framework. "
            f"Detected {num_tools} tool(s) provided. This feature is planned for a future release."
        )
        super().__init__(message)
