import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  Paper,
  Snackbar,
  Collapse, // Import Collapse component
} from '@mui/material';
import MuiAlert, { type AlertProps } from '@mui/material/Alert';
import { AddCircleOutline, RemoveCircleOutline, Save, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'; // Import arrow icons
import { type LLM, type Tool, type Agent, type Workflow, AgentFrameworks, ExecutionTypeAutogen, ExecutionTypeCrewAI, type Stdio, type Sse, ExecutionTypeLanggraph } from './interface';

// Helper function to create an empty LLM object
const createEmptyLLM = () => ({
  model: '',
  provider: '',
  top_probability: 0,
  temperature: 0,
  max_tokens: 0,
});

// Helper function to create an empty Tool object
const createEmptyTool = () => ({
  name: '',
  connection: { command: '', arguments: [] },
});

// Helper function to create an empty Agent object
const createEmptyAgent = (llmConfigs: LLM[], toolConfigs: Tool[]) => ({
  name: '',
  goal: '',
  detailed_prompt: '',
  agent_responsibility: '',
  expected_output: '',
  stream_output: false,
  tools: toolConfigs.length > 0 ? [toolConfigs[0]] : [],
  llm: llmConfigs.length > 0 ? llmConfigs[0] : createEmptyLLM(),
});

// Custom Alert component for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface WorkflowInputFormProps {
  onSave: (workflow: Workflow) => void;
  label?: string;
}

const WorkflowInputForm = ({onSave, label}: WorkflowInputFormProps) => {
  // State for workflow details
  const [workflowDetails, setWorkflowDetails] = useState<Omit<Workflow, 'agents' | 'agent_execution_framework' | 'execution_type'>>({
    name: '',
    description: '',
    task: "",
  });

  const [selectedLabel, setSelectedLabel] = useState<string>(label || '');

  useEffect(() => {
    if (label) {
      setSelectedLabel(label);
      setWorkflowDetails({ name: label, description: "", task: "" });
      setAgents([createEmptyAgent(llmConfigs, mcpTools)]);
    }
  }, [label]);

  // State for dynamic lists
  const [llmConfigs, setLlmConfigs] = useState<LLM[]>([createEmptyLLM()]);
  const [mcpTools, setMcpTools] = useState<Tool[]>([createEmptyTool()]);
  const [agents, setAgents] = useState<Agent[]>([createEmptyAgent(llmConfigs, mcpTools)]);

  // State for execution framework and reflection
  const [agentFramework, setAgentFramework] = useState<string>(AgentFrameworks.AUTOGEN);
  const [executionType, setExecutionType] = useState<string>(ExecutionTypeAutogen.ROUND_ROBIN);
  const [reflectionInstruction, setReflectionInstruction] = useState<string>('');
  const [reflectionLlm, setReflectionLlm] = useState<LLM | null>(null);

  // State for the success message snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // States for section collapse/expand
  const [openWorkflowDetails, setOpenWorkflowDetails] = useState(false);
  const [openLlmConfigs, setOpenLlmConfigs] = useState(false);
  const [openMcpTools, setOpenMcpTools] = useState(false);
  const [openAgentDetails, setOpenAgentDetails] = useState(false);
  const [openExecutionReflection, setOpenExecutionReflection] = useState(false);

  // Handlers for dynamic lists
  const handleAddLLM = () => setLlmConfigs([...llmConfigs, createEmptyLLM()]);
  const handleRemoveLLM = (index: number) => {
    const newLlmConfigs = llmConfigs.filter((_, i) => i !== index);
    setLlmConfigs(newLlmConfigs);
  };

  const handleAddTool = () => setMcpTools([...mcpTools, createEmptyTool()]);
  const handleRemoveTool = (index: number) => {
    const newMcpTools = mcpTools.filter((_, i) => i !== index);
    setMcpTools(newMcpTools);
  };

  const handleAddAgent = () => {
    setAgents([...agents, createEmptyAgent(llmConfigs, mcpTools)]);
  };
  const handleRemoveAgent = (index: number) => {
    const newAgents = agents.filter((_, i) => i !== index);
    setAgents(newAgents);
  };

  // Generic change handler for LLM fields
  const handleLlmChange = (index: number, field: keyof LLM, value: string | number) => {
    const newLlmConfigs = [...llmConfigs];
    (newLlmConfigs[index][field] as any) = value;
    setLlmConfigs(newLlmConfigs);
  };

  // Generic change handler for Tool fields
  const handleToolChange = (index: number, field: string, value: string) => {
    const newMcpTools = [...mcpTools];
    if (field === 'name') {
      newMcpTools[index].name = value;
    } else if (field === 'command') {
      (newMcpTools[index].connection as Stdio).command = value;
    } else if (field === 'arguments') {
      (newMcpTools[index].connection as Stdio).arguments = value.split(',').map(arg => arg.trim());
    } else if (field === 'connection_url') {
      (newMcpTools[index].connection as Sse).connection_url = value;
    } else if (field === 'bearer_token') {
      (newMcpTools[index].connection as Sse).bearer_token = value;
    }
    setMcpTools(newMcpTools);
  };

  // Generic change handler for Agent fields
  const handleAgentChange = (index: number, field: keyof Agent, value: any) => {
    const newAgents = [...agents];
    (newAgents[index][field] as any) = value;
    setAgents(newAgents);
  };

  // Handle saving the final workflow
  const handleSaveWorkflow = () => {
    const finalWorkflow: Workflow = {
      ...workflowDetails,
      agents,
      agent_execution_framework: agentFramework,
      execution_type: executionType,
      reflection_additional_instruction: reflectionInstruction || undefined,
      reflection_llm_config: reflectionLlm || undefined,
    };
    console.log('Final Workflow Object:', finalWorkflow);
    onSave(finalWorkflow);
    // Show the success snackbar instead of an alert
    // setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{
      backgroundColor: '#ffffff', // Changed to white
      color: '#333333', // Changed to dark grey for readability
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      py: 6,
      px: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          gutterBottom
          align="center"
          sx={{
            mb: 3,
            fontWeight: 800,
            color: 'transparent', // Make text transparent to apply gradient
            background: 'linear-gradient(45deg, #FF69B4 30%, #8A2BE2 90%)', // Purple-pink gradient
            WebkitBackgroundClip: 'text', // Apply gradient to text
            WebkitTextFillColor: 'transparent', // Hide original text color
            textShadow: '0 0 10px rgba(138, 43, 226, 0.3)', // Subtle purple shadow
          }}
        >
          Workflow Designer
        </Typography>

        <Typography
          variant="h5"
          gutterBottom
          align="center"
          sx={{
            mb: 6,
            fontWeight: 400,
            color: 'transparent', // Make text transparent to apply gradient
            background: 'linear-gradient(45deg, #FF69B4 30%, #8A2BE2 90%)', // Purple-pink gradient
            WebkitBackgroundClip: 'text', // Apply gradient to text
            WebkitTextFillColor: 'transparent', // Hide original text color
            textShadow: '0 0 10px rgba(138, 43, 226, 0.3)', // Subtle purple shadow
          }}
        >
          {selectedLabel? `Editing Workflow: ${selectedLabel}` : 'Please select a workflow'}
        </Typography>

        {/* Workflow Details */}
        <Paper elevation={8} sx={{
          p: 4, mb: 4, borderRadius: 4,
          backgroundColor: 'white', // Lighter background for paper
        //   border: '1px solid #e0e0e0', // Lighter border
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)', // Lighter shadow
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#555555', fontWeight: 'bold' }}>Workflow Details</Typography>
            <IconButton onClick={() => setOpenWorkflowDetails(!openWorkflowDetails)} aria-label="toggle workflow details">
              {openWorkflowDetails ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Box>
          <Collapse in={openWorkflowDetails}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              </Box>
              <TextField
                fullWidth
                // label="Workflow Name"
                variant="outlined"
                value={selectedLabel}
                onChange={(e) => setWorkflowDetails({ ...workflowDetails, name: e.target.value })}
                disabled={true}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#cccccc' },
                    '&:hover fieldset': { borderColor: '#8A2BE2' }, // Purple
                    '&.Mui-focused fieldset': { borderColor: '#8A2BE2', borderWidth: '2px' },
                  }
                }}
              />
              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                multiline
                rows={2}
                value={workflowDetails.description}
                onChange={(e) => setWorkflowDetails({ ...workflowDetails, description: e.target.value })}
                InputLabelProps={{ style: { color: '#888' } }}
                InputProps={{ style: { color: '#333' } }} // Darker text input
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#cccccc' },
                    '&:hover fieldset': { borderColor: '#8A2BE2' }, // Purple
                    '&.Mui-focused fieldset': { borderColor: '#8A2BE2', borderWidth: '2px' },
                  }
                }}
              />
              <TextField
                fullWidth
                label="Task"
                variant="outlined"
                multiline
                rows={2}
                value={workflowDetails.task}
                onChange={(e) => setWorkflowDetails({ ...workflowDetails, task: e.target.value })}
                InputLabelProps={{ style: { color: '#888' } }}
                InputProps={{ style: { color: '#333' } }} // Darker text input
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#cccccc' },
                    '&:hover fieldset': { borderColor: '#8A2BE2' }, // Purple
                    '&.Mui-focused fieldset': { borderColor: '#8A2BE2', borderWidth: '2px' },
                  }
                }}
              />
            </Box>
          </Collapse>
        </Paper>

        {/* LLM Configuration */}
        <Paper elevation={8} sx={{
          p: 4, mb: 4, borderRadius: 4,
          backgroundColor: 'white', // Lighter background for paper
          // border: '1px solid #e0e0e0', // Lighter border
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)', // Lighter shadow
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#555555', fontWeight: 'bold' }}>LLM Configurations</Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddCircleOutline />}
                onClick={handleAddLLM}
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(45deg, #FF69B4 30%, #8A2BE2 90%)', // Purple-pink gradient
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF69B4 40%, #8A2BE2 100%)', // Slightly shifted gradient on hover
                  },
                  borderRadius: 2,
                  color: '#ffffff', // White text for buttons
                  mr: 1, // Add margin to separate from the icon button
                }}
              >
                Add LLM
              </Button>
              <IconButton onClick={() => setOpenLlmConfigs(!openLlmConfigs)} aria-label="toggle LLM configurations">
                {openLlmConfigs ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
            </Box>
          </Box>
          <Collapse in={openLlmConfigs}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {llmConfigs.map((llm, index) => (
                <Paper key={index} sx={{ p: 3, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #f0f0f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#444' }}>LLM {index + 1}</Typography>
                    {llmConfigs.length > 1 && (
                      <IconButton onClick={() => handleRemoveLLM(index)} color="error" sx={{ '&:hover': { color: '#d32f2f' } }}>
                        <RemoveCircleOutline />
                      </IconButton>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <TextField fullWidth label="Model" value={llm.model} onChange={(e) => handleLlmChange(index, 'model', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                    <TextField fullWidth label="Provider" value={llm.provider} onChange={(e) => handleLlmChange(index, 'provider', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                    <TextField fullWidth label="Top Probability" type="number" value={llm.top_probability} onChange={(e) => handleLlmChange(index, 'top_probability', parseFloat(e.target.value))} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                    <TextField fullWidth label="Temperature" type="number" value={llm.temperature} onChange={(e) => handleLlmChange(index, 'temperature', parseFloat(e.target.value))} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                    <TextField fullWidth label="Max Tokens" type="number" value={llm.max_tokens} onChange={(e) => handleLlmChange(index, 'max_tokens', parseInt(e.target.value))} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                  </Box>
                </Paper>
              ))}
            </Box>
          </Collapse>
        </Paper>

        {/* MCP Tools Configuration */}
        <Paper elevation={8} sx={{
          p: 4, mb: 4, borderRadius: 4,
          backgroundColor: 'white', // Lighter background for paper
          // border: '1px solid #e0e0e0', // Lighter border
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)', // Lighter shadow
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#555555', fontWeight: 'bold' }}>MCP Tools</Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddCircleOutline />}
                onClick={handleAddTool}
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(45deg, #FF69B4 30%, #8A2BE2 90%)', // Purple-pink gradient
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF69B4 40%, #8A2BE2 100%)', // Slightly shifted gradient on hover
                  },
                  borderRadius: 2,
                  color: '#ffffff', // White text for buttons
                  mr: 1,
                }}
              >
                Add Tool
              </Button>
              <IconButton onClick={() => setOpenMcpTools(!openMcpTools)} aria-label="toggle MCP tools">
                {openMcpTools ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
            </Box>
          </Box>
          <Collapse in={openMcpTools}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {mcpTools.map((tool, index) => (
                <Paper key={index} sx={{ p: 3, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #f0f0f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#444' }}>Tool {index + 1}</Typography>
                    {mcpTools.length > 1 && (
                      <IconButton onClick={() => handleRemoveTool(index)} color="error">
                        <RemoveCircleOutline />
                      </IconButton>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <TextField fullWidth label="Tool Name" value={tool.name} onChange={(e) => handleToolChange(index, 'name', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: '#888' }}>Connection Type</InputLabel>
                        <Select
                          value={'command' in tool.connection ? 'stdio' : 'sse'}
                          label="Connection Type"
                          onChange={(e) => {
                            const newMcpTools = [...mcpTools];
                            if (e.target.value === 'stdio') {
                              newMcpTools[index].connection = { command: '', arguments: [] };
                            } else {
                              newMcpTools[index].connection = { connection_url: '' };
                            }
                            setMcpTools(newMcpTools);
                          }}
                          sx={{
                            color: '#333',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cccccc' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                            '& .MuiSvgIcon-root': { color: '#888' }
                          }}
                        >
                          <MenuItem value="stdio">Stdio</MenuItem>
                          <MenuItem value="sse">SSE</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    {'command' in tool.connection ? (
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                        <TextField fullWidth label="Command" value={tool.connection.command} onChange={(e) => handleToolChange(index, 'command', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                        <TextField fullWidth label="Arguments (comma-separated)" value={tool.connection.arguments.join(', ')} onChange={(e) => handleToolChange(index, 'arguments', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                        <TextField fullWidth label="Connection URL" value={tool.connection.connection_url} onChange={(e) => handleToolChange(index, 'connection_url', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                        <TextField fullWidth label="Bearer Token (optional)" value={tool.connection.bearer_token || ''} onChange={(e) => handleToolChange(index, 'bearer_token', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                      </Box>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          </Collapse>
        </Paper>

        {/* Agent Details */}
        <Paper elevation={8} sx={{
          p: 4, mb: 4, borderRadius: 4,
          backgroundColor: 'white', // Lighter background for paper
          // border: '1px solid #e0e0e0', // Lighter border
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)', // Lighter shadow
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#555555', fontWeight: 'bold' }}>Agent Details</Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddCircleOutline />}
                onClick={handleAddAgent}
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(45deg, #FF69B4 30%, #8A2BE2 90%)', // Purple-pink gradient
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF69B4 40%, #8A2BE2 100%)', // Slightly shifted gradient on hover
                  },
                  borderRadius: 2,
                  color: '#ffffff', // White text for buttons
                  mr: 1,
                }}
              >
                Add Agent
              </Button>
              <IconButton onClick={() => setOpenAgentDetails(!openAgentDetails)} aria-label="toggle agent details">
                {openAgentDetails ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
            </Box>
          </Box>
          <Collapse in={openAgentDetails}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {agents.map((agent, index) => (
                <Paper key={index} sx={{ p: 3, borderRadius: 2, backgroundColor: '#ffffff', border: '1px solid #f0f0f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#444' }}>Agent {index + 1}</Typography>
                    {agents.length > 1 && (
                      <IconButton onClick={() => handleRemoveAgent(index)} color="error">
                        <RemoveCircleOutline />
                      </IconButton>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <TextField fullWidth label="Agent Name" value={agent.name} onChange={(e) => handleAgentChange(index, 'name', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                      <TextField fullWidth label="Goal" value={agent.goal} onChange={(e) => handleAgentChange(index, 'goal', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                    </Box>
                    <TextField fullWidth label="Detailed Prompt" multiline rows={2} value={agent.detailed_prompt} onChange={(e) => handleAgentChange(index, 'detailed_prompt', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                    <TextField fullWidth label="Agent Responsibility" multiline rows={2} value={agent.agent_responsibility} onChange={(e) => handleAgentChange(index, 'agent_responsibility', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                    <TextField fullWidth label="Expected Output" value={agent.expected_output} onChange={(e) => handleAgentChange(index, 'expected_output', e.target.value)} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }} />
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: '#888' }}>LLM Configuration</InputLabel>
                        <Select
                          value={agent.llm.model}
                          label="LLM Configuration"
                          onChange={(e) => {
                            const selectedLlm = llmConfigs.find(llm => llm.model === e.target.value);
                            if (selectedLlm) {
                              handleAgentChange(index, 'llm', selectedLlm);
                            }
                          }}
                          disabled={llmConfigs.length === 0}
                          sx={{
                            color: '#333',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cccccc' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                            '& .MuiSvgIcon-root': { color: '#888' }
                          }}
                        >
                          {llmConfigs.map((llm, llmIndex) => (
                            <MenuItem key={llmIndex} value={llm.model}>
                              {llm.model} ({llm.provider})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: '#888' }}>Tools</InputLabel>
                        <Select
                          multiple
                          value={agent.tools.map(tool => tool.name)}
                          label="Tools"
                          onChange={(e) => {
                            const selectedToolNames = e.target.value as string[];
                            const selectedTools = mcpTools.filter(tool => selectedToolNames.includes(tool.name));
                            handleAgentChange(index, 'tools', selectedTools);
                          }}
                          disabled={mcpTools.length === 0}
                          sx={{
                            color: '#333',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cccccc' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                            '& .MuiSvgIcon-root': { color: '#888' }
                          }}
                        >
                          {mcpTools.map((tool, toolIndex) => (
                            <MenuItem key={toolIndex} value={tool.name}>
                              {tool.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <FormControlLabel
                      control={<Switch checked={agent.stream_output} onChange={(e) => handleAgentChange(index, 'stream_output', e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#8A2BE2' } }} />}
                      label={<Typography sx={{ color: '#333' }}>Stream Output</Typography>}
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          </Collapse>
        </Paper>

        {/* Execution Framework and Reflection */}
        <Paper elevation={8} sx={{
          p: 4, mb: 4, borderRadius: 4,
          backgroundColor: 'white', // Lighter background for paper
          // border: '1px solid #e0e0e0', // Lighter border
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)', // Lighter shadow
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#555555', fontWeight: 'bold' }}>Execution & Reflection</Typography>
            <IconButton onClick={() => setOpenExecutionReflection(!openExecutionReflection)} aria-label="toggle execution and reflection">
              {openExecutionReflection ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Box>
          <Collapse in={openExecutionReflection}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#888' }}>Agent Execution Framework</InputLabel>
                  <Select
                    value={agentFramework}
                    label="Agent Execution Framework"
                    onChange={(e) => {
                      setAgentFramework(e.target.value);
                      if (e.target.value === AgentFrameworks.AUTOGEN) {
                        setExecutionType(ExecutionTypeAutogen.ROUND_ROBIN);
                      } else if (e.target.value === AgentFrameworks.CREWAI) {
                        setExecutionType(ExecutionTypeCrewAI.SEQUENTIAL);
                      } else if (e.target.value === AgentFrameworks.LANGGRAPH) {
                        setExecutionType(ExecutionTypeLanggraph.SUPERVISOR);
                      }
                    }}
                    sx={{
                      color: '#333',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cccccc' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                      '& .MuiSvgIcon-root': { color: '#888' }
                    }}
                  >
                    {Object.values(AgentFrameworks).map((framework) => (
                      <MenuItem key={framework} value={framework}>{framework}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth disabled={!executionType}>
                  <InputLabel sx={{ color: '#888' }}>Execution Type</InputLabel>
                  <Select
                    value={executionType}
                    label="Execution Type"
                    onChange={(e) => setExecutionType(e.target.value)}
                    sx={{
                      color: '#333',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cccccc' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                      '& .MuiSvgIcon-root': { color: '#888' }
                    }}
                  >
                    {agentFramework === AgentFrameworks.AUTOGEN && Object.values(ExecutionTypeAutogen).map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                    {agentFramework === AgentFrameworks.CREWAI && Object.values(ExecutionTypeCrewAI).map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                    {agentFramework === AgentFrameworks.LANGGRAPH && Object.values(ExecutionTypeLanggraph).map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                    {/* {agentFramework === AgentFrameworks.LANGGRAPH && (
                      <MenuItem value="default">Default</MenuItem>
                    )} */}
                  </Select>
                </FormControl>
              </Box>
              <TextField
                fullWidth
                label="Reflection Additional Instruction (optional)"
                multiline
                rows={2}
                value={reflectionInstruction}
                onChange={(e) => setReflectionInstruction(e.target.value)}
                InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#333' } }}
              />
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#888' }}>Reflection LLM Config</InputLabel>
                <Select
                  value={reflectionLlm?.model}
                  label="Reflection LLM Config"
                  onChange={(e) => {
                    const selectedLlm = llmConfigs.find(llm => llm.model === e.target.value);
                    setReflectionLlm(selectedLlm || null);
                  }}
                  sx={{
                    color: '#333',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cccccc' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8A2BE2' },
                    '& .MuiSvgIcon-root': { color: '#888' }
                  }}
                >
                  {llmConfigs.map((llm, index) => (
                    <MenuItem key={index} value={llm.model}>
                      {llm.model} ({llm.provider})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Collapse>
        </Paper>

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveWorkflow}
            size="large"
            startIcon={<Save />}
            sx={{
              fontWeight: 'bold',
              px: 6,
              py: 1.5,
              borderRadius: 3,
              background: 'linear-gradient(45deg, #FF69B4 30%, #8A2BE2 90%)', // Purple-pink gradient
              boxShadow: '0 4px 20px rgba(138, 43, 226, 0.4)', // Purple shadow
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 6px 25px rgba(138, 43, 226, 0.6)', // Darker purple shadow on hover
                background: 'linear-gradient(45deg, #FF69B4 40%, #8A2BE2 100%)', // Slightly shifted gradient on hover
              },
              color: '#ffffff', // White text for the button
            }}
          >
            Save Workflow
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default WorkflowInputForm;