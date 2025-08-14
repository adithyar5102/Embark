import ELK from 'elkjs/lib/elk.bundled.js';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  addEdge as addEdgeUtil,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  ConnectionLineType,
} from '@xyflow/react';

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import '@xyflow/react/dist/style.css';
import type { CustomNodeData } from './interface';
import CustomNode from './CustomNode';

interface FlowProps {
  inputNodes: Node<CustomNodeData>[];
  inputEdges: Edge[];
  onNodeClick: (label: string) => void;
  addNewNode: (node: any) => void;
  addNewEdge: (edge: any) => void;
  setAllNodes: (nodes: Node[]) => void;
  setAllEdges: (edges: Edge[]) => void;

}

const nodeTypes = {
  custom: CustomNode,
};

const elk = new ELK();

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
};

const getLayoutedElements = (
  nodes: Node<CustomNodeData>[],
  edges: Edge[],
  options: Record<string, string> = {}
) => {
  const isHorizontal = options?.['elk.direction'] === 'RIGHT';
  // Deep clone nodes and edges to avoid mutating frozen objects
  const clonedNodes = nodes.map((node) => ({ ...node, data: { ...node.data }, position: { ...node.position } }));
  const clonedEdges = edges.map((edge) => ({ ...edge }));

  const graph = {
    id: 'root',
    layoutOptions: options,
    children: clonedNodes.map((node) => ({
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      width: 250,
      height: 50,
    })),
    edges: clonedEdges,
  };

  return elk
    .layout(graph as any)
    .then((layoutedGraph) => ({
      nodes: layoutedGraph.children!.map((node) => ({
        ...node,
        position: { x: node.x!, y: node.y! },
      })),
      edges: layoutedGraph.edges as Edge[],
    }))
    .catch(console.error);
};

function LayoutFlow({ inputNodes, inputEdges, onNodeClick, addNewNode, addNewEdge, setAllNodes, setAllEdges }: FlowProps) {
  const { fitView } = useReactFlow();

  // Dialog State
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [positionType, setPositionType] = useState<'start' | 'mid' | 'end'>('end');
  const [error, setError] = useState('');

  // For mid node insertion
  const [aboveLabel, setAboveLabel] = useState('');
  const [belowLabel, setBelowLabel] = useState('');
  const [startTargetLabel, setStartTargetLabel] = useState('');
  const [endSourceLabel, setEndSourceLabel] = useState('');

  const openDialog = () => {
    setLabel('');
    setPositionType('end');
    setError('');
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    onNodeClick(node.data.label);
  };

  // Add Node Handler
  const handleAddNode = () => {
    if (!label.trim()) {
      setError('Label is required');
      return;
    }

    if (inputNodes.some((n) => n.data.label === label.trim())) {
      setError('Label must be unique');
      return;
    }

    const newId = `${inputNodes.length + 1}`;
    const newNode: Node<CustomNodeData> = {
      id: newId,
      type: 'custom',
      data: { label: label.trim(), status: 'scheduled' },
      position: { x: 0, y: 0 },
    };

    let updatedEdges: Edge[] = [...inputEdges]; // Start with existing edges

    if (positionType === 'start') {
      const targetNode = inputNodes.find((n) => n.data.label === startTargetLabel);
      if (targetNode) {
        updatedEdges.push({
          id: `e${newId}-${targetNode.id}`,
          source: newId,
          target: targetNode.id,
          label: `${label.trim()} to ${targetNode.data.label}`,
        });
      }
    } else if (positionType === 'end') {
      const sourceNode = inputNodes.find((n) => n.data.label === endSourceLabel);
      if (sourceNode) {
        updatedEdges.push({
          id: `e${sourceNode.id}-${newId}`,
          source: sourceNode.id,
          target: newId,
          label: `${sourceNode.data.label} to ${label.trim()}`,
        });
      }
    } else if (positionType === 'mid') {
      const aboveNode = inputNodes.find((n) => n.data.label === aboveLabel);
      const belowNode = inputNodes.find((n) => n.data.label === belowLabel);

      if (!aboveNode || !belowNode) {
        setError('Above and Below labels must be selected');
        return;
      }

      if (aboveNode.id === belowNode.id) {
        setError('Above and Below nodes must be different');
        return;
      }

      const existingEdge = inputEdges.find(
        (e) => e.source === aboveNode.id && e.target === belowNode.id
      );

      if (!existingEdge) {
        setError('No edge exists between selected nodes');
        return;
      }

      // Filter out the existing edge between aboveNode and belowNode
      updatedEdges = updatedEdges.filter(
        (e) => !(e.source === aboveNode.id && e.target === belowNode.id)
      );

      // Add two new edges to insert in the middle
      updatedEdges.push(
        {
          id: `e${aboveNode.id}-${newId}`,
          source: aboveNode.id,
          target: newId,
          label: `${aboveNode.data.label} to ${label.trim()}`,
        },
        {
          id: `e${newId}-${belowNode.id}`,
          source: newId,
          target: belowNode.id,
          label: `${label.trim()} to ${belowNode.data.label}`,
        }
      );
    }

    // Do layout using the new combined nodes and edges
    const updatedNodes = [...inputNodes, newNode];

    const opts = { 'elk.direction': 'DOWN', ...elkOptions };
    getLayoutedElements(updatedNodes, updatedEdges, opts).then((result) => {
      if (result?.nodes && result?.edges) {
        // Update Redux state AFTER layout is applied
        setAllNodes(result.nodes);
        setAllEdges(result.edges); // Use the potentially modified 'updatedEdges'

        requestAnimationFrame(() => fitView());
      }
    });

    closeDialog();
  };


  // Handle edge creation from react-flow connect event
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        id: `e${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
      };
      addNewEdge(newEdge);
    },
    [addNewEdge]
  );

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 relative">
      {/* Top Add Button */}
      <Box position="absolute" top={8} left={8} zIndex={10}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openDialog}
        >
          Add Node
        </Button>
      </Box>

      <ReactFlow
        nodes={inputNodes}
        edges={inputEdges}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SimpleBezier}
        fitView
        className="flex-grow"
      >
        <Background className="bg-gray-200 dark:bg-white" />
      </ReactFlow>

      {/* Add Node Dialog */}
      <Dialog open={open} onClose={closeDialog}>
        <DialogTitle>Add New Node</DialogTitle>
        <DialogContent>
          <TextField
            label="Node Label"
            fullWidth
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            error={!!error}
            helperText={error}
            margin="dense"
          />

          <FormControl fullWidth margin="dense">
            <InputLabel>Insert Position</InputLabel>
            <Select
              value={positionType}
              label="Insert Position"
              onChange={(e) => {
                setPositionType(e.target.value as 'start' | 'mid' | 'end');
                setAboveLabel('');
                setBelowLabel('');
                setStartTargetLabel('');
                setEndSourceLabel('');
              }}
            >
              <MenuItem value="start">Start (connect to child)</MenuItem>
              <MenuItem value="mid">Middle (insert between two nodes)</MenuItem>
              <MenuItem value="end">End (connect from parent)</MenuItem>
            </Select>
          </FormControl>

          {positionType === 'start' && (
            <FormControl fullWidth margin="dense">
              <InputLabel>Connect to Node (Child)</InputLabel>
              <Select
                value={startTargetLabel}
                onChange={(e) => setStartTargetLabel(e.target.value)}
                label="Connect to Node"
              >
                {inputNodes.map((n) => (
                  <MenuItem key={n.id} value={n.data.label}>
                    {n.data.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {positionType === 'end' && (
            <FormControl fullWidth margin="dense">
              <InputLabel>Connect from Node (Parent)</InputLabel>
              <Select
                value={endSourceLabel}
                onChange={(e) => setEndSourceLabel(e.target.value)}
                label="Connect from Node"
              >
                {inputNodes.map((n) => (
                  <MenuItem key={n.id} value={n.data.label}>
                    {n.data.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {positionType === 'mid' && (
            <>
              <FormControl fullWidth margin="dense">
                <InputLabel>Above Node</InputLabel>
                <Select
                  value={aboveLabel}
                  onChange={(e) => setAboveLabel(e.target.value)}
                  label="Above Node"
                >
                  {inputNodes.map((n) => (
                    <MenuItem key={n.id} value={n.data.label}>
                      {n.data.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>Below Node</InputLabel>
                <Select
                  value={belowLabel}
                  onChange={(e) => setBelowLabel(e.target.value)}
                  label="Below Node"
                >
                  {inputNodes.map((n) => (
                    <MenuItem key={n.id} value={n.data.label}>
                      {n.data.label}
                  </MenuItem>
                ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleAddNode} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const Flow = (props: FlowProps) => (
  <ReactFlowProvider>
    <LayoutFlow {...props} />
  </ReactFlowProvider>
);

export default Flow;