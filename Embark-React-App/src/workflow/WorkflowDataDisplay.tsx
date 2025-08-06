
interface WorkflowDataDisplayProps {
  workflowName: string | null;
}

export default function WorkflowDataDisplay({workflowName}: WorkflowDataDisplayProps) {
  return (
    <div>WorkflowDataDisplay = {workflowName}</div>
  )
}
