import { NextResponse } from "next/server";
import { CreationState } from "../../create/route";
import { createClient } from "@/utils/supabase/server";

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
  try {
    // Await the params to fix the Next.js warning
    const { agentId } = await Promise.resolve(context.params);

    const supabase = await createClient(true);
    const { data, error } = await supabase
      .from("agents")
      .select("status, updated_at")
      .eq("agent_id", agentId)
      .single();

    if (error) {
      console.error("Error fetching agent status:", error);
      return NextResponse.json(
        { error: "Failed to fetch agent status" },
        { status: 500 }
      );
    }

    // If no data found, return initial state
    if (!data) {
      return NextResponse.json({
        success: true,
        progress: {
          state: "storing_initial_config" as CreationState,
          updated_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      progress: {
        state: data.status as CreationState,
        updated_at: data.updated_at,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
