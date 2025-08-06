import { Button } from '@mui/material';
import Flow from '../react-flow/Flow';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { WorkflowEdge, WorkflowNode, Workflow, workflowStatus } from './interface';
import { useDispatch, useSelector } from 'react-redux';
import { selectNodes, selectEdges, setNodes, setEdges, deleteNode, deleteEdge, selectWorkflow, } from '../store/workflowSlice';
import { createNode, createEdge, addWorkflowInStore, updateNodeInStore } from './updateStore';
import WorkflowInputForm from './WorkflowInputForm';
import { Modal, Button as AntdButton } from 'antd';
import 'antd/dist/reset.css';

export default function Workflow() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const nodes = useSelector(selectNodes);
  const edges = useSelector(selectEdges);
  const workflows = useSelector(selectWorkflow);

  const [clickedWorkflow, setClickedWorkflow] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalType, setModalType] = useState<'info' | 'success' | 'error' | 'confirm'>('info');
  const [confirmLoading, setConfirmLoading] = useState(false);
  type Interval = ReturnType<typeof setInterval>;
  const intervalRef = useRef<Interval | null>(null);

  const updateNode = (status: workflowStatus) => {
    const node = nodes.find((n) => n.data.label === status.name);
    if (node) {
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          status: status.status,
        },
      };
      updateNodeInStore(dispatch, updatedNode); // Pass cloned, updated node
    } else {
      console.error(`Node with label "${status.name}" not found.`);
    }
  };

  const pollStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/status/workflow');
      const data: workflowStatus[] = await res.json();

      data.forEach(updateNode); // update each node
      console.log('Workflow status updated:', data);

      const allDone = data.every(
        (status) => status.status === 'completed' || status.status === 'failed'
      );
      if (allDone) {
        stopPolling();
      }

    } catch (err) {
      console.error('Error polling workflow status:', err);
      showModal(
        'error',
        'Polling Error',
        'An error occurred while polling the workflow status. Please try again later.'
      );
      stopPolling();
    }
  };

  const startPolling = () => {
    pollStatus(); // Initial fetch
    intervalRef.current = window.setInterval(pollStatus, 15000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Helper: Validate a workflow and return missing fields
  function validateWorkflow(workflow: Workflow): string[] {
    const missing: string[] = [];
    if (!workflow.name) missing.push('name');
    if (!workflow.description) missing.push('description');
    if (!workflow.agent_execution_framework) missing.push('agent_execution_framework');
    if (!workflow.execution_type) missing.push('execution_type');
    if (!workflow.agents || workflow.agents.length === 0) missing.push('agents');
    workflow.agents?.forEach((agent, idx) => {
      if (!agent.name) missing.push(`agent[${idx}].name`);
      if (!agent.goal) missing.push(`agent[${idx}].goal`);
      if (!agent.detailed_prompt) missing.push(`agent[${idx}].detailed_prompt`);
      if (!agent.agent_responsibility) missing.push(`agent[${idx}].agent_responsibility`);
      if (!agent.expected_output) missing.push(`agent[${idx}].expected_output`);
      if (!agent.llm) missing.push(`agent[${idx}].llm`);
      else {
        if (!agent.llm.model) missing.push(`agent[${idx}].llm.model`);
        if (!agent.llm.provider) missing.push(`agent[${idx}].llm.provider`);
        if (agent.llm.top_probability === undefined) missing.push(`agent[${idx}].llm.top_probability`);
        if (agent.llm.temperature === undefined) missing.push(`agent[${idx}].llm.temperature`);
        if (agent.llm.max_tokens === undefined) missing.push(`agent[${idx}].llm.max_tokens`);
      }
      if (!agent.tools || agent.tools.length === 0) missing.push(`agent[${idx}].tools`);
      agent.tools?.forEach((tool, tIdx) => {
        if (!tool.name) missing.push(`agent[${idx}].tools[${tIdx}].name`);
        if (!tool.connection) missing.push(`agent[${idx}].tools[${tIdx}].connection`);
        else {
          if ('command' in tool.connection) {
            if (!tool.connection.command) missing.push(`agent[${idx}].tools[${tIdx}].connection.command`);
            if (!Array.isArray(tool.connection.arguments)) missing.push(`agent[${idx}].tools[${tIdx}].connection.arguments`);
          } else if ('connection_url' in tool.connection) {
            if (!tool.connection.connection_url) missing.push(`agent[${idx}].tools[${tIdx}].connection.connection_url`);
          }
        }
      });
    });
    return missing;
  }

  const onAddNode = useCallback(
    (node: WorkflowNode) => {
      createNode(dispatch, node);
    },
    [dispatch]
  );

  const onAddEdge = useCallback(
    (edge: WorkflowEdge) => {
      createEdge(dispatch, edge);
    },
    [dispatch]
  );

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      dispatch(deleteNode(nodeId));
    },
    [dispatch]
  );

  const onDeleteEdge = useCallback(
    (edgeId: string) => {
      dispatch(deleteEdge(edgeId));
    },
    [dispatch]
  );

  const showModal = (type: 'info' | 'success' | 'error' | 'confirm', title: string, content: React.ReactNode) => {
    setModalType(type);
    setModalTitle(title);
    setModalContent(content);
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    // This function will be triggered for 'info', 'success', 'error' type modals,
    // and also when confirming for 'confirm' type if an action is performed.
    setIsModalVisible(false);
    setConfirmLoading(false); // Reset confirm loading state
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setConfirmLoading(false); // Reset confirm loading state
  };

  function handleOnWOrkflowSave(workflow: Workflow) {
    if (clickedWorkflow === null) {
      showModal('error', 'Save Error', 'Please select a workflow before saving.');
      return;
    }
    workflow.name = clickedWorkflow?.toString();

    let workflowExists = false;
    workflows.forEach((wf) => {
      if (wf.name === workflow.name) {
        workflowExists = true;
      }
    });

    if (workflowExists) {
      showModal('error', 'Save Error', `Workflow with name "${workflow.name}" already exists. Please choose a different name.`);
      return;
    }


    const missing = validateWorkflow(workflow);
    if (missing.length > 0) {
      showModal(
        'error',
        'Validation Error',
        <div>
          <div className="font-bold mb-2">Missing required fields for Workflow "{workflow.name}":</div>
          <ul className="list-disc pl-5 text-red-600">
            {missing.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    addWorkflowInStore(dispatch, workflow);
    window.alert(`Workflow "${workflow.name}" saved successfully!`);
    // message.success(`Workflow "${workflow.name}" saved successfully!`); // Use Ant Design message for success
  }

  async function executeWorkflowConfirmed() {
    setConfirmLoading(true);
    const workflow_list: any = [];

    workflows.forEach((wf) => {
      const task = wf.task;
      const workflowData = {
        name: wf.name,
        description: wf.description,
        agents: wf.agents,
        agent_execution_framework: wf.agent_execution_framework,
        execution_type: wf.execution_type,
        reflection_additional_instruction: wf.reflection_additional_instruction,
        reflection_llm_config: wf.reflection_llm_config,
      };
      workflow_list.push({
        task: task,
        workflow: workflowData,
      });
    });

    try {
      startPolling();
      const response = await fetch('http://localhost:8000/execute/workflow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow_list),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to execute workflow');
      }

      const result = await response.json();
      showModal('success', 'Execution Successful', (
        <div>
          <p>Workflows executed successfully!</p>
          <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ));
    } catch (error: any) {
      showModal('error', 'Execution Error', `Error: ${error.message}`);
    } finally {
      setConfirmLoading(false);
      setIsModalVisible(false); // Close the confirmation modal after execution attempt
    }
  }

  function handleOnWOrkflowExecuteClick() {
    if (workflows.length === 0) {
      showModal('info', 'No Workflows', 'No workflows available to execute. Please create and save at least one workflow.');
      return;
    }

    let allMissing: string[] = [];
    workflows.forEach((wf, idx) => {
      const missing = validateWorkflow(wf);
      if (missing.length > 0) {
        allMissing.push(`Workflow "${wf.name || `Workflow ${idx + 1}`}": ${missing.join(', ')}`);
      }
    });

    if (allMissing.length > 0) {
      showModal(
        'error',
        'Validation Error for Execution',
        <div>
          <div className="font-bold mb-2">The following workflows have missing required fields:</div>
          <ul className="list-disc pl-5 text-red-600">
            {allMissing.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
          <p className="mt-4">Please correct these issues before attempting to execute.</p>
        </div>
      );
      return;
    }

    // All valid, show confirmation modal
    showModal(
      'confirm',
      'Confirm Workflow Execution',
      <div>
        <p className="mb-2">Are you sure you want to execute the following workflows?</p>
        <ul className="list-disc pl-5">
          {workflows.map((wf: Workflow, i: number) => (
            <li key={i}>{wf.name}</li>
          ))}
        </ul>
      </div>
    );
  }

  useEffect(() => {
    return () => stopPolling(); // cleanup on unmount
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow-sm rounded-md border border-gray-200">
        <div>
          <span className="text-2xl font-bold text-gray-800">
            Build Your Workflow
          </span>
        </div>

        <div>
          <Button
            variant="contained"
            size="large"
            className="rounded-full px-8 py-3 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
            onClick={handleOnWOrkflowExecuteClick}
            startIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path fill="currentColor" d="M8 5v14l11-7z" />
              </svg>
            }
            sx={{
              background: 'linear-gradient(45deg, #A3E635 30%, #FDE047 90%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #84CC16 30%, #FACC15 90%)',
                boxShadow: '0 6px 25px 0 rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            Execute Workflow
          </Button>
        </div>

        <div>
          <Button
            variant="contained"
            size="large"
            className="rounded-full px-8 py-3 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
            onClick={() => navigate('/custom-workflow')}
            sx={{
              background: 'linear-gradient(45deg, #4F46E5 30%, #9333EA 90%)',
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
        <div className="w-1/2 border-r">
          <Flow
            inputNodes={nodes}
            inputEdges={edges}
            onNodeClick={(label) => {
              setClickedWorkflow(label);
            }}
            addNewNode={onAddNode}
            addNewEdge={onAddEdge}
            // @ts-ignore
            setAllNodes={(nodes) => dispatch(setNodes(nodes))}
            // @ts-ignore
            setAllEdges={(edges) => dispatch(setEdges(edges))}
            // @ts-ignore
            deleteExistingNode={onDeleteNode}
            deleteExistingEdge={onDeleteEdge}
          />
        </div>

        <div className="w-1/2 p-6 overflow-auto">
          <WorkflowInputForm onSave={handleOnWOrkflowSave} label={clickedWorkflow?.toString()} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={isModalVisible}
        onOk={modalType === 'confirm' ? executeWorkflowConfirmed : handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
        okText={modalType === 'confirm' ? 'Execute' : 'OK'}
        // The cancelButtonProps and footer props control the buttons within the modal
        footer={
          modalType === 'confirm' ? (
            <>
              <AntdButton key="back" onClick={handleModalCancel}>
                Cancel
              </AntdButton>
              <AntdButton
                key="submit"
                type="primary" // This is correct for Ant Design Button
                loading={confirmLoading}
                onClick={executeWorkflowConfirmed}
              >
                Execute
              </AntdButton>
            </>
          ) : (
            <AntdButton key="ok" type="primary" onClick={handleModalOk}> {/* Also use AntdButton here */}
              OK
            </AntdButton>
          )
        }
      >
        {modalContent}
      </Modal>
    </div>
  );
}