import { createClient } from "@/utils/supabase/server";

interface StoreInitialConfigParams {
  agent_id: string;
  name: string;
  user_id: string;
  description: string;
  primaryModel: "openai" | "claude" | "deepseek";
  fallbackModel: "openai" | "claude" | "deepseek";
  systemPrompt: string;
  knowledgeBase?: Array<{
    name: string;
    size: number;
    type: string;
    file: any;
    url: string;
  }>;
  agentIcon?: {
    name: string;
    size: number;
    type: string;
    file: any;
    url: string;
  };
  userMessageColor: string;
  agentMessageColor: string;
  openingMessage: string;
  quickMessages: string[];
  isPaid: boolean;
  isPublic: boolean;
}

async function updateAgentStatus(agent_id: string, status: string) {
  const supabase = await createClient(true);
  await supabase.from("agents").update({ status }).eq("id", agent_id);
}

export async function storeInitialConfig(params: StoreInitialConfigParams) {
  console.log("Storing initial config with params:", params);

  if (!params.user_id) {
    throw new Error("user_id is required");
  }

  if (!params.agent_id) {
    throw new Error("agent_id is required");
  }

  const supabase = await createClient(true);

  try {
    // Update status to storing_initial_config
    await updateAgentStatus(params.agent_id, "storing_initial_config");

    // Prepare the data with null checks
    const data = {
      agent_id: params.agent_id,
      agent_name: params.name || "",
      user_id: params.user_id,
      status: "storing_initial_config",
      description: params.description || "",
      primary_model: params.primaryModel || "claude",
      fallback_model: params.fallbackModel || "claude",
      system_prompt: params.systemPrompt || "",
      knowledge_base: {
        files: params.knowledgeBase || [],
      },
      agent_icon: params.agentIcon || null,
      user_message_color: params.userMessageColor || "#F0F9FF",
      agent_message_color: params.agentMessageColor || "#E0F2FE",
      opening_message: params.openingMessage || "",
      quick_messages: params.quickMessages || [],
      document_urls: params.knowledgeBase?.map((doc) => doc.url) || [],
      creation_progress: {
        state: "storing_initial_config",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error: null,
      },
      is_paid: params.isPaid || false,
      is_public: params.isPublic || false,
    };

    console.log("Inserting data into Supabase:", data);

    const { data: result, error } = await supabase
      .from("agents")
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error("Error storing initial config:", error);
      throw new Error(`Failed to store initial config: ${error.message}`);
    }

    console.log("Successfully stored initial config:", result);

    // After successful creation, update status to next state
    await updateAgentStatus(params.agent_id, "creating_vectordb");

    return {
      id: result.id,
      name: result.agent_name,
      user_id: result.user_id,
      document_urls: result.document_urls as string[],
      logo_url: result.agent_icon ? (result.agent_icon as any).url : null,
      creation_progress: result.creation_progress,
    };
  } catch (error) {
    // Update status to failed if there's an error
    await updateAgentStatus(params.agent_id, "failed");
    throw error;
  }
}
