import { createClient } from "@/utils/supabase/server";
import { CreationState } from "@/app/api/agent/create/route";

export async function updateAgentStatus(
  agentId: string,
  status: CreationState
) {
  const supabase = await createClient(true);

  const { error } = await supabase
    .from("agents")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("agent_id", agentId);

  if (error) {
    console.error("Error updating agent status:", error);
    throw error;
  }
}
