import { NextResponse } from "next/server";
import { CreationState } from "../../create/route";

// Total delays from the creation steps:
// - store-initial-config: 3s
// - create-vectordb: 5s
// - store-config: 2s
// - deploy-agent: 10s
// - finalize-agent: 2s
// Total: 22s

export async function GET(
  request: Request,
  context: { params: { agentId: string } }
) {
  const { agentId } = await context.params;

  // Extract timestamp from agent ID (format: agent_[timestamp])
  const timestamp = parseInt(agentId.split("_")[1]);
  const elapsedSeconds = (Date.now() - timestamp) / 1000;

  let state: CreationState;

  if (elapsedSeconds < 3) {
    state = "storing_initial_config";
  } else if (elapsedSeconds < 8) {
    // 3 + 5
    state = "creating_vectordb";
  } else if (elapsedSeconds < 10) {
    // 3 + 5 + 2
    state = "updating_config";
  } else if (elapsedSeconds < 20) {
    // 3 + 5 + 2 + 10
    state = "deploying_agent";
  } else if (elapsedSeconds < 22) {
    // 3 + 5 + 2 + 10 + 2
    state = "finalizing_agent";
  } else {
    state = "completed";
  }

  return NextResponse.json({
    success: true,
    progress: {
      state,
      updated_at: new Date().toISOString(),
    },
  });
}
