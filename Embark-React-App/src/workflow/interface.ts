// types/workflow.ts

export interface LLM {
  model: string;
  provider: string;
  top_probability: number;
  temperature: number;
  max_tokens: number;
}

export interface Stdio {
  command: string;
  arguments: string[];
}

export interface Sse {
  connection_url: string;
  bearer_token?: string;
}

export type ToolConnection = Stdio | Sse;

export interface Tool {
  name: string;
  connection: ToolConnection;
}

export const AgentFrameworks = {
  AUTOGEN: "autogen",
  LANGGRAPH : "langgraph",
  CREWAI : "crewai",
}

export const ExecutionTypeAutogen = {
  ROUND_ROBIN : "round_robin",
  SUPERVISOR : "supervisor",
}

export const ExecutionTypeCrewAI = {
  HIERARCHICAL : "hierarchical",
  SEQUENTIAL : "sequential",
}

export interface Agent {
  name: string;
  goal: string;
  detailed_prompt: string;
  agent_responsibility: string;
  expected_output: string;
  stream_output: boolean;
  tools: Tool[];
  llm: LLM;
}

export interface Workflow {
  name: string;
  description: string;
  agents: Agent[];
  agent_execution_framework: typeof AgentFrameworks;
  execution_type: string;
  reflection_additional_instruction?: string;
  reflection_llm_config?: LLM;
}

// Node and Edge (custom) interfaces
export interface CustomNodeData {
  label: string;
  status: string;
  metadata?: Record<string, any>; // Optional field for extended info
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: CustomNodeData;
  position: {
    x: number;
    y: number;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}
