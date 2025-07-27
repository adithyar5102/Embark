import { Button } from '@mui/material'
import Flow from '../react-flow/Flow'
import { useNavigate } from 'react-router-dom';
import { initialEdges, initialNodes, type CustomNodeData } from '../react-flow/initialElements';
import type { Node } from '@xyflow/react';
import { useState } from 'react';

export default function Workflow() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const addNode = () => {
    const newId = `${nodes.length + 1}`;
    const newNode = {
      id: newId,
      type: 'custom',
      data: { label: `Dynamic Node ${newId}`, status: "created" },
      position: { x: 0, y: 0 },
    };

    const newEdge = {
      id: `e${nodes.length}-${newId}`,
      source: nodes[nodes.length - 1].id,
      target: newId,
      label: `edge ${newId}`,
    };

    setNodes([...nodes, newNode]);
    setEdges([...edges, newEdge]);
  };


  return (
    <div>
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow-sm rounded-md border border-gray-200">
        {/* Left side title */}
        <div>
          <span className="text-2xl font-bold text-gray-800">
            Build Your Workflow
          </span>
        </div>

        {/* Right side button */}
        <div>
          <Button
            variant="contained"
            size="large"
            className="rounded-full px-8 py-3 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
            onClick={() => navigate('/custom-workflow')}
            sx={{
              background: 'linear-gradient(45deg, #4F46E5 30%, #9333EA 90%)', // Indigo to Purple
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #4338CA 30%, #7E22CE 90%)',
                boxShadow: '0 6px 25px 0 rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            Build a Custom Workflow
          </Button>
        </div>
      </div>
      <div className="flex h-screen w-full bg-white">
        {/* Left side - Flow */}
        <div className="w-1/2 border-r">
          <Flow
            inputNodes={initialNodes}
            inputEdges={initialEdges}
            onNodeClick={(label) => {
              console.log('Clicked node label:', label);
            }}
            feature='workflow'
          />
        </div>

        {/* Right side - Custom content */}
        <div className="w-1/2 p-6 overflow-auto">
          <h2 className="text-xl font-bold mb-4">Details Panel</h2>
          <p>You can put any content here like form inputs, JSON viewers, charts, etc.</p>
          {/* Add whatever logic or content you need */}
        </div>
      </div>
    </div>

  )
}

