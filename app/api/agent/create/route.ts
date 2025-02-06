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
    // Debug the raw request
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );
    const rawBody = await request.text();
    console.log("Raw request body:", rawBody);

    // Parse the body
    const body = JSON.parse(rawBody);
    console.log("Parsed request body:", body);

    // Generate a simple ID
    const agentId = `agent_${Date.now()}`;

    // Start the process asynchronously
    (async () => {
      try {
        // Step 1: Store initial configuration
        await updateProgress(agentId, "storing_initial_config");
        const initialConfig = await storeInitialConfig({
          name: body.agentName,
          user_id: body.userId, // This matches the interface in store-initial-config.ts
          description: body.description,
          primaryModel: body.primaryModel,
          fallbackModel: body.fallbackModel,
          systemPrompt: body.systemPrompt,
          knowledgeBase: body.knowledgeBase || [],
          agentIcon: body.agentIcon || null,
          userMessageColor: body.userMessageColor,
          agentMessageColor: body.agentMessageColor,
          openingMessage: body.openingMessage,
          quickMessages: body.quickMessages || [],
          isPaid: body.isPaid || false,
          isPublic: body.isPublic || false,
        });

        // Step 2: Create vector DB (if documents exist)
        if (body.knowledgeBase?.length > 0) {
          await updateProgress(agentId, "creating_vectordb");
          const documentUrls = body.knowledgeBase.map(
            (doc: { url: any }) => doc.url
          );
          await createVectorDB(documentUrls);
        }

        // Step 3: Update configuration
        await updateProgress(agentId, "updating_config");
        await updateConfig({
          id: initialConfig.id, // Use the ID from initialConfig
          documentUrls:
            body.knowledgeBase?.map((doc: { url: any }) => doc.url) || [],
          logoUrl: body.agentIcon?.url,
          vectorDbConfig: null,
        });

        // Step 4: Deploy agent
        await updateProgress(agentId, "deploying_agent");
        const deployment = await deployAgent({
          agentId: initialConfig.id, // Use the ID from initialConfig
          name: body.agentName,
          vectorDbConfig: null,
        });

        // Step 5: Finalize
        await updateProgress(agentId, "finalizing_agent");
        await finalizeAgent({
          agentId: initialConfig.id, // Use the ID from initialConfig
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
