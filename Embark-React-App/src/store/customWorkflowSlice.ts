// store/workflowSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WorkflowNode, WorkflowEdge } from '../workflow/interface';
import type { RootState } from './index';
import type { CustomWorkflowAgentConfig } from '../custom-workflow/interface';

export const selectCustomNodes = (state: RootState) => state.customWorkflow.customNodes;
export const selectCustomEdges = (state: RootState) => state.customWorkflow.customEdges;
export const selectCustomWorkflow = (state: RootState) => state.customWorkflow.customWorkflows;

interface CustomWorkflowState {
  customWorkflows: CustomWorkflowAgentConfig[];
  customNodes: WorkflowNode[];
  customEdges: WorkflowEdge[];
}

const initialWorkflowState: CustomWorkflowState = {
  customWorkflows: [],
  customNodes: [],
  customEdges: [],
};

const customWorkflowSlice = createSlice({
  name: 'customWorkflow',
  initialState: initialWorkflowState,
  reducers: {
    addCustomWorkflow(state, action: PayloadAction<CustomWorkflowAgentConfig>) {
      state.customWorkflows.push(action.payload);
    },

    removeCustomWorkflow(state, action: PayloadAction<string>) {
      state.customWorkflows = state.customWorkflows.filter(workflow => workflow.agent_config.name !== action.payload);
    },
    
    setCustomNodes(state, action: PayloadAction<WorkflowNode[]>) {
      state.customNodes = action.payload;
    },
    setCustomEdges(state, action: PayloadAction<WorkflowEdge[]>) {
      state.customEdges = action.payload;
    },
    addCustomNode(state, action: PayloadAction<WorkflowNode>) {
      state.customNodes.push(action.payload);
    },
    updateCustomNode(state, action: PayloadAction<WorkflowNode>) {
      const index = state.customNodes.findIndex(node => node.id === action.payload.id);
      if (index !== -1) {
        state.customNodes[index] = action.payload;
      }
    },
    deleteCustomNode(state, action: PayloadAction<string>) {
      state.customNodes = state.customNodes.filter(node => node.id !== action.payload);
      state.customEdges = state.customEdges.filter(edge => edge.source !== action.payload && edge.target !== action.payload);
    },
    addCustomEdge(state, action: PayloadAction<WorkflowEdge>) {
      state.customEdges.push(action.payload);
    },
    updateCustomEdge(state, action: PayloadAction<WorkflowEdge>) {
      const index = state.customEdges.findIndex(edge => edge.id === action.payload.id);
      if (index !== -1) {
        state.customEdges[index] = action.payload;
      }
    },
    deleteCustomEdge(state, action: PayloadAction<string>) {
      state.customEdges = state.customEdges.filter(edge => edge.id !== action.payload);
    },
    resetCustomWorkflowState(state) {
      state.customWorkflows = [];
      state.customNodes = [];
      state.customEdges = [];
    },
  },
});

export const {
  addCustomWorkflow,
  removeCustomWorkflow,
  setCustomNodes,
  setCustomEdges,
  addCustomNode,
  updateCustomNode,
  deleteCustomNode,
  addCustomEdge,
  updateCustomEdge,
  deleteCustomEdge,
  resetCustomWorkflowState,
} = customWorkflowSlice.actions;

export default customWorkflowSlice.reducer;
