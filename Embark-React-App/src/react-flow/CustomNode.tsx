import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface CustomNodeProps {
  data: {
    label: string;
    status: 'scheduled' | 'running' | 'completed' | 'failed';
  };
}

const getStatusStyle = (status: CustomNodeProps['data']['status']) => {
  const baseStyle: React.CSSProperties = {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#000',
  };

  switch (status) {
    case 'scheduled':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(173, 216, 230, 0.3)',
        border: '1px solid rgba(173, 216, 230, 0.6)',
      };
    case 'running':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 255, 153, 0.3)',
      };
    case 'completed':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(144, 238, 144, 0.3)',
        border: '1px solid rgba(144, 238, 144, 0.6)',
      };
    case 'failed':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 99, 71, 0.3)',
        border: '1px solid rgba(255, 99, 71, 0.6)',
      };
    default:
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        border: '1px solid rgba(200, 200, 200, 0.6)',
      };
  }
};

const getStatusIcon = (status: CustomNodeProps['data']['status']) => {
  switch (status) {
    case 'scheduled':
      return <ScheduleIcon fontSize="small" />;
    case 'running':
      return <AutorenewIcon className="spin" fontSize="small" />;
    case 'completed':
      return <CheckCircleIcon fontSize="small" />;
    case 'failed':
      return <ErrorIcon fontSize="small" />;
    default:
      return null;
  }
};

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const isRunning = data.status === 'running';

  return (
    <div
      className={isRunning ? 'animated-border' : ''}
      style={{
        padding: 3,
        borderRadius: 8,
        display: 'inline-block',
        position: 'relative',
      }}
    >
      <div
        style={{
          ...getStatusStyle(data.status),
          padding: 10,
          borderRadius: 5,
          minWidth: 250,
          minHeight: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '2px 2px 10px rgba(0,0,0,0.15)',
          textAlign: 'center',
          border: isRunning ? '3px dashed transparent' : undefined,
        }}
      >
        {/* Target handles */}
        <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
        <Handle type="target" position={Position.Left} style={{ background: '#555' }} />

        <div className='flex flex-row gap-4' style={{ width: '100%' }}>
          <div>
           {getStatusIcon(data.status)} 
          </div>
          <div className='font-mono'>
            {data.label}
          </div>
        </div>

        {/* Source handles */}
        <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
      </div>
    </div>
  );
};

export default memo(CustomNode);
