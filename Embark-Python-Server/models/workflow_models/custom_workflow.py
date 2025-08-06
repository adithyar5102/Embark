from typing import List, Optional, Union, Any
from pydantic import BaseModel, model_validator, ValidationError
from models.workflow_models.workflow import Agent, AgentFrameworks
from shared.constants import VALID_TYPES

"""
Sample configuration for CustomWorkflowConfig defining a multi-agent workflow.

This JSON defines a workflow with two agents, including all required and optional fields
validated by the Pydantic model. It demonstrates a valid setup for an agent-based
execution pipeline where agents pass structured responses and invoke child agents conditionally.

Structure Overview:
-------------------
- `workflows` (List[CustomWorkflowAgentConfig]):
    A list of agents participating in the workflow. Each agent defines its own behavior,
    communication format, and linkage to other agents.

Agent Fields:
-------------
- `agent_config` (Agent):
    - `name` (str): Unique name for the agent.
    - `goal` (str): The high-level purpose of the agent.
    - `detailed_prompt` (str): Instructional prompt guiding the agent's behavior.
    - `agent_responsibility` (str): Specific task assigned to this agent.
    - `expected_output` (str): Human-readable description of the expected output.
    - `stream_output` (bool): Whether to stream the agent's output in real-time.
    - `tools` (Optional[List[Tool]]): Tools available to the agent.
        - Each tool includes:
            - `name` (str): Identifier for the tool.
            - `connection` (Union[Stdio, Sse]):
                - `Stdio`: For shell command execution with arguments.
                - `Sse`: For SSE-based services, with optional bearer token.
    - `llm` (LLM):
        - `model` (str): Model name (e.g., "gpt-4o").
        - `provider` (str): LLM provider (e.g., "openai").
        - `top_probability` (float): Top-p sampling value (0–1).
        - `temperature` (float): Sampling temperature (0–1).
        - `max_tokens` (int): Max number of tokens to generate.

- `agent_execution_framework` (str): Execution runtime (e.g., "crewai").
- `is_entry_point` (bool): Whether this agent is the root of the workflow.
- `structured_response_format` (dict | list): 
    Structured format of the agent's output. Keys must map to valid types (e.g., "string", "int", "bool").
- `child_agent_names` (Optional[List[str]]): Names of agents this one passes control to.
- `parent_agent_names` (Optional[List[str]]): Names of agents that pass control to this one.
- `agent_node_invoke_condition` (Optional[dict]):
    Conditions on the parent output fields that must be satisfied to invoke this agent.

WORK IN PROGRESS
- `loop_through_input_key_required_from_parent` (Optional[str]):
    If set, allows looping over an iterable key from the parent response (e.g., iterating over a list of items).

Workflow Rules (validated automatically):
-----------------------------------------
1. Exactly one agent must be marked as `is_entry_point=True`.
2. Entry point agents cannot have parents.
3. Agents marked as terminators (`agent_config.is_terminator = True`) must not have children.
4. All parent and child references must refer to valid agents.
5. `agent_node_invoke_condition` keys must match keys from parent `structured_response_format`.
6. `structured_response_format` must only use types from the allowed set (e.g., "string", "int", "bool", etc.)

Example:

{
  "agent_config": {
    "name": "data_collector",
    "goal": "Collect user input from a form",
    "detailed_prompt": "Gather user information for processing eligibility.",
    "agent_responsibility": "Prompt and collect user data",
    "expected_output": "user_name: str, user_age: int, user_interests: list",
    "stream_output": false,
    "tools": [
      {
        "name": "FormTool",
        "connection": {
          "command": "python",
          "arguments": ["form_filler.py", "--form-type", "user_input"]
        }
      }
    ],
    "llm": {
      "model": "gpt-4o",
      "provider": "openai",
      "top_probability": 1.0,
      "temperature": 0.7,
      "max_tokens": 1024
    }
  },
  "agent_execution_framework": "crewai",
  "is_entry_point": true,
  "structured_response_format": {
    "user_name": "str",
    "user_age": "int",
    "user_interests": "list"
  },
  "child_agent_names": ["eligibility_checker"],
  "parent_agent_names": [],
  "agent_node_invoke_condition": {},
  "input_keys_required_from_parent": []
}

"""


class CustomWorkflowAgentConfig(BaseModel):
    agent_config: Agent
    agent_execution_framework: AgentFrameworks
    is_entry_point: bool = False
    structured_response_format: Union[List[dict[str, Any]], dict[str, Any]]
    child_agent_names: List[str] = list()
    parent_agent_names: List[str] = list()
    agent_node_invoke_condition: dict[str, Any] = dict() # If it is the child node when should it be triggered.
    input_keys_required_from_parent: List[str] = list() # If it is the child node provide keys for which the value is required requires. (context provider) (does not throw error if key not present) (if same key in loop through and input_keys_required_from_parent then provides the individual value present in the iterable)

    @model_validator(mode="after")
    def validate_config(self):
        # Rule 1: Entry point should not have parent
        if self.is_entry_point and self.parent_agent_names:
            raise ValueError("Entry point agent cannot have parent_agent_names.")

        # Rule 2: Validate structured_response_format
        def validate_format(fmt: dict[str, Any], path="root"):
            for key, value in fmt.items():
                if isinstance(value, str):
                    if value not in VALID_TYPES:
                        raise ValueError(
                            f"Invalid type '{value}' for key '{path}.{key}'. Allowed types: {', '.join(VALID_TYPES)}"
                        )
                elif isinstance(value, dict):
                    validate_format(value, path=f"{path}.{key}")
                elif isinstance(value, list):
                    if not value:
                        raise ValueError(f"List value for key '{path}.{key}' should not be empty.")
                    if not isinstance(value[0], dict):
                        raise ValueError(f"Invalid list format at '{path}.{key}'. Only list of dicts is allowed.")
                    validate_format(value[0], path=f"{path}.{key}[0]")
                else:
                    raise ValueError(f"Unsupported format at '{path}.{key}': {type(value)}")

        if isinstance(self.structured_response_format, dict):
            validate_format(self.structured_response_format)
        elif isinstance(self.structured_response_format, list):
            for idx, item in enumerate(self.structured_response_format):
                if not isinstance(item, dict):
                    raise ValueError(f"Invalid item at structured_response_format[{idx}]: Must be a dict")
                validate_format(item, path=f"structured_response_format[{idx}]")

        return self

