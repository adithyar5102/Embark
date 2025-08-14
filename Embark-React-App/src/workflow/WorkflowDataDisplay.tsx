import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Collapse,
  Card,
  Space,
  Typography,
  Radio,
  Tooltip,
  InputNumber,
  Checkbox,
  message,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

import type { LLM, Stdio, Sse, ToolConnection, Tool } from './interface';
import { type Agent, type Workflow, AgentFrameworks, ExecutionTypeAutogen, ExecutionTypeCrewAI, ExecutionTypeLanggraph } from './interface';

const { Panel } = Collapse;
const { Title, Text } = Typography;
const { Option } = Select;

// Helper function to check if an object is a Stdio or Sse
function isStdio(connection: any): connection is Stdio {
  return connection && typeof connection.command === 'string';
}

const WorkflowConfiguration = ({ onSave, workflow }: { onSave: (workflow: Workflow) => void; workflow?: Workflow }) => {
  const [form] = Form.useForm();
  const [llmNames, setLlmNames] = useState<string[]>([]);
  const [mcpToolNames, setMcpToolNames] = useState<string[]>([]);
  const [currentExecutionType, setCurrentExecutionType] = useState<string>(workflow?.agent_execution_framework || AgentFrameworks.AUTOGEN);
  const [initialData, setInitialData] = useState(workflow);
  const [activeKeys, setActiveKeys] = useState<string[]>(['1']);

  useEffect(() => {
    setInitialData(workflow);
  }, [workflow]);

  // Use useEffect to set initial form values
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
      updateNames(initialData);
    }
  }, [form, initialData]);

  // Helper function to update LLM and Tool names
  const updateNames = (values: any) => {
    const llms: LLM[] = values.llm_configurations || [];
    const tools: Tool[] = values.tool_configurations || [];
    setLlmNames(llms.map((llm: LLM) => llm.model).filter(Boolean));
    setMcpToolNames(tools.map((tool: Tool) => tool.name).filter(Boolean));
  };

  // onValuesChange handler to replace form.watch
  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (changedValues.llm_configurations || changedValues.tool_configurations) {
      updateNames(allValues);
    }
    
    const llms = allValues.llm_configurations;
    const tools = allValues.tool_configurations;
    if (llms) sessionStorage.setItem('llmConfigs', JSON.stringify(llms));
    if (tools) sessionStorage.setItem('mcpToolConfigs', JSON.stringify(tools));
  };


  const onFinish = (values: any) => {
    // Destructure the values to get the configurations and other workflow data
    const { llm_configurations, tool_configurations, reflection_llm, agents, ...workflowValues } = values;

    // Create a map for quick lookup of LLM and Tool objects by their names
    const llmMap = new Map(llm_configurations.map(llm => [llm.model, llm]));
    let toolMap:any = []
    if (tool_configurations){
      toolMap = new Map(tool_configurations.map(tool => [tool.name, tool]));
    }

    // Re-map the agents to include the full LLM and Tool objects
    const agentsWithFullConfig = agents.map((agent) => {
      // Find the full LLM object based on the selected model name
      const llm = llmMap.get(agent.llm);

      // Find the full Tool objects based on the selected tool names
      const tools = agent.tools.map(toolName => toolMap.get(toolName)).filter(Boolean);

      return {
        ...agent,
        llm,
        tools,
      };
    });

    const reflection_llm_object = llmMap.get(reflection_llm);

    console.log(reflection_llm_object)

    const finalWorkflow = {
      ...workflowValues,
      agents: agentsWithFullConfig,
      reflection_llm_config: reflection_llm_object
    };

    console.log(finalWorkflow)

    onSave(finalWorkflow);
    message.success('Workflow saved successfully!');
  };

  const executionTypeOptions = () => {
    switch (currentExecutionType) {
      case AgentFrameworks.AUTOGEN:
        return Object.values(ExecutionTypeAutogen);
      case AgentFrameworks.CREWAI:
        return Object.values(ExecutionTypeCrewAI);
      case AgentFrameworks.LANGGRAPH:
        return Object.values(ExecutionTypeLanggraph);
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 text-gray-800 font-sans">
      <Card className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 border-none">
        <Title 
          level={2} 
          className="text-center font-extrabold mb-8"
          style={{ 
            backgroundImage: 'linear-gradient(45deg, #FF6B8B, #8A2BE2)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            fontSize: '2.5rem'
          }}
        >
          Workflow Configuration
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={initialData}
          onValuesChange={handleValuesChange}
        >
          <Collapse
            activeKey={activeKeys}
            onChange={(key) => setActiveKeys(key as string[])}
            expandIconPosition="right"
            className="rounded-xl overflow-hidden"
          >
            {/* Panel 1: Workflow Details */}
            <Panel
              header={<span className="font-semibold text-lg text-gray-700" style={{ 
            backgroundImage: 'linear-gradient(45deg, #FF6B8B, #8A2BE2)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            fontSize: '1.5rem'
          }}>Workflow Details</span>}
              key="1"
              className="mb-4 bg-gray-100 rounded-xl"
            >
              <Form.Item
                name="name"
                label="Workflow Name"
                rules={[{ required: true, message: 'Please input a workflow name!' }]}
              >
                <Input placeholder="Select a workflow" disabled={true} />
              </Form.Item>
              <Form.Item
                name="description"
                label="Description"
              >
                <Input.TextArea placeholder="Enter a brief description" />
              </Form.Item>
              <Form.Item
                name="task"
                label="Task"
                rules={[{ required: true, message: 'Please input the main task!' }]}
              >
                <Input.TextArea placeholder="Describe the main task for the agents" />
              </Form.Item>
            </Panel>

            {/* Panel 2: LLM Configurations */}
            <Panel
              header={<span className="font-semibold text-lg text-gray-700" style={{ 
            backgroundImage: 'linear-gradient(45deg, #FF6B8B, #8A2BE2)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            fontSize: '1.5rem'
          }}>LLM Configurations</span>}
              key="2"
              className="mb-4 bg-gray-100 rounded-xl"
            >
              <Form.List name="llm_configurations">
                {(fields, { add, remove }) => (
                  <div className="flex flex-col gap-4">
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={key}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm"
                        size="small"
                        title={
                          <div className="flex justify-between items-center w-full">
                            <Text strong className="text-gray-700">LLM Configuration</Text>
                            <MinusCircleOutlined onClick={() => remove(name)} className="text-red-500 hover:text-red-700 cursor-pointer text-base" />
                          </div>
                        }
                      >
                        <Form.Item
                          {...restField}
                          name={[name, 'model']}
                          label="Model"
                          rules={[{ required: true, message: 'Missing model name' }]}
                        >
                          <Input placeholder="e.g., gemini-1.5-flash-preview-0520" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'provider']}
                          label="Provider"
                          rules={[{ required: true, message: 'Missing provider' }]}
                        >
                          <Input placeholder="e.g., google" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'top_probability']}
                          label="Top Probability"
                        >
                          <InputNumber min={0} max={1} step={0.1} className="w-full" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'temperature']}
                          label="Temperature"
                        >
                          <InputNumber min={0} max={1} step={0.1} className="w-full" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'max_tokens']}
                          label="Max Tokens"
                        >
                          <InputNumber min={1} className="w-full" />
                        </Form.Item>
                      </Card>
                    ))}
                    <Form.Item className="mt-4">
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                        className="border-gray-300 text-gray-600 hover:text-purple-600 hover:border-purple-600"
                      >
                        Add LLM Configuration
                      </Button>
                    </Form.Item>
                  </div>
                )}
              </Form.List>
            </Panel>

            {/* Panel 3: MCP Tool Configuration */}
            <Panel
              header={<span className="font-semibold text-lg text-gray-700" style={{ 
            backgroundImage: 'linear-gradient(45deg, #FF6B8B, #8A2BE2)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            fontSize: '1.5rem'
          }}>MCP Tool Configuration</span>}
              key="3"
              className="mb-4 bg-gray-100 rounded-xl"
            >
              <Form.List name="tool_configurations">
                {(fields, { add, remove }) => (
                  <div className="flex flex-col gap-4">
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={key}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm"
                        size="small"
                        title={
                          <div className="flex justify-between items-center w-full">
                            <Text strong className="text-gray-700">MCP Tool</Text>
                            <MinusCircleOutlined onClick={() => remove(name)} className="text-red-500 hover:text-red-700 cursor-pointer text-base" />
                          </div>
                        }
                      >
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="Tool Name"
                          rules={[{ required: true, message: 'Missing tool name' }]}
                        >
                          <Input placeholder="e.g., Google Search" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'connection', 'type']}
                          label="Connection Type"
                          rules={[{ required: true, message: 'Missing connection type' }]}
                        >
                          <Select placeholder="Select connection type">
                            <Option value="stdio">Stdio</Option>
                            <Option value="sse">SSE</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues.tool_configurations?.[name]?.connection?.type !==
                            currentValues.tool_configurations?.[name]?.connection?.type
                          }
                        >
                          {({ getFieldValue }) => {
                            const connectionType = getFieldValue(['tool_configurations', name, 'connection', 'type']);
                            if (connectionType === 'stdio') {
                              return (
                                <Space direction="vertical" className="w-full">
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'connection', 'command']}
                                    label="Command"
                                    rules={[{ required: true, message: 'Missing command' }]}
                                  >
                                    <Input placeholder="e.g., python" />
                                  </Form.Item>
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'connection', 'arguments']}
                                    label="Arguments"
                                  >
                                    <Select
                                      mode="tags"
                                      placeholder="e.g., -c 'print(input)'"
                                    />
                                  </Form.Item>
                                </Space>
                              );
                            } else if (connectionType === 'sse') {
                              return (
                                <Space direction="vertical" className="w-full">
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'connection', 'connection_url']}
                                    label="Connection URL"
                                    rules={[{ required: true, message: 'Missing URL' }]}
                                  >
                                    <Input placeholder="e.g., https://api.example.com/sse" />
                                  </Form.Item>
                                  <Form.Item
                                    {...restField}
                                    name={[name, 'connection', 'bearer_token']}
                                    label="Bearer Token"
                                  >
                                    <Input.Password placeholder="Enter bearer token" />
                                  </Form.Item>
                                </Space>
                              );
                            }
                            return null;
                          }}
                        </Form.Item>
                      </Card>
                    ))}
                    <Form.Item className="mt-4">
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                        className="border-gray-300 text-gray-600 hover:text-purple-600 hover:border-purple-600"
                      >
                        Add MCP Tool
                      </Button>
                    </Form.Item>
                  </div>
                )}
              </Form.List>
            </Panel>

            {/* Panel 4: Agent Configuration */}
            <Panel
              header={<span className="font-semibold text-lg text-gray-700" style={{ 
            backgroundImage: 'linear-gradient(45deg, #FF6B8B, #8A2BE2)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            fontSize: '1.5rem'
          }}>Agent Configuration</span>}
              key="4"
              className="mb-4 bg-gray-100 rounded-xl"
            >
              <Form.List name="agents">
                {(fields, { add, remove }) => (
                  <div className="flex flex-col gap-4">
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={key}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm"
                        size="small"
                        title={
                          <div className="flex justify-between items-center w-full">
                            <Text strong className="text-gray-700">Agent</Text>
                            <MinusCircleOutlined onClick={() => remove(name)} className="text-red-500 hover:text-red-700 cursor-pointer text-base" />
                          </div>
                        }
                      >
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="Agent Name"
                          rules={[{ required: true, message: 'Missing agent name' }]}
                        >
                          <Input placeholder="e.g., Data Scientist Agent" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'goal']}
                          label="Goal"
                          rules={[{ required: true, message: 'Missing agent goal' }]}
                        >
                          <Input.TextArea placeholder="A high-level goal for the agent" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'detailed_prompt']}
                          label="Detailed Prompt"
                          rules={[{ required: true, message: 'Missing prompt' }]}
                        >
                          <Input.TextArea placeholder="A detailed, specific prompt for the agent" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'agent_responsibility']}
                          label="Responsibility"
                        >
                          <Input.TextArea placeholder="Describe the agent's responsibilities" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'expected_output']}
                          label="Expected Output"
                        >
                          <Input.TextArea placeholder="What is the expected output?" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'llm']}
                          label="Select LLM"
                          rules={[{ required: true, message: 'Please select an LLM' }]}
                        >
                          <Select placeholder="Select an LLM">
                            {llmNames.map((name, index) => (
                              <Option key={index} value={name}>{name}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'tools']}
                          label="Select MCP Tools"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Select MCP tools (optional)"
                          >
                            {mcpToolNames.map((name, index) => (
                              <Option key={index} value={name}>{name}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'stream_output']}
                          valuePropName="checked"
                          label="Stream Output"
                          tooltip={{
                            title: 'Whether to stream the agent\'s output in real-time.',
                            icon: <QuestionCircleOutlined />,
                          }}
                        >
                          <Checkbox />
                        </Form.Item>
                      </Card>
                    ))}
                    <Form.Item className="mt-4">
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                        className="border-gray-300 text-gray-600 hover:text-purple-600 hover:border-purple-600"
                      >
                        Add Agent
                      </Button>
                    </Form.Item>
                  </div>
                )}
              </Form.List>
            </Panel>

            {/* Panel 5: Execution and Reflection */}
            <Panel
              header={<span className="font-semibold text-lg text-gray-700" style={{ 
            backgroundImage: 'linear-gradient(45deg, #FF6B8B, #8A2BE2)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            fontSize: '1.5rem'
          }}>Execution and Reflection</span>}
              key="5"
              className="mb-4 bg-gray-100 rounded-xl"
            >
              <Form.Item
                name="agent_execution_framework"
                label="Agent Execution Framework"
                rules={[{ required: true, message: 'Please select a framework!' }]}
              >
                <Radio.Group
                  onChange={(e) => setCurrentExecutionType(e.target.value)}
                >
                  <Radio.Button value={AgentFrameworks.AUTOGEN}>Autogen</Radio.Button>
                  <Radio.Button value={AgentFrameworks.CREWAI}>CrewAI</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="execution_type"
                label="Execution Type"
                rules={[{ required: true, message: 'Please select an execution type!' }]}
              >
                <Select placeholder="Select execution type">
                  {executionTypeOptions().map((type, index) => (
                    <Option key={index} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name={['reflection_llm']}
                label="Select Reflection LLM"
                rules={[{ required: true, message: 'Please select an LLM' }]}
              >
                <Select placeholder="Select an LLM">
                  {llmNames.map((name, index) => (
                    <Option key={index} value={name}>{name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="reflection_additional_instruction"
                label="Reflection Instruction"
                tooltip={{
                  title: 'Additional instructions for the reflection step (optional).',
                  icon: <QuestionCircleOutlined />,
                }}
              >
                <Input.TextArea placeholder="e.g., 'Ensure the final output is formatted as a JSON object.'" />
              </Form.Item>
            </Panel>
          </Collapse>

          <Form.Item className="mt-8 text-center">
            <div className='mt-8'>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SaveOutlined />}
              className="bg-gradient-to-r from-pink-500 to-purple-600 border-none rounded-full px-8 py-2 text-lg font-bold shadow-lg text-white hover:scale-105 transition-transform duration-300"
            >
              Save Workflow
            </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default WorkflowConfiguration;