// initialElements.ts
import type { Node, Edge } from '@xyflow/react';

// Define a type for your custom node data if needed
export type CustomNodeData = {
  label: string;
  status: string
};

// export const initialNodes: Node<CustomNodeData>[] = [
//   { id: '1', type: 'custom', data: { label: 'Start Node', status: "created" }, position: { x: 0, y: 0 } },
//   { id: '2', type: 'custom', data: { label: 'Process A', status: "created" }, position: { x: 0, y: 0 } },
//   { id: '3', type: 'custom', data: { label: 'Process B', status: "created" }, position: { x: 0, y: 0 } },
//   { id: '4', type: 'custom', data: { label: 'Decision Node', status: "created" }, position: { x: 0, y: 0 } },
//   { id: '5', type: 'custom', data: { label: 'End Node', status: "created" }, position: { x: 0, y: 0 } },
// ];

// export const initialEdges: Edge[] = [
//   { id: 'e1-2', source: '1', target: '2', label: 'to A' },
//   { id: 'e1-3', source: '1', target: '3', label: 'to B' },
//   { id: 'e2-4', source: '2', target: '4', label: 'A to D' },
//   { id: 'e3-4', source: '3', target: '4', label: 'B to D' },
//   { id: 'e4-5', source: '4', target: '5', label: 'D to E' },
// ];

export const initialNodes: Node<CustomNodeData>[] = [
];

export const initialEdges: Edge[] = [
];