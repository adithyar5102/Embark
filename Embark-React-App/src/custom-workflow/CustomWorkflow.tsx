import { Button } from '@mui/material';
import Flow from '../react-flow/Flow';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, use, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCustomNodes, selectCustomEdges, setCustomNodes, setCustomEdges, deleteCustomNode, deleteCustomEdge, selectCustomWorkflow, } from '../store/customWorkflowSlice';
import { createNode, createEdge, addWorkflowInStore, updateNodeInStore } from './updateStore';
import type { Agent, LLM, Sse, Stdio, Tool, ToolConnection, WorkflowEdge, WorkflowNode, workflowStatus } from '../workflow/interface';
import CustomWorkflowInputForm from './CustomWorkflowInputForm';
import type { CustomWorkflowAgentConfig } from './interface'; // Ensure all interfaces are imported
import { Modal, Form, Input, Checkbox, message } from 'antd'; // Import Ant Design components

export default function CustomWorkflow() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Read nodes and edges from Redux store
  const nodes = useSelector(selectCustomNodes);
  const edges = useSelector(selectCustomEdges);
  const workflows = useSelector(selectCustomWorkflow);

  console.log("custom workflows", workflows);

  const [clickedWorkflow, setClickedWorkflow] = useState<string | null>(null);
  const [isExecuteModalVisible, setIsExecuteModalVisible] = useState(false); // State for the "Execute Workflow" input modal
  const [workflowExecuteForm] = Form.useForm(); // Form instance for the "Execute Workflow" modal

  // New states for the generic validation/confirmation modal
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationModalContent, setValidationModalContent] = useState<React.ReactNode>(null);
  const [validationModalType, setValidationModalType] = useState<'error' | 'confirm'>('confirm');
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
      const res = await fetch('http://localhost:8000/status/custom-workflow/');
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
      console.error(
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


  // Helper: Validate a CustomWorkflowAgentConfig and return missing fields
  function validateCustomWorkflow(workflowConfig: CustomWorkflowAgentConfig): string[] {
    const missing: string[] = [];

    // Validate top-level CustomWorkflowAgentConfig fields
    if (workflowConfig.agent_config === undefined || workflowConfig.agent_config === null) {
      missing.push('agent_config');
    } else {
      // Validate Agent config
      const agent: Agent = workflowConfig.agent_config;
      if (agent.name === undefined || agent.name === null || agent.name.trim() === '') missing.push('agent_config.name');
      if (agent.goal === undefined || agent.goal === null || agent.goal.trim() === '') missing.push('agent_config.goal');
      if (agent.detailed_prompt === undefined || agent.detailed_prompt === null || agent.detailed_prompt.trim() === '') missing.push('agent_config.detailed_prompt');
      if (agent.agent_responsibility === undefined || agent.agent_responsibility === null || agent.agent_responsibility.trim() === '') missing.push('agent_config.agent_responsibility');
      if (agent.expected_output === undefined || agent.expected_output === null || agent.expected_output.trim() === '') missing.push('agent_config.expected_output');
      if (agent.stream_output === undefined || agent.stream_output === null) missing.push('agent_config.stream_output'); // Boolean check

      // Validate LLM config
      if (agent.llm === undefined || agent.llm === null) {
        missing.push('agent_config.llm');
      } else {
        const llm: LLM = agent.llm;
        if (llm.model === undefined || llm.model === null || llm.model.trim() === '') missing.push('agent_config.llm.model');
        if (llm.provider === undefined || llm.provider === null || llm.provider.trim() === '') missing.push('agent_config.llm.provider');
        if (llm.top_probability === undefined || llm.top_probability < 0 || llm.top_probability > 1) missing.push('agent_config.llm.top_probability (must be between 0 and 1)');
        if (llm.temperature === undefined || llm.temperature < 0 || llm.temperature > 1) missing.push('agent_config.llm.temperature (must be between 0 and 1)');
        if (llm.max_tokens === undefined || llm.max_tokens <= 0) missing.push('agent_config.llm.max_tokens (must be positive)');
      }

      // Validate Tools
      if (agent.tools === undefined || agent.tools === null || !Array.isArray(agent.tools) || agent.tools.length === 0) {
        missing.push('agent_config.tools (at least one tool required)');
      } else {
        agent.tools.forEach((tool: Tool, tIdx: number) => {
          if (tool.name === undefined || tool.name === null || tool.name.trim() === '') missing.push(`agent_config.tools[${tIdx}].name`);
          if (tool.connection === undefined || tool.connection === null) {
            missing.push(`agent_config.tools[${tIdx}].connection`);
          } else {
            const connection: ToolConnection = tool.connection;
            // Check Stdio or Sse properties
            if ('command' in connection) { // Stdio
              const stdioConnection = connection as Stdio;
              if (stdioConnection.command === undefined || stdioConnection.command === null || stdioConnection.command.trim() === '') missing.push(`agent_config.tools[${tIdx}].connection.command`);
              if (stdioConnection.arguments === undefined || stdioConnection.arguments === null || !Array.isArray(stdioConnection.arguments)) missing.push(`agent_config.tools[${tIdx}].connection.arguments (must be an array)`);
              // Arguments array can be empty, but must be an array
            } else if ('connection_url' in connection) { // Sse
              const sseConnection = connection as Sse;
              if (sseConnection.connection_url === undefined || sseConnection.connection_url === null || sseConnection.connection_url.trim() === '') missing.push(`agent_config.tools[${tIdx}].connection.connection_url`);
              if (sseConnection.bearer_token === undefined || sseConnection.bearer_token === null || sseConnection.bearer_token.trim() === '') missing.push(`agent_config.tools[${tIdx}].connection.bearer_token`); // Made required
            } else {
              missing.push(`agent_config.tools[${tIdx}].connection (invalid type - neither Stdio nor Sse)`);
            }
          }
        });
      }
    }

    // Validate CustomWorkflowAgentConfig specific fields (now all required)
    if (workflowConfig.agent_execution_framework === undefined || workflowConfig.agent_execution_framework === null || (workflowConfig.agent_execution_framework !== "autogen" && workflowConfig.agent_execution_framework !== "langgraph" && workflowConfig.agent_execution_framework !== "crewai")) {
      missing.push('agent_execution_framework (must be "autogen", "langgraph", or "crewai")');
    }
    if (workflowConfig.is_entry_point === undefined || workflowConfig.is_entry_point === null) missing.push('is_entry_point'); // Boolean check

    if (workflowConfig.structured_response_format === undefined || workflowConfig.structured_response_format === null || (typeof workflowConfig.structured_response_format !== 'object' || Array.isArray(workflowConfig.structured_response_format) && workflowConfig.structured_response_format.length === 0 && Object.keys(workflowConfig.structured_response_format).length === 0)) {
      // This check ensures it's an object/array and not just null/undefined.
      // If it's an empty object {} or an empty array [], it will still pass this specific check if that's acceptable for "required but empty".
      // If you need it to *contain* keys/elements, you'd need a more specific check here.
      missing.push('structured_response_format (must be an object or array)');
    }

    if (workflowConfig.child_agent_names === undefined || workflowConfig.child_agent_names === null || !Array.isArray(workflowConfig.child_agent_names)) {
      missing.push('child_agent_names (must be an array)');
    }
    // If you want to ensure the array is not empty: `&& workflowConfig.child_agent_names.length === 0`

    if (workflowConfig.parent_agent_names === undefined || workflowConfig.parent_agent_names === null || !Array.isArray(workflowConfig.parent_agent_names)) {
      missing.push('parent_agent_names (must be an array)');
    }
    // If you want to ensure the array is not empty: `&& workflowConfig.parent_agent_names.length === 0`

    if (workflowConfig.agent_node_invoke_condition === undefined || workflowConfig.agent_node_invoke_condition === null || typeof workflowConfig.agent_node_invoke_condition !== 'object' || Array.isArray(workflowConfig.agent_node_invoke_condition)) {
      missing.push('agent_node_invoke_condition (must be an object)');
    }
    // If you want to ensure the object is not empty: `&& Object.keys(workflowConfig.agent_node_invoke_condition).length === 0`

    if (workflowConfig.input_keys_required_from_parent === undefined || workflowConfig.input_keys_required_from_parent === null || !Array.isArray(workflowConfig.input_keys_required_from_parent)) {
      missing.push('input_keys_required_from_parent (must be an array)');
    }
    // If you want to ensure the array is not empty: `&& workflowConfig.input_keys_required_from_parent.length === 0`
    return missing;
  }


  // Add node to Redux store
  const onAddNode = useCallback(
    (node: WorkflowNode) => {
      createNode(dispatch, node);
    },
    [dispatch]
  );

  // Add edge to Redux store
  const onAddEdge = useCallback(
    (edge: WorkflowEdge) => {
      createEdge(dispatch, edge);
    },
    [dispatch]
  );

  // --- DELETE LOGIC ---
  // Delete node from Redux store
  const onDeleteNode = useCallback(
    (nodeId: string) => {
      dispatch(deleteCustomNode(nodeId));
    },
    [dispatch]
  );

  // Delete edge from Redux store
  const onDeleteEdge = useCallback(
    (edgeId: string) => {
      dispatch(deleteCustomEdge(edgeId));
    },
    [dispatch]
  );
  // --- END DELETE LOGIC ---

  function handleCustomWorkflowSave(workflow: CustomWorkflowAgentConfig) {
    if (clickedWorkflow === null) {
      console.error('Workflow label is required');
      message.error('Please select a workflow node before saving.');
      return;
    }
    // Assign the clicked workflow name to the agent config name for consistency
    workflow.agent_config.name = clickedWorkflow;

    let allMissing: string[] = [];
    const missing = validateCustomWorkflow(workflow);
    if (missing.length > 0) {
      allMissing.push(`Agent "${workflow.agent_config.name}": ${missing.join(', ')}`);
    }

    if (allMissing.length > 0) {
      setValidationModalType('error');
      setValidationModalContent(
        <div>
          <div className="font-bold mb-2">Missing or Invalid fields in current Agent:</div>
          <ul className="list-disc pl-5 text-red-600">
            {allMissing.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      );
      setIsValidationModalOpen(true);
      return;
    }

    addWorkflowInStore(dispatch, workflow);
    setValidationModalType('confirm');
    setValidationModalContent(
      <div>
        <div className="font-bold mb-2">Agent "{workflow.agent_config.name}" Saved Successfully!</div>
      </div>
    );
    setIsValidationModalOpen(true);

    console.log('Workflow saved:', workflow);
  }

  const handleOnWorkflowExecuteClick = () => {
    if (workflows.length === 0) {
      setValidationModalType('error');
      setValidationModalContent('No custom agents configured. Please add at least one agent to execute.');
      setIsValidationModalOpen(true);
      return;
    }

    // Validate all custom workflows
    let allMissing: string[] = [];
    workflows.forEach((wf, idx) => {
      const missing = validateCustomWorkflow(wf);
      if (missing.length > 0) {
        allMissing.push(`Agent "${wf.agent_config.name || `Unnamed Agent ${idx + 1}`}": ${missing.join(', ')}`);
      }
    });

    if (allMissing.length > 0) {
      setValidationModalType('error');
      setValidationModalContent(
        <div>
          <div className="font-bold mb-2">Missing or Invalid fields in the following Agents:</div>
          <ul className="list-disc pl-5 text-red-600">
            {allMissing.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
          <p className="mt-4">Please correct these issues before executing the workflow.</p>
        </div>
      );
      setIsValidationModalOpen(true);
      return;
    }

    // If all workflows are valid, proceed to show the "Execute Workflow" input modal
    setIsExecuteModalVisible(true);
    workflowExecuteForm.setFieldsValue({
      task: '',
      share_task_among_agents: true,
    });
  };

  const handleExecuteModalOk = async () => {
    try {
      const values = await workflowExecuteForm.validateFields();

      const payload = {
        workflows: workflows, // All configured workflows
        task: values.task,
        share_task_among_agents: values.share_task_among_agents,
      };

      console.log('Executing workflow with payload:', payload);
      startPolling(); // Start polling for status updates
      // API call to execute the custom workflow
      const response = await fetch('http://localhost:8000/execute/custom-workflow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to execute workflow');
      }

      // const result = await response.json();
      message.success('Workflow execution initiated successfully!');
      setIsExecuteModalVisible(false);
      workflowExecuteForm.resetFields();
      // console.log('Workflow execution result:', result);
    } catch (error: any) {
      console.error('Workflow execution failed:', error);
      message.error(`Failed to execute workflow: ${error.message || 'Validation error'}`);
    }
  };

  const handleExecuteModalCancel = () => {
    setIsExecuteModalVisible(false);
    workflowExecuteForm.resetFields();
  };

  const defaultAgentConfig: CustomWorkflowAgentConfig = {
    agent_config: {
      name: clickedWorkflow ? clickedWorkflow : 'Select a workflow',
      goal: '',
      detailed_prompt: '',
      agent_responsibility: '',
      expected_output: '',
      stream_output: false,
      tools: [],
      llm: {
        model: '',
        provider: '',
        top_probability: 0.8,
        temperature: 0.5,
        max_tokens: 4096,
      },
    },
    agent_execution_framework: 'autogen',
    is_entry_point: false,
    structured_response_format: {},
    child_agent_names: [],
    parent_agent_names: [],
    agent_node_invoke_condition: {},
    input_keys_required_from_parent: [],
  };

  const workflowFromStore = workflows.find(workflow => workflow.agent_config.name === clickedWorkflow);

  // Cleanup polling on component unmount
  useEffect(() => {
    stopPolling();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow-sm rounded-md border border-gray-200">
        {/* Left side title */}
        <div>
          <span className="text-2xl font-bold text-gray-800">
            Configure Custom Workflow
          </span>
        </div>

        <div>
          <Button
            variant="contained"
            size="large"
            className="rounded-full px-8 py-3 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
            onClick={handleOnWorkflowExecuteClick}
            startIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path fill="currentColor" d="M8 5v14l11-7z" />
              </svg>
            }
            sx={{
              background: 'linear-gradient(45deg, #A3E635 30%, #FDE047 90%)', // Green to Yellow
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

        {/* Right side button */}
        <div>
          <Button
            variant="contained"
            size="large"
            className="rounded-full px-8 py-3 text-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
            onClick={() => navigate('/workflow')}
            sx={{
              background: 'linear-gradient(45deg, #4F46E5 30%, #9333EA 90%)', // Indigo to Purple
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #4338CA 30%, #7E22CE 90%)',
                boxShadow: '0 6px 25px 0 rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            Build a Workflow Agent Group
          </Button>
        </div>
      </div>
      <div className="flex h-screen w-full bg-white">
        {/* Left side - Flow */}
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
            setAllNodes={(nodes) => dispatch(setCustomNodes(nodes))}
            // @ts-ignore
            setAllEdges={(edges) => dispatch(setCustomEdges(edges))}
            // @ts-ignore
            deleteExistingNode={onDeleteNode} // Pass the delete node handler
            deleteExistingEdge={onDeleteEdge} // Pass the delete edge handler
          />
        </div>

        {/* Right side - Custom content */}
        <div className="w-1/2 overflow-auto">
          <CustomWorkflowInputForm customWorkflowDetails={workflowFromStore ? workflowFromStore : defaultAgentConfig} onSave={handleCustomWorkflowSave} nodeNames={nodes.map((node) => { return node.data.label })} />
        </div>
      </div>

      {/* Ant Design Modal for Workflow Execution Inputs (Task, Share Task) */}
      <Modal
        title="Execute Workflow"
        visible={isExecuteModalVisible}
        onOk={handleExecuteModalOk}
        onCancel={handleExecuteModalCancel}
        okText="Execute"
        cancelText="Cancel"
      >
        <Form
          form={workflowExecuteForm}
          layout="vertical"
          name="workflow_execute_form"
        >
          <Form.Item label="Agents to be executed">
            {/* Display names of configured agents */}
            {workflows.length > 0 ? (
              <ul>
                {workflows.map((wf, index) => (
                  <li key={index}><strong>{wf.agent_config.name}</strong></li>
                ))}
              </ul>
            ) : (
              <p>No agents configured yet.</p>
            )}
          </Form.Item>
          <Form.Item
            name="task"
            label="Task"
            rules={[{ required: true, message: 'Please input the task for this workflow!' }]}
            tooltip="What is the primary task for this workflow to achieve?"
          >
            <Input.TextArea rows={4} placeholder="e.g., Analyze market trends for Q3 and provide a summary report." />
          </Form.Item>
          <Form.Item
            name="share_task_among_agents"
            valuePropName="checked"
            initialValue={true} // Default to checked
            tooltip="Should the main task be shared with all agents, or should they receive more specific sub-tasks?"
          >
            <Checkbox>Share task among agents</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* Generic Validation/Confirmation Modal */}
      <Modal
        title={validationModalType === 'error' ? "Validation Error" : "Success"}
        visible={isValidationModalOpen}
        onOk={() => setIsValidationModalOpen(false)}
        onCancel={() => setIsValidationModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsValidationModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {validationModalContent}
      </Modal>
      <button onClick={() => {
        updateNode({ name: 'a', status: 'completed' });
        console.log('Node updated');
      }}>
        a
      </button>
      <button onClick={() => {
        updateNode({ name: 'b', status: 'failed' });
        console.log('Node updated');
      }}>
        b
      </button>
      <button onClick={() => {
        updateNode({ name: 'c', status: 'running' });
        console.log('Node updated');
      }}>
        c
      </button>
    </div>
  );
}