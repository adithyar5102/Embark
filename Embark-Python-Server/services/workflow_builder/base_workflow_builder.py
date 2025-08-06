from abc import ABC, abstractmethod

class BaseWorkflowBuilder(ABC):
    @abstractmethod
    async def build(requirements: str):
        ...
