class InvalidLLMProviderError(Exception):
    """Exception raised when an invalid LLM provider is encountered."""

    def __init__(self, message="Provider is not valid or does not exist"):
        self.message = message
        super().__init__(self.message)