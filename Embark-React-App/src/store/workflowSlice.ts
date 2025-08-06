// store/workflowSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Workflow, WorkflowNode, WorkflowEdge } from '../workflow/interface';
import type { RootState } from './index';

export const selectNodes = (state: RootState) => state.workflow.nodes;
export const selectEdges = (state: RootState) => state.workflow.edges;
export const selectWorkflow = (state: RootState) => state.workflow.workflows;

interface WorkflowState {
  workflows: Workflow[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

const initialState: WorkflowState = {
  workflows: [],
  nodes: [],
  edges: [],
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    addWorkflow(state, action: PayloadAction<Workflow>) {
      state.workflows.push(action.payload);
    },

    removeWorkflow(state, action: PayloadAction<string>) {
      state.workflows = state.workflows.filter(workflow => workflow.name !== action.payload);
    },
    
    setNodes(state, action: PayloadAction<WorkflowNode[]>) {
      state.nodes = action.payload;
    },
    setEdges(state, action: PayloadAction<WorkflowEdge[]>) {
      state.edges = action.payload;
    },
    addNode(state, action: PayloadAction<WorkflowNode>) {
      state.nodes.push(action.payload);
    },
    updateNode(state, action: PayloadAction<WorkflowNode>) {
      const index = state.nodes.findIndex(node => node.id === action.payload.id);
      if (index !== -1) {
        state.nodes[index] = action.payload;
      }
    },
    deleteNode(state, action: PayloadAction<string>) {
      state.nodes = state.nodes.filter(node => node.id !== action.payload);
      state.edges = state.edges.filter(edge => edge.source !== action.payload && edge.target !== action.payload);
    },
    addEdge(state, action: PayloadAction<WorkflowEdge>) {
      state.edges.push(action.payload);
    },
    updateEdge(state, action: PayloadAction<WorkflowEdge>) {
      const index = state.edges.findIndex(edge => edge.id === action.payload.id);
      if (index !== -1) {
        state.edges[index] = action.payload;
      }
    },
    deleteEdge(state, action: PayloadAction<string>) {
      state.edges = state.edges.filter(edge => edge.id !== action.payload);
    },
    resetWorkflowState(state) {
      state.workflows = [];
      state.nodes = [];
      state.edges = [];
    },
  },
});

export const {
  addWorkflow,
  removeWorkflow,
  setNodes,
  setEdges,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  updateEdge,
  deleteEdge,
  resetWorkflowState,
} = workflowSlice.actions;

export default workflowSlice.reducer;
