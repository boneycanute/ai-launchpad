import { updateAgentStatus } from "../utils";

interface UpdatedConfig {
  id: string;
  updated_at: string;
}

interface UpdateConfigParams {
  agentId: string;
  id: string;
}

export async function updateConfig({ agentId, id }: UpdateConfigParams): Promise<UpdatedConfig> {
  try {
    // Update status to current step
    await updateAgentStatus(agentId, "updating_config");

    // Simulate processing time (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update to next step
    await updateAgentStatus(agentId, "deploying_agent");

    // Return dummy data
    return {
      id,
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    // Update status to failed if there's an error
    await updateAgentStatus(agentId, "failed");
    throw error;
  }
}
