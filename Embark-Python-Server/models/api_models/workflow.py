from typing import List, Optional
from pydantic import BaseModel, model_validator

from models.workflow_models.custom_workflow import CustomWorkflowAgentConfig
from models.workflow_models.workflow import Workflow

"""
Example input:
[
  {
    "workflow": {
      "name": "Multi-Agent Workflow Example",
      "description": "This workflow demonstrates using agents with both SSE and Stdio tools for interaction.",
      "agents": [
        {
          "name": "SSE Agent",
          "goal": "Stream data from an external service",
          "detailed_prompt": "Use the external streaming service to retrieve real-time information.",
          "agent_responsibility": "Connect to an SSE endpoint and process incoming events.",
          "expected_output": "A log of events in JSON format.",
          "stream_output": true,
          "tools": [
            {
              "name": "EventStreamTool",
              "connection": {
                "connection_url": "https://api.stream-service.com/events",
                "bearer_token": "sse_auth_token_123"
              }
            }
          ],
          "llm": {
            "model": "gpt-4",
            "provider": "openai",
            "top_probability": 0.9,
            "temperature": 0.6,
            "max_tokens": 512
          }
        },
        {
          "name": "CLI Agent",
          "goal": "Execute shell commands for file processing",
          "detailed_prompt": "Use the local CLI tool to perform text analysis on input files.",
          "agent_responsibility": "Run CLI commands and parse their outputs.",
          "expected_output": "Command output parsed into JSON format.",
          "stream_output": false,
          "tools": [
            {
              "name": "TextProcessor",
              "connection": {
                "command": "text_analyzer",
                "arguments": ["--input", "data/input.txt", "--output-format", "json"]
              }
            }
          ],
          "llm": {
            "model": "claude-3-haiku",
            "provider": "anthropic",
            "top_probability": 1.0,
            "temperature": 0.4,
            "max_tokens": 256
          }
        }
      ],
      "agent_execution_framework": "autogen",
      "execution_type": "supervisor",
      "reflection_additional_instruction": "Reflect after each agent completes their tool interaction.",
      "reflection_llm_config": {
        "model": "gpt-4",
        "provider": "openai",
        "top_probability": 1.0,
        "temperature": 0.3,
        "max_tokens": 150
      }
    },
    "task": "Stream events and analyze logs using separate agent tools."
  }
]

"""

class WorkflowModel(BaseModel):
    workflow: Workflow
    task: str


"""
Example input:
{
  "workflows": [
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
    },
    {
      "agent_config": {
        "name": "eligibility_checker",
        "goal": "Determine if the user qualifies",
        "detailed_prompt": "Based on the collected data, check if the user meets the criteria.",
        "agent_responsibility": "Analyze data and return eligibility status",
        "expected_output": "is_eligible: bool",
        "stream_output": true,
        "tools": [
          {
            "name": "EligibilityAPI",
            "connection": {
              "connection_url": "https://api.eligibility-checker.com/sse",
              "bearer_token": "secure_token_xyz"
            }
          }
        ],
        "llm": {
          "model": "claude-3-sonnet",
          "provider": "anthropic",
          "top_probability": 0.95,
          "temperature": 0.4,
          "max_tokens": 512
        }
      },
      "agent_execution_framework": "crewai",
      "is_entry_point": false,
      "structured_response_format": {
        "is_eligible": "bool"
      },
      "child_agent_names": [],
      "parent_agent_names": ["data_collector"],
      "agent_node_invoke_condition": {
        "user_age": 18
      },
      "input_keys_required_from_parent": ["user_age", "user_interests"]
    }
  ],
  "task": "Collect user data and determine eligibility",
  "share_task_among_agents": true
}

"""

class CustomWorkflowConfig(BaseModel):
    workflows: List[CustomWorkflowAgentConfig]
    task: str = ""
    share_task_among_agents: bool = True

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