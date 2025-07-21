from typing import List, Optional, Union, Any
from pydantic import BaseModel, model_validator, ValidationError
from modules.workflow_modules.workflow import Agent, AgentFrameworks
from shared.constants import VALID_TYPES


class CustomWorkflowAgentConfig(BaseModel):
    agent_config: Agent
    agent_execution_framework: AgentFrameworks
    is_entry_point: bool
    is_terminator: bool
    structured_response_format: Union[List[dict[str, Any]], dict[str, Any]]
    child_agent_names: Optional[List[str]] = None
    parent_agent_names: Optional[List[str]] = None
    agent_node_invoke_condition: Optional[dict[str, Any]] = None

    @model_validator(mode="after")
    def validate_config(self):
        # Rule 1: Entry point should not have parent
        if self.is_entry_point and self.parent_agent_names:
            raise ValueError("Entry point agent cannot have parent_agent_names.")

        # Rule 2: Terminator should not have children
        if self.is_terminator and self.child_agent_names:
            raise ValueError("Terminator agent cannot have child_agent_names.")

        # Rule 3: Validate structured_response_format
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
    workflow: List[CustomWorkflowAgentConfig]

    @model_validator(mode="after")
    def validate_workflow(self):
        agent_map = {agent.agent_config.name: agent for agent in self.workflow}

        for agent in self.workflow:
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
