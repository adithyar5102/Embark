// components/CustomNode.tsx
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface CustomNodeProps {
  data: {
    label: string;
  };
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  return (
    <div
      style={{
        padding: 10,
        border: '1px solid #1a192b',
        borderRadius: 5,
        background: '#fff',
        textAlign: 'center',
        minWidth: 150, // Match width in ELK options
        minHeight: 50, // Match height in ELK options
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
      }}
    >
      {/* Target handle on the left/top for incoming connections */}
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />

      <div style={{ fontWeight: 'bold' }}>{data.label}</div>

      {/* Source handle on the right/bottom for outgoing connections */}
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

export default memo(CustomNode);