from typing import List, Optional
from pydantic import BaseModel, model_validator

from modules.workflow_modules.custom_workflow import CustomWorkflowAgentConfig
from modules.workflow_modules.workflow import Workflow

class WorkflowModel(BaseModel):
    workflow: Workflow
    task: str

class CustomWorkflowConfig(BaseModel):
    workflows: List[CustomWorkflowAgentConfig]
    task: Optional[str]

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
                # --- Validation 3: input_keys_required_from_parent must be in parent structured_response_format ---
            if agent.input_keys_required_from_parent:
                for key in agent.input_keys_required_from_parent:
                    key_found = False
                    for parent_name in agent.parent_agent_names:
                        parent = agent_map.get(parent_name)
                        if not parent:
                            continue

                        def extract_keys(format_data):
                            if isinstance(format_data, dict):
                                return set(format_data.keys())
                            elif isinstance(format_data, list) and isinstance(format_data[0], dict):
                                return set(format_data[0].keys())
                            return set()

                        if key in extract_keys(parent.structured_response_format):
                            key_found = True
                            break

                    if not key_found:
                        raise ValueError(
                            f"Agent '{agent.agent_config.name}' requires key '{key}' from parent(s), "
                            f"but none of its parents provide it in their structured_response_format."
                        )

        return self