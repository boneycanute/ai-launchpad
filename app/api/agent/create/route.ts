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
    // Parse the body
    const body = await request.json();
    console.log("Parsed request body:", body);

    // Use the provided agent_id from the request
    const agentId = body.agent_id;

    // Start the process asynchronously
    (async () => {
      try {
        // Step 1: Store initial configuration
        const initialConfig = await storeInitialConfig({
          agent_id: agentId,
          name: body.agentName,
          user_id: body.userId,
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

        console.log("[Main route] Initial config stored:", initialConfig);

        // Step 2: Create vector DB (placeholder)
        await createVectorDB({
          agentId,
          userId: body.userId,
          knowledgeBase: body.knowledgeBase || [],
        });

        // Step 3: Update config (placeholder)
        await updateConfig({
          agentId,
          id: agentId,
        });

        // Step 4: Deploy agent (placeholder)
        await deployAgent({
          agentId,
        });

        // Step 5: Finalize agent (placeholder)
        await finalizeAgent({
          agentId,
        });
      } catch (error) {
        console.error("Agent creation failed:", error);
      }
    })();

    // Return success response immediately
    return NextResponse.json({
      success: true,
      message: "Agent creation started",
      agent_id: agentId,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
