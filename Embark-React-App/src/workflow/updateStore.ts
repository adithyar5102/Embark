import type { Dispatch } from 'redux';
import type {
    WorkflowNode,
    WorkflowEdge,
    CustomNodeData,
    Workflow
} from './interface';
import { 
  addNode, 
  updateNode, 
  addEdge, 
  updateEdge,
  addWorkflow,
  removeWorkflow
} from '../store/workflowSlice';

/**
 * Creates and dispatches a new node to the store.
 */
export function createNode(
  dispatch: Dispatch,
  node: WorkflowNode
) {
  console.log('Creating node:', node);
  dispatch(addNode(node));
}

/**
 * Updates an existing node in the store.
 */
export function updateNodeInStore(
  dispatch: Dispatch,
  node: WorkflowNode
) {
  dispatch(updateNode(node));
}

/**
 * Creates and dispatches a new edge to the store.
 */
export function createEdge(
  dispatch: Dispatch,
  edge: WorkflowEdge
) {
  console.log('Creating edge:', edge);
  dispatch(addEdge(edge));
}

/**
 * Updates an existing edge in the store.
 */
export function updateEdgeInStore(
  dispatch: Dispatch,
  edge: WorkflowEdge
): void {
  dispatch(updateEdge(edge));
}

export function addWorkflowInStore(
  dispatch: Dispatch,
  workflow: Workflow
) {
  console.log('Adding workflow:', workflow);
  dispatch(addWorkflow(workflow));
}

export function removeWorkflowFromStore(
  dispatch: Dispatch,
  workflowLabel: string
) {
  console.log('Removing workflow:', workflowLabel);
  dispatch(removeWorkflow(workflowLabel));
}