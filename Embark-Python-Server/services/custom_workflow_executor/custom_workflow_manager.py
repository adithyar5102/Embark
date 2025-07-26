
# create a graph.

import json
from typing import List
from fastapi import HTTPException
from services.custom_workflow_executor.custom_workflow_implementation.autogen_executor import AutogenExecutor
from services.custom_workflow_executor.custom_workflow_implementation.crewai_executor import CrewAIExecutor
from services.custom_workflow_executor.custom_workflow_implementation.langgraph_executor import LangGraphExecutor
from shared.pydantic_model_creator import build_pydantic_model_from_dict
from core.exception.workflow_execution_exception import CyclicWorkflowException, EntryPointNotFoundException
from modules.workflow_modules.custom_workflow import CustomWorkflowAgentConfig

class CustomWorkflowManager():
    def __init__(self, custom_workflows: List[CustomWorkflowAgentConfig]):
        self.agent_config_map = dict()
        self.start_node = ""
        self.node_count = len(custom_workflows)

        # agent_config_map = {agent1: {agent config}, agent2: {agent config}}
        for agent in custom_workflows:
            self.agent_config_map[agent.agent_config.name] = agent
            if agent.is_entry_point:
                self.start_node = agent.agent_config.name

        if self.start_node == "":
            raise EntryPointNotFoundException()
    
    def is_cyclic_util(self, node: str, visited: dict, rec_stack: dict):
        visited[node] = True
        rec_stack[node] = True

        for child in self.agent_config_map[node].child_agent_names:
            if not visited.get(child, False):
                if self.is_cyclic_util(child, visited, rec_stack):
                    return True
            elif rec_stack.get(child, False):
                return True

        rec_stack[node] = False
        return False

    def is_cyclic(self, start_node: str):
        visited = dict.fromkeys(self.agent_config_map, False)
        rec_stack = dict.fromkeys(self.agent_config_map, False)
        return self.is_cyclic_util(start_node, visited, rec_stack)
    
    def get_agent_execution_framework(self, framework: str):
        try:
            match framework.lower():
                case "autogen":
                    return AutogenExecutor()
                case "lang_graph":
                    return CrewAIExecutor()
                case "crewai":
                    return LangGraphExecutor()
                case _:
                    raise HTTPException(status_code=400, detail=f"Unsupported framework: {framework}")
        except Exception as e:
            # Log exception or handle specifically
            raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")
    
    # If the there are no matching request form the child the first child will be triggered.
    def get_valid_child_name(self, result: dict, child_agent_names: list[str]):
        def is_key_value_present(parent_dict: dict, child_dict: dict) -> bool:
            for key, value in child_dict.items():
                if key not in parent_dict or parent_dict[key] != value:
                    return False
            return True
            
                    
        for child_name in child_agent_names:
            child_workflow:CustomWorkflowAgentConfig = self.agent_config_map[child_name]
            if is_key_value_present(
                parent_dict=result,
                child_dict=child_workflow.agent_node_invoke_condition
            ):
                # If match return child name and required keys
                return child_workflow.agent_config.name, child_workflow.input_keys_required_from_parent

        # If no match return first child name and required keys
        child_workflow:CustomWorkflowAgentConfig = self.agent_config_map[child_agent_names[0]]
        return child_workflow.agent_config.name, child_workflow.input_keys_required_from_parent

    async def execute_workflow(self, task: str, share_task_among_agents: bool = True):
        if self.is_cyclic(self.start_node):
            raise CyclicWorkflowException()
        
        flag = True
        agent_input_message = task
        current_node = self.start_node
        result = None
        loop_count = 0


        while flag and loop_count <= self.node_count:

            workflow_node_config:CustomWorkflowAgentConfig = self.agent_config_map[current_node]
            agent = workflow_node_config.agent_config
            executor = self.get_agent_execution_framework(workflow_node_config.agent_execution_framework)
            pydantic_model = build_pydantic_model_from_dict(
                name=agent.name,
                data=workflow_node_config.structured_response_format
            )

            result:dict = await executor.execute(
                agent=agent,
                response_format=pydantic_model,
                task_message=agent_input_message
            )

            # If no child then return result
            if workflow_node_config.child_agent_names:
                # Update the agent_message with input_keys_required_from_parent
                child_name, input_keys = self.get_valid_child_name(
                    result=result,
                    child_agent_names=workflow_node_config.child_agent_names
                )    
                current_node = child_name
            else:
                flag = False
                return result
            
            # get the next node to invoke and gather data from result. If key is "" or None send entire response.
            requested_messages_form_child = dict()
            # check for the key value in the result
            if input_keys:
                for key in input_keys:
                    if key in result.keys():
                        requested_messages_form_child[key] = result[key]
            
            # if required input fields not present assign result
            if share_task_among_agents:
                agent_input_message = f"**Task**:\n{task}\n\n**Task Context:**\n"
            else:
                agent_input_message = "**Task Context:**\n"

            if requested_messages_form_child:
                agent_input_message += json.dumps(requested_messages_form_child)
            else:
                agent_input_message += json.dumps(result)

            loop_count += 1