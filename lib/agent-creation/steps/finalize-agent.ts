import { updateAgentStatus } from "../utils";

interface FinalizeConfig {
  status: string;
  timestamp: string;
}

interface FinalizeAgentParams {
  agentId: string;
}

export async function finalizeAgent({ agentId }: FinalizeAgentParams): Promise<FinalizeConfig> {
  try {
    // Update status to current step
    await updateAgentStatus(agentId, "finalizing_agent");

    // Simulate finalization time (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update to completed
    await updateAgentStatus(agentId, "completed");

    // Return dummy data
    return {
      status: "success",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    // Update status to failed if there's an error
    await updateAgentStatus(agentId, "failed");
    throw error;
  }
}
