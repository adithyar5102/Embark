from typing import List, Optional, Union, Any
from pydantic import BaseModel, model_validator, ValidationError
from modules.workflow_modules.workflow import Agent, AgentFrameworks
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
- `loop_through_key` (Optional[str]):
    If set, allows looping over an iterable key from the parent response (e.g., iterating over a list of items).

Workflow Rules (validated automatically):
-----------------------------------------
1. Exactly one agent must be marked as `is_entry_point=True`.
2. Entry point agents cannot have parents.
3. Agents marked as terminators (`agent_config.is_terminator = True`) must not have children.
4. All parent and child references must refer to valid agents.
5. `agent_node_invoke_condition` keys must match keys from parent `structured_response_format`.
6. `structured_response_format` must only use types from the allowed set (e.g., "string", "int", "bool", etc.)

Example Summary:
----------------
- `agent_1`: Entry-point agent that collects user input, outputs `output_1` (str) and `output_2` (int).
- `agent_2`: Child agent that analyzes the input. Triggered only if `output_1` from `agent_1` is truthy.
  It loops over `output_2` if it’s a list and produces a `final_output` (bool).

Use this example as a template to construct more complex multi-agent workflows.

{
  "workflows": [
    {
      "agent_config": {
        "name": "agent_1",
        "goal": "Collect user input",
        "detailed_prompt": "Please gather the necessary input from the user.",
        "agent_responsibility": "User data collection",
        "expected_output": "output_1: string, output_2: int",
        "stream_output": false,
        "tools": [
          {
            "name": "FormFillerTool",
            "connection": {
              "command": "python",
              "arguments": ["fill_form.py", "--form-type", "basic"]
            }
          }
        ],
        "llm": {
          "model": "gpt-4o",
          "provider": "openai",
          "top_probability": 0.9,
          "temperature": 0.7,
          "max_tokens": 1000
        }
      },
      "agent_execution_framework": "crewai",
      "is_entry_point": true,
      "structured_response_format": {
        "output_1": "bool",
        "output_2": "list"
      },
      "child_agent_names": ["agent_2"],
      "parent_agent_names": null,
      "agent_node_invoke_condition": null,
      "loop_through_key": null
    },
    {
      "agent_config": {
        "name": "agent_2",
        "goal": "Analyze user data",
        "detailed_prompt": "Evaluate the input provided and determine eligibility.",
        "agent_responsibility": "Data analysis and evaluation",
        "expected_output": "final_output: bool",
        "stream_output": true,
        "tools": [
          {
            "name": "EligibilityCheckerTool",
            "connection": {
              "connection_url": "https://sse.example.com/stream",
              "bearer_token": "your_token_here"
            }
          }
        ],
        "llm": {
          "model": "gpt-4",
          "provider": "openai",
          "top_probability": 0.8,
          "temperature": 0.5,
          "max_tokens": 800
        }
      },
      "agent_execution_framework": "crewai",
      "is_entry_point": false,
      "structured_response_format": {
        "final_output": "bool"
      },
      "child_agent_names": null,
      "parent_agent_names": ["agent_1"],
      "agent_node_invoke_condition": {
        "output_1": true
      },
      "loop_through_key": "output_2"
    }
  ]
}


"""


class CustomWorkflowAgentConfig(BaseModel):
    agent_config: Agent
    agent_execution_framework: AgentFrameworks
    is_entry_point: bool
    structured_response_format: Union[List[dict[str, Any]], dict[str, Any]]
    child_agent_names: Optional[List[str]] = None
    parent_agent_names: Optional[List[str]] = None
    agent_node_invoke_condition: Optional[dict[str, Any]] = None
    loop_through_key: Optional[str]

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


class CustomWorkflowConfig(BaseModel):
    workflows: List[CustomWorkflowAgentConfig]

    @model_validator(mode="after")
    def validate_workflow(self):
        # agent_map = {agent.agent_config.name: agent for agent in self.workflows}

        # entry_points = [agent for agent in self.workflows if agent.is_entry_point]

        entry_point_exists = False
        agent_map = dict()
        unique_agent_names = set()

        for agent in self.workflows:
            # Create agent map
            agent_map[agent.agent_config.name] = agent

            # Validate entry point
            if agent.is_entry_point and entry_point_exists is False:
                entry_point_exists = True
            elif agent.is_entry_point and entry_point_exists is True:
                raise ValueError(
                    "There must be exactly one entry point agent."
                )

            # Validate unique agent names
            if agent.agent_config.name in unique_agent_names:
                raise ValueError(
                    "Agents must have unique names."
                )
            else:
                unique_agent_names.add(agent.agent_config.name)

        for agent in self.workflows:
            # --- Validation 1: Check for valid parent/child references ---
            invalid_parents = [p for p in (agent.parent_agent_names or []) if p not in agent_map]
            if invalid_parents:
                raise ValueError(
                    f"Agent '{agent.agent_config.name}' has undefined parent(s): {', '.join(invalid_parents)}"
                )

            invalid_children = [c for c in (agent.child_agent_names or []) if c not in agent_map]
            if invalid_children:
                raise ValueError(
                    f"Agent '{agent.agent_config.name}' has undefined child(ren): {', '.join(invalid_children)}"
                )

            # --- Validation 2: Check agent_node_invoke_condition keys against parent structured outputs ---
            if agent.agent_node_invoke_condition:
                for parent_name in agent.parent_agent_names or []:
                    parent = agent_map.get(parent_name)
                    if not parent:
                        continue  # Already reported in Validation 1
                    # Extract keys from parent structured response format
                    def extract_keys(format_data):
                        if isinstance(format_data, dict):
                            return set(format_data.keys())
                        elif isinstance(format_data, list) and isinstance(format_data[0], dict):
                            return set(format_data[0].keys())
                        return set()

                    parent_keys = extract_keys(parent.structured_response_format)
                    missing_keys = [
                        k for k in agent.agent_node_invoke_condition.keys()
                        if k not in parent_keys
                    ]

                    if missing_keys:
                        raise ValueError(
                            f"Agent '{agent.agent_config.name}' references missing keys {missing_keys} "
                            f"in parent '{parent_name}' structured_response_format."
                        )

        return self
