import { NextResponse } from "next/server";
import { storeInitialConfig } from "@/lib/agent-creation/steps/store-initial-config";
import { createVectorDB } from "@/lib/agent-creation/steps/create-vectordb";
import { updateConfig } from "@/lib/agent-creation/steps/store-config";
import { deployAgent } from "@/lib/agent-creation/steps/deploy-agent";
import { finalizeAgent } from "@/lib/agent-creation/steps/finalize-agent";

export type CreationState =
  | "storing_initial_config"
  | "creating_vectordb"
  | "updating_config"
  | "deploying_agent"
  | "finalizing_agent"
  | "completed"
  | "failed";

// Simple console logging for now
async function updateProgress(agentId: string, state: CreationState) {
  console.log(`[${agentId}] Current state:`, state);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Generate a simple ID
    const agentId = `agent_${Date.now()}`;

    // Start the process asynchronously
    (async () => {
      try {
        // Step 1: Store initial configuration
        await updateProgress(agentId, "storing_initial_config");
        await storeInitialConfig({
          name: body.name,
          user_id: body.user_id,
          documentUrls: body.documentUrls,
          logoUrl: body.logoUrl,
        });

        // Step 2: Create vector DB (if documents exist)
        if (body.documentUrls?.length > 0) {
          await updateProgress(agentId, "creating_vectordb");
          await createVectorDB(body.documentUrls);
        }

        // Step 3: Update configuration
        await updateProgress(agentId, "updating_config");
        await updateConfig({
          id: agentId,
          documentUrls: body.documentUrls,
          logoUrl: body.logoUrl,
          vectorDbConfig: null,
        });

        // Step 4: Deploy agent
        await updateProgress(agentId, "deploying_agent");
        const deployment = await deployAgent({
          agentId,
          name: body.name,
          vectorDbConfig: null,
        });

        // Step 5: Finalize
        await updateProgress(agentId, "finalizing_agent");
        await finalizeAgent({
          agentId,
          deploymentUrl: deployment.deploymentUrl,
        });

        await updateProgress(agentId, "completed");
      } catch (error) {
        console.error("Agent creation failed:", error);
        await updateProgress(agentId, "failed");
      }
    })();

    // Return immediately with the agent ID
    return NextResponse.json({
      success: true,
      agentId,
      message: "Agent creation started",
    });
  } catch (error) {
    console.error("Failed to start agent creation:", error);
    return NextResponse.json(
      { success: false, message: "Failed to start agent creation" },
      { status: 500 }
    );
  }
}
