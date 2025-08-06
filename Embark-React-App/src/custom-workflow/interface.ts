import type { Agent } from "../workflow/interface";

export interface CustomWorkflowAgentConfig {
  agent_config: Agent;
  agent_execution_framework: "autogen" | "langgraph" | "crewai";
  is_entry_point?: boolean; 
  structured_response_format: Record<string, any>[] | Record<string, any>;
  child_agent_names: string[]; 
  parent_agent_names: string[];
  agent_node_invoke_condition: Record<string, any>; 
  input_keys_required_from_parent: string[]; 
}