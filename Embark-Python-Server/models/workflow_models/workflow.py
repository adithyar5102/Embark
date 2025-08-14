from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, Field, model_validator

class LLM(BaseModel):
    model: str = Field(..., json_schema_extra={"description": "Name of the language model"})
    provider: str = Field(..., json_schema_extra={"description": "Provider of the LLM, e.g., OpenAI, Anthropic"})
    top_probability: float = Field(..., ge=0.0, le=1.0, json_schema_extra={"description": "Top probability sampling value"})
    temperature: float = Field(..., ge=0.0, le=1.0, json_schema_extra={"description": "Sampling temperature"})
    max_tokens: int = Field(..., gt=0, json_schema_extra={"description": "Maximum number of tokens to generate"})

class Stdio(BaseModel):
    command: str = Field(..., json_schema_extra={"description": "Shell or script command to execute"})
    arguments: List[str] = Field(..., json_schema_extra={"description": "List of arguments passed to the command"})

class Sse(BaseModel):
    connection_url: str = Field(..., json_schema_extra={"description": "URL for SSE (Server-Sent Events) connection"})
    bearer_token: Optional[str] = Field(..., json_schema_extra={"description": "Bearer token for sse server authentication"})

class Tool(BaseModel):
    name: str = Field(..., json_schema_extra={"description": "Name of the tool"})
    connection: Union[Stdio, Sse] = Field(..., json_schema_extra={"description": "Tool connection method"})

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

class ExecutionTypeLanggraph(str, Enum):
    SUPERVISOR = "supervisor"
    
class Agent(BaseModel):
    name: str = Field(..., json_schema_extra={"description": "Name of the agent"})
    goal: str = Field(..., json_schema_extra={"description": "Primary goal of the agent"})
    detailed_prompt: str = Field(..., json_schema_extra={"description": "Prompt template or instructions for the agent"})
    agent_responsibility: str = Field(..., json_schema_extra={"description": "Specific responsibilities assigned to the agent"})
    expected_output: str = Field(..., json_schema_extra={"description": "Expected output format or structure"})
    stream_output: bool = False
    tools: List[Tool] = []
    llm: LLM

class Workflow(BaseModel):
    name: str = Field(..., json_schema_extra={"description": "Name of the workflow"})
    description: str = Field(..., json_schema_extra={"description": "Detailed description of the workflow"})
    agents: List[Agent] = Field(..., json_schema_extra={"description": "List of agents participating in the workflow"})
    agent_execution_framework: AgentFrameworks = Field(..., json_schema_extra={"description": "Framework used to run the agents"})
    execution_type: str = Field(None, json_schema_extra={"description": "Execution strategy depending on the framework"})
    reflection_additional_instruction: Optional[str]
    reflection_llm_config: LLM

    @model_validator(mode='after')
    def validate_execution_type(self):
        framework = self.agent_execution_framework
        execution_type = self.execution_type

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
        elif framework_value == "langgraph":
            valid_types = {e.value for e in ExecutionTypeLanggraph}
        else:
            valid_types = set()

        if valid_types and execution_type not in valid_types:
            raise ValueError(
                f"Invalid execution_type '{execution_type}' for framework '{framework_value}'. "
                f"Valid types: {sorted(valid_types)}"
            )

        return self
