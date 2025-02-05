"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { IconSquareRoundedX } from "@tabler/icons-react";
import { useAgentStore } from "@/store/agent-store";
import { useAgentStatus } from "@/hooks/use-agent-status";
import { CreationState } from "@/lib/types/agent";

// Map creation states to user-friendly messages
const stateMessages: Record<CreationState, string> = {
  storing_config: "Storing your configuration...",
  processing_documents: "Processing your knowledge base...",
  creating_vectordb: "Creating vector database...",
  initializing_agent: "Initializing AI agent...",
  configuring_agent: "Configuring agent with your settings...",
  final_checks: "Running final checks...",
  completed: "Your AI agent is ready!"
};

// Order of states for the loader
const stateOrder: CreationState[] = [
  "storing_config",
  "processing_documents",
  "creating_vectordb",
  "initializing_agent",
  "configuring_agent",
  "final_checks",
  "completed"
];

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');
  const { progress, error } = useAgentStatus(agentId);
  const [loading, setLoading] = useState(true);

  // If no agentId is provided, redirect back to home
  useEffect(() => {
    if (!agentId) {
      router.push('/');
    }
  }, [agentId, router]);

  // Convert progress to loader states
  const loadingStates = stateOrder.map(state => ({
    text: stateMessages[state],
    process: async () => {
      // Return true if this state is completed
      if (!progress) return false;
      const currentStateIndex = stateOrder.indexOf(progress.state);
      const thisStateIndex = stateOrder.indexOf(state);
      return currentStateIndex > thisStateIndex;
    }
  }));

  const handleComplete = () => {
    router.push("/agents");
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      setLoading(false);
    }
  }, [error]);

  if (!agentId) {
    return null; // or loading spinner
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <MultiStepLoader
          loadingStates={loadingStates}
          loading={loading}
          onComplete={handleComplete}
        />
        {loading && (
          <button
            className="fixed top-4 right-4 text-black dark:text-white z-[120]"
            onClick={() => setLoading(false)}
          >
            <IconSquareRoundedX className="h-10 w-10" />
          </button>
        )}
      </div>
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-red-50 text-red-500 px-4 py-2 rounded-lg shadow-lg">
            Error: {error}
          </div>
        </div>
      )}
    </div>
  );
}
