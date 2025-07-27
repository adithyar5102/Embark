import ELK from 'elkjs/lib/elk.bundled.js';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
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
import type { CustomNodeData } from './initialElements';
import CustomNode from './CustomNode';

interface FlowProps {
  inputNodes: Node<CustomNodeData>[];
  inputEdges: Edge[];
  onNodeClick: (label: string) => void;
  feature: 'workflow' | 'custom-workflow';
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
  const graph = {
    id: 'root',
    layoutOptions: options,
    children: nodes.map((node) => ({
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      width: 150,
      height: 50,
    })),
    edges: edges,
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

function LayoutFlow({ inputNodes, inputEdges, onNodeClick, feature }: FlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // Dialog State
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [positionType, setPositionType] = useState<'start' | 'mid' | 'end'>('end');
  const [error, setError] = useState('');

  const openDialog = () => {
    setLabel('');
    setPositionType('end');
    setError('');
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    onNodeClick(node.data.label);
  };

  const onLayout = useCallback(
    ({ direction }: { direction: 'DOWN' | 'RIGHT' }) => {
      const opts = { 'elk.direction': direction, ...elkOptions };
      getLayoutedElements(nodes, edges, opts).then((result) => {
        if (result) {
          setNodes(result.nodes);
          setEdges(result.edges);
          requestAnimationFrame(() => fitView());
        }
      });
    },
    [nodes, edges, setNodes, setEdges, fitView]
  );

  useLayoutEffect(() => {
    if (inputNodes.length === 0 && inputEdges.length === 0) return;
    const opts = { 'elk.direction': 'DOWN', ...elkOptions };
    getLayoutedElements(inputNodes, inputEdges, opts).then((result) => {
      if (result) {
        setNodes(result.nodes);
        setEdges(result.edges);
        requestAnimationFrame(() => fitView());
      }
    });
  }, [inputNodes, inputEdges, setNodes, setEdges, fitView]);

  // Add Node Handler
  const [aboveLabel, setAboveLabel] = useState('');
  const [belowLabel, setBelowLabel] = useState('');
  const [startTargetLabel, setStartTargetLabel] = useState('');
  const [endSourceLabel, setEndSourceLabel] = useState('');

  const handleAddNode = () => {
    if (!label.trim()) {
      setError('Label is required');
      return;
    }

    if (nodes.some((n) => n.data.label === label.trim())) {
      setError('Label must be unique');
      return;
    }

    const newId = `${nodes.length + 1}`;
    const newNode: Node<CustomNodeData> = {
      id: newId,
      type: 'custom',
      data: { label: label.trim(), status: 'created' },
      position: { x: 0, y: 0 },
    };

    const updatedNodes = [...nodes, newNode];
    let updatedEdges = [...edges];

    if (positionType === 'start') {
      const originalStart = nodes.find((n) =>
        edges.some((e) => e.source === n.id)
      );
      if (originalStart) {
        updatedEdges.push({
          id: `e${newId}-${originalStart.id}`,
          source: newId,
          target: originalStart.id,
          label: `${label.trim()} to ${originalStart.data.label}`,
        });
      }
    } else if (positionType === 'end') {
      const allTargets = new Set(edges.map((e) => e.target));
      const leafNodes = nodes.filter((n) => !allTargets.has(n.id));
      if (leafNodes.length > 0) {
        updatedEdges.push({
          id: `e${leafNodes[0].id}-${newId}`,
          source: leafNodes[0].id,
          target: newId,
          label: `${leafNodes[0].data.label} to ${label.trim()}`,
        });
      }
    } else if (positionType === 'mid') {
      const aboveNode = nodes.find((n) => n.data.label === aboveLabel);
      const belowNode = nodes.find((n) => n.data.label === belowLabel);

      if (!aboveNode || !belowNode) {
        setError('Above and Below labels must be selected');
        return;
      }

      if (aboveNode.id === belowNode.id) {
        setError('Above and Below nodes must be different');
        return;
      }

      const existingEdge = edges.find(
        (e) => e.source === aboveNode.id && e.target === belowNode.id
      );

      if (!existingEdge) {
        setError('No edge exists between selected nodes');
        return;
      }

      // Remove original edge
      updatedEdges = updatedEdges.filter((e) => e.id !== existingEdge.id);

      // Add new intermediate edges
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

    getLayoutedElements([...updatedNodes], updatedEdges, {
      'elk.direction': 'DOWN',
      ...elkOptions,
    }).then((result) => {
      if (result) {
        setNodes(result.nodes);
        setEdges(result.edges);
        closeDialog();
      }
    });
  };

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
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
                {nodes.map((n) => (
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
                {nodes.map((n) => (
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
                  {nodes.map((n) => (
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
                  {nodes.map((n) => (
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
