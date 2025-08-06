import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { Form, Input, Select, Checkbox, Button, InputNumber, Radio } from 'antd'; // Import Radio for tool type selection
import type { CustomWorkflowAgentConfig} from './interface'; // Import updated interfaces
import type { Tool, ToolConnection, Stdio, Sse } from "../workflow/interface"; // Import Tool and ToolConnection interfaces

const { Option } = Select;
const { TextArea } = Input;
const { Group: RadioGroup } = Radio; // Destructure Radio.Group

const gradientText = "bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text";

interface CustomWorkflowInputFormProps {
  customWorkflowDetails: CustomWorkflowAgentConfig;
  onSave: (config: CustomWorkflowAgentConfig) => void;
  nodeNames: string[];
}

const CustomWorkflowInputForm = ({ customWorkflowDetails, onSave, nodeNames }: CustomWorkflowInputFormProps) => {
  const [form] = Form.useForm();
  const [llmConfigs, setLlmConfigs] = useState<LLMConfig[]>([]);
  const [toolConfigs, setToolConfigs] = useState<Tool[]>([]); // Use the Tool interface directly
  const [selectedLlmId, setSelectedLlmId] = useState<string | undefined>();
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);

  // State for new tool form to manage type specific inputs
  const [newToolConnectionType, setNewToolConnectionType] = useState<'stdio' | 'sse'>('stdio');


  type LLMConfig = {
    id: string;
    model: string;
    provider: string;
    top_probability: number;
    temperature: number;
    max_tokens: number;
  };

  // Set initial form values based on customWorkflowDetails
  useEffect(() => {
    form.setFieldsValue({
      ...customWorkflowDetails,
      agent_config: {
        ...customWorkflowDetails.agent_config,
        llm: customWorkflowDetails.agent_config.llm?.model, // Set LLM by model name
        tools: customWorkflowDetails.agent_config.tools?.map(tool => tool.name) || [], // Tools are stored by name in agent_config
      },
      structured_response_format: JSON.stringify(customWorkflowDetails.structured_response_format, null, 2),
      agent_node_invoke_condition: JSON.stringify(customWorkflowDetails.agent_node_invoke_condition, null, 2),
      input_keys_required_from_parent: Array.isArray(customWorkflowDetails.input_keys_required_from_parent) ? customWorkflowDetails.input_keys_required_from_parent.join(', ') : '',
    });

    if (customWorkflowDetails.agent_config.llm) {
      setSelectedLlmId(customWorkflowDetails.agent_config.llm.model);
    }
    if (customWorkflowDetails.agent_config.tools) {
      setSelectedToolIds(customWorkflowDetails.agent_config.tools.map(tool => tool.name)); // Update selection by tool name
    }

  }, [customWorkflowDetails, form]);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const llmString = localStorage.getItem('llmConfigs');
      const toolString = localStorage.getItem('toolConfigs');
      const storedLLMs = llmString ? JSON.parse(llmString) : [];
      const storedTools = toolString ? JSON.parse(toolString) : [];
      setLlmConfigs(storedLLMs);
      setToolConfigs(storedTools);
    } catch (error) {
      console.error("Failed to load from local storage:", error);
    }
  }, []);

  // Update localStorage whenever configs change
  useEffect(() => {
    localStorage.setItem('llmConfigs', JSON.stringify(llmConfigs));
  }, [llmConfigs]);

  useEffect(() => {
    localStorage.setItem('toolConfigs', JSON.stringify(toolConfigs));
  }, [toolConfigs]);

  const saveLLMConfig = (values: any) => {
    // 1. LLM config save issue: Correctly retrieve values from form
    if (!values.llm_model) {
      console.error("LLM Model is required.");
      return;
    }
    const newConfig: LLMConfig = {
      id: Date.now().toString(), // Using Date.now() for a unique ID
      model: values.llm_model,
      provider: values.llm_provider,
      top_probability: values.llm_top_probability || 0.8,
      temperature: values.llm_temperature || 0.5,
      max_tokens: values.llm_max_tokens || 4096,
    };
    setLlmConfigs(prevConfigs => [...prevConfigs, newConfig]);
    // 1. LLM config save issue: Correctly reset fields after saving
    form.resetFields(['llm_model', 'llm_provider', 'llm_top_probability', 'llm_temperature', 'llm_max_tokens']);
  };

  const deleteLLMConfig = (id: string) => {
    setLlmConfigs(prevConfigs => prevConfigs.filter(llm => llm.id !== id));
    // If the deleted LLM was selected, clear the selection
    if (selectedLlmId === id) {
      setSelectedLlmId(undefined);
      form.setFieldsValue({ agent_config: { llm: undefined } });
    }
  };

  const saveToolConfig = (values: any) => {
    if (!values.tool_name) {
      console.error("Tool Name is required.");
      return;
    }

    let newToolConnection: ToolConnection;
    if (newToolConnectionType === 'stdio') {
      newToolConnection = {
        command: values.tool_command,
        arguments: values.tool_arguments ? values.tool_arguments.split(',').map((arg: string) => arg.trim()) : [],
      } as Stdio;
    } else { // sse
      newToolConnection = {
        connection_url: values.sse_connection_url,
        bearer_token: values.sse_bearer_token || undefined,
      } as Sse;
    }

    const newConfig: Tool = {
      name: values.tool_name, // Tool name is the identifier now
      connection: newToolConnection,
    };

    setToolConfigs(prevConfigs => [...prevConfigs, newConfig]);
    // Reset fields for the currently selected tool type
    form.resetFields(['tool_name', 'tool_command', 'tool_arguments', 'sse_connection_url', 'sse_bearer_token']);
  };

  const deleteToolConfig = (name: string) => { // Delete by name
    setToolConfigs(prevConfigs => prevConfigs.filter(tool => tool.name !== name));
    // If a deleted tool was selected, remove it from selection
    setSelectedToolIds(prev => prev.filter(toolName => toolName !== name));
    form.setFieldsValue({ agent_config: { tools: selectedToolIds.filter(toolName => toolName !== name) } });
  };

  const handleFinalSave = (values: any) => {
    const selectedLLM = llmConfigs.find(llm => llm.id === values.agent_config.llm);
    // 2. In MCP tool config: Filter tools by their name
    const selectedTools = toolConfigs.filter(tool => values.agent_config.tools?.includes(tool.name));

  
    let parsedStructuredResponseFormat = {};
    try {
      parsedStructuredResponseFormat = values.structured_response_format ? JSON.parse(values.structured_response_format) : {};
    } catch (error) {
      console.error("Invalid JSON for structured_response_format:", error);
      alert("Invalid JSON format for Structured Response Format.");
      return;
    }

    let parsedAgentNodeInvokeCondition = {};
    try {
      parsedAgentNodeInvokeCondition = values.agent_node_invoke_condition ? JSON.parse(values.agent_node_invoke_condition) : {};
    } catch (error) {
      console.error("Invalid JSON for agent_node_invoke_condition:", error);
      alert("Invalid JSON format for Node Invoke Condition.");
      return;
    }

    const finalConfig: CustomWorkflowAgentConfig = {
      ...values,
      structured_response_format: parsedStructuredResponseFormat,
      agent_node_invoke_condition: parsedAgentNodeInvokeCondition,
      input_keys_required_from_parent: values.input_keys_required_from_parent
        ? values.input_keys_required_from_parent.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      agent_config: {
        ...values.agent_config,
        llm: selectedLLM,
        tools: selectedTools, // Pass the actual tool objects
      },
    };

    console.log("Final Agent Configuration:", finalConfig);
    onSave(finalConfig);
  };

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className={`text-2xl font-semibold leading-none tracking-tight ${gradientText}`}>{title}</h3>
      </div>
      <div className="p-6 pt-0">
        {children}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className={`text-4xl font-bold ${gradientText} text-center`}>
          Custom Workflow Agent Configuration
        </h1>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinalSave}
          initialValues={{
            ...customWorkflowDetails,
            agent_config: {
              ...customWorkflowDetails.agent_config,
              llm: customWorkflowDetails.agent_config.llm?.model,
              tools: customWorkflowDetails.agent_config.tools?.map(tool => tool.name) || [], // Set initial selected tools by name
            },
            structured_response_format: JSON.stringify(customWorkflowDetails.structured_response_format, null, 2),
            agent_node_invoke_condition: JSON.stringify(customWorkflowDetails.agent_node_invoke_condition, null, 2),
            input_keys_required_from_parent: Array.isArray(customWorkflowDetails.input_keys_required_from_parent) ? customWorkflowDetails.input_keys_required_from_parent.join(', ') : '',
          }}
          className="space-y-8"
        >
          {/* Section 1: LLM Configuration */}
          <Section title="LLM Configuration">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  label="Model"
                  name="llm_model"
                  // rules={[{ message: 'Please input LLM Model!' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item label="Provider" name="llm_provider">
                  <Input />
                </Form.Item>
                <Form.Item label="Top Probability" name="llm_top_probability">
                  <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Temperature" name="llm_temperature">
                  <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Max Tokens" name="llm_max_tokens" className="col-span-1 md:col-span-2">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => {
                    form.validateFields(['llm_model', 'llm_provider', 'llm_top_probability', 'llm_temperature', 'llm_max_tokens'])
                      .then(values => saveLLMConfig(values))
                      .catch(info => {
                        console.log('LLM Save Validation Failed:', info);
                      });
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus size={20} className="mr-2" />
                  Save LLM
                </Button>
              </div>
              <div className="space-y-2 mt-6">
                <h4 className="text-lg font-semibold text-gray-800">Saved LLMs</h4>
                <ul className="divide-y divide-gray-200">
                  {llmConfigs.map(llm => (
                    <li key={llm.id} className="flex items-center justify-between p-2">
                      <span>{llm.model} ({llm.provider})</span>
                      <Button onClick={() => deleteLLMConfig(llm.id)} danger icon={<Trash2 size={16} />} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* Section 2: MCP Tools Configuration */}
          <Section title="MCP Tools Configuration">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  label="Tool Name"
                  name="tool_name"
                >
                  <Input />
                </Form.Item>
                {/* 2. In MCP tool config: Tool Connection Type Selection */}
                <Form.Item label="Connection Type" name="tool_connection_type" initialValue="stdio">
                  <RadioGroup onChange={(e) => setNewToolConnectionType(e.target.value)}>
                    <Radio value="stdio">Stdio</Radio>
                    <Radio value="sse">SSE</Radio>
                  </RadioGroup>
                </Form.Item>

                {newToolConnectionType === 'stdio' && (
                  <>
                    <Form.Item label="Command (Stdio)" name="tool_command">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Arguments (comma separated)" name="tool_arguments">
                      <Input placeholder="arg1, arg2, arg3" />
                    </Form.Item>
                  </>
                )}

                {newToolConnectionType === 'sse' && (
                  <>
                    <Form.Item label="Connection URL (SSE)" name="sse_connection_url">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Bearer Token (SSE)" name="sse_bearer_token">
                      <Input.Password placeholder="Optional bearer token" />
                    </Form.Item>
                  </>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => {
                    let fieldsToValidate = ['tool_name'];
                    if (newToolConnectionType === 'stdio') {
                      fieldsToValidate.push('tool_command');
                    } else { // sse
                      fieldsToValidate.push('sse_connection_url');
                    }

                    form.validateFields(fieldsToValidate)
                      .then(values => saveToolConfig(values))
                      .catch(info => {
                        console.log('Tool Save Validation Failed:', info);
                      });
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus size={20} className="mr-2" />
                  Save Tool
                </Button>
              </div>
              <div className="space-y-2 mt-6">
                <h4 className="text-lg font-semibold text-gray-800">Saved Tools</h4>
                <ul className="divide-y divide-gray-200">
                  {toolConfigs.map(tool => (
                    <li key={tool.name} className="flex items-center justify-between p-2"> {/* Use tool.name as key */}
                      <span>{tool.name} ({'command' in tool.connection ? 'Stdio' : 'SSE'})</span>
                      <Button onClick={() => deleteToolConfig(tool.name)} danger icon={<Trash2 size={16} />} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* Section 3: Agent Details */}
          <Section title="Agent Details">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item label="Agent Name" name={['agent_config', 'name']}>
                  <Input disabled={true} />
                </Form.Item>
                <Form.Item label="Execution Framework" name="agent_execution_framework">
                  <Select>
                    <Option value="autogen">AutoGen</Option>
                    <Option value="langgraph">LangGraph</Option>
                    <Option value="crewai">CrewAI</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="is_entry_point" valuePropName="checked">
                  <Checkbox>Is Entry Point</Checkbox>
                </Form.Item>
                <Form.Item label="Select LLM" name={['agent_config', 'llm']}>
                  <Select
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    onChange={(value: string) => setSelectedLlmId(value)}
                  >
                    <Option value="">-- Select an LLM --</Option>
                    {llmConfigs.map(llm => (
                      <Option key={llm.id} value={llm.id}>{llm.model} ({llm.provider})</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Select Tools" name={['agent_config', 'tools']}>
                  <Select
                    mode="multiple"
                    placeholder="Select tools"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option: any) =>
                      typeof option?.children === 'string' && option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    onChange={(value: string[]) => setSelectedToolIds(value)}
                  >
                    {toolConfigs.map(tool => (
                      <Option key={tool.name} value={tool.name}>{tool.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Structured Response Format (JSON)" name="structured_response_format" className="col-span-1 md:col-span-2">
                  <TextArea
                    rows={4}
                    placeholder='e.g., {"output1": "value1"}'
                    onBlur={(e) => { // Validate JSON on blur
                      try {
                        JSON.parse(e.target.value);
                      } catch (error) {
                        form.setFields([{ name: 'structured_response_format', errors: ['Invalid JSON format'] }]);
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item label="Child Agent Names" name="child_agent_names">
                  <Select mode="multiple" placeholder="Select child agents">
                    {nodeNames.map(name => (
                      <Option key={name} value={name}>{name}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Parent Agent Names" name="parent_agent_names">
                  <Select mode="multiple" placeholder="Select parent agents">
                    {nodeNames.map(name => (
                      <Option key={name} value={name}>{name}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Node Invoke Condition (JSON)" name="agent_node_invoke_condition" className="col-span-1 md:col-span-2">
                  <TextArea
                    rows={4}
                    placeholder='e.g., {"output1": "value1"}'
                    onBlur={(e) => { // Validate JSON on blur
                      try {
                        JSON.parse(e.target.value);
                      } catch (error) {
                        form.setFields([{ name: 'agent_node_invoke_condition', errors: ['Invalid JSON format'] }]);
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item label="Input Keys from Parent (comma separated)" name="input_keys_required_from_parent" className="col-span-1 md:col-span-2">
                  <Input placeholder="e.g. key1, key2, key3" />
                </Form.Item>
                <Form.Item label="Goal" name={['agent_config', 'goal']} className="md:col-span-2">
                  <TextArea rows={4} />
                </Form.Item>
                <Form.Item label="Detailed Prompt" name={['agent_config', 'detailed_prompt']} className="md:col-span-2">
                  <TextArea rows={4} />
                </Form.Item>
                <Form.Item label="Responsibility" name={['agent_config', 'agent_responsibility']} className="md:col-span-2">
                  <TextArea rows={4} />
                </Form.Item>
                <Form.Item label="Expected Output" name={['agent_config', 'expected_output']} className="md:col-span-2">
                  <TextArea rows={4} />
                </Form.Item>
                <Form.Item name={['agent_config', 'stream_output']} valuePropName="checked">
                  <Checkbox>Stream Output</Checkbox>
                </Form.Item>
              </div>
            </div>
          </Section>

          {/* Save Button */}
          <div className="flex justify-end p-4">
            <Button type="primary" htmlType="submit" size="large" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg">
              <Save size={20} className="mr-2" />
              Save Configuration
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CustomWorkflowInputForm;