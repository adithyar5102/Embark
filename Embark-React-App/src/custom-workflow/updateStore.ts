import type { Dispatch } from 'redux';
import type {
    WorkflowNode,
    WorkflowEdge,
} from '../workflow/interface';

import { 
  addCustomNode, 
  updateCustomNode, 
  addCustomEdge, 
  updateCustomEdge,
  addCustomWorkflow,
  removeCustomWorkflow
} from '../store/customWorkflowSlice';
import type { CustomWorkflowAgentConfig } from './interface';

/**
 * Creates and dispatches a new node to the store.
 */
export function createNode(
  dispatch: Dispatch,
  node: WorkflowNode
) {
  console.log('Creating custom node:', node);
  dispatch(addCustomNode(node));
}

/**
 * Updates an existing node in the store.
 */
export function updateNodeInStore(
  dispatch: Dispatch,
  node: WorkflowNode
) {
  dispatch(updateCustomNode(node));
}

/**
 * Creates and dispatches a new edge to the store.
 */
export function createEdge(
  dispatch: Dispatch,
  edge: WorkflowEdge
) {
  console.log('Creating custom edge:', edge);
  dispatch(addCustomEdge(edge));
}

/**
 * Updates an existing edge in the store.
 */
export function updateEdgeInStore(
  dispatch: Dispatch,
  edge: WorkflowEdge
): void {
  dispatch(updateCustomEdge(edge));
}

export function addWorkflowInStore(
  dispatch: Dispatch,
  workflow: CustomWorkflowAgentConfig
) {
  console.log('Adding custom workflow:', workflow);
  dispatch(addCustomWorkflow(workflow));
}

export function removeWorkflowFromStore(
  dispatch: Dispatch,
  workflowLabel: string
) {
  console.log('Removing custom workflow:', workflowLabel);
  dispatch(removeCustomWorkflow(workflowLabel));
}