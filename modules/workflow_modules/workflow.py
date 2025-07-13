from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, Field, model_validator

class LLM(BaseModel):
    model: str = Field(..., description="Name of the language model")
    provider: str = Field(..., description="Provider of the LLM, e.g., OpenAI, Anthropic")
    top_probability: float = Field(..., ge=0.0, le=1.0, description="Top probability sampling value")
    temperature: float = Field(..., ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: int = Field(..., gt=0, description="Maximum number of tokens to generate")

class Stdio(BaseModel):
    command: str = Field(..., description="Shell or script command to execute")
    arguments: List[str] = Field(..., description="List of arguments passed to the command")

class Sse(BaseModel):
    connection_url: str = Field(..., description="URL for SSE (Server-Sent Events) connection")
    bearer_token: str = Field(..., description="Bearer token for sse server authentication")

class Tool(BaseModel):
    name: str = Field(..., description="Name of the tool")
    connection: Union[Stdio, Sse] = Field(..., description="Tool connection method")

class AgentFrameworks(str, Enum):
    AUTOGEN = "autogen"
    LANGGRAPH = "langgraph"
    CREWAI = "crewai"

class ExecutionTypeAutogen(str, Enum):
    ROUND_ROBIN = "round_robin"
    SUPERVISOR = "supervisor"

class ExecutionTypeCrewAI(str, Enum):
    HIERARCHICAL = "hierarchical"
    SEQUENTIAL = "sequential"

class Agent(BaseModel):
    name: str = Field(..., description="Name of the agent")
    goal: str = Field(..., description="Primary goal of the agent")
    detailed_prompt: str = Field(..., description="Prompt template or instructions for the agent")
    agent_responsibility: str = Field(..., description="Specific responsibilities assigned to the agent")
    expected_output: str = Field(..., description="Expected output format or structure")
    stream_output: bool = Field(..., description="Enable if the agent conversation need to be streamed")
    tools: Optional[List[Tool]]
    llm: LLM

class Workflow(BaseModel):
    name: str = Field(..., description="Name of the workflow")
    description: str = Field(..., description="Detailed description of the workflow")
    agents: List[Agent] = Field(..., description="List of agents participating in the workflow")
    agent_execution_framework: AgentFrameworks = Field(..., description="Framework used to run the agents")
    execution_type: str = Field(None, description="Execution strategy depending on the framework")
    reflection_additional_instruction: Optional[str]
    reflection_llm_config: LLM

    @model_validator
    def validate_execution_type(cls, values):
        framework = values.get("agent_execution_framework")
        execution_type = values.get("execution_type")

        # Normalize to enum string values
        if isinstance(framework, AgentFrameworks):
            framework_value = framework.value
        else:
            framework_value = str(framework).lower()

        # Validate execution_type based on framework
        if framework_value == "autogen":
            valid_types = {e.value for e in ExecutionTypeAutogen}
        elif framework_value == "crewai":
            valid_types = {e.value for e in ExecutionTypeCrewAI}
        else:
            valid_types = set()

        if valid_types and execution_type not in valid_types:
            raise ValueError(
                f"Invalid execution_type '{execution_type}' for framework '{framework_value}'. "
                f"Valid types: {sorted(valid_types)}"
            )

        return values