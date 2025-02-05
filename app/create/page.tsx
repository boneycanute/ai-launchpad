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
  storing_initial_config: "Storing initial configuration...",
  creating_vectordb: "Creating vector database...",
  updating_config: "Storing final configuration...",
  deploying_agent: "Deploying your AI agent...",
  finalizing_agent: "Running final checks...",
  completed: "Your AI agent is ready!",
  failed: "Failed to create agent",
};

// Order of states for the loader
const stateOrder: CreationState[] = [
  "storing_initial_config",
  "creating_vectordb",
  "updating_config",
  "deploying_agent",
  "finalizing_agent",
  "completed",
];

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");
  const [currentStep, setCurrentStep] = useState(0);

  const { progress: status, error } = useAgentStatus(agentId || "");

  useEffect(() => {
    if (!agentId) {
      router.push("/");
      return;
    }

    if (status?.state === "failed") {
      const errorMessage = encodeURIComponent(
        status.error || "Agent creation failed"
      );
      router.push(`/error?error=${errorMessage}`);
      return;
    }

    if (status?.state) {
      const stepIndex = stateOrder.indexOf(status.state);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }

      if (status.state === "completed") {
        // Redirect to the agent page or dashboard
        router.push(`/agent/${agentId}`);
      }
    }
  }, [status, agentId, router]);

  if (!agentId) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Creating Your AI Agent
        </h1>
        <MultiStepLoader
          loadingStates={stateOrder.map((state) => ({
            text: stateMessages[state],
            process: async () => {
              // Wait for the current state to match or pass this state
              return (
                status?.state === state ||
                (status?.state && stateOrder.indexOf(status.state) > stateOrder.indexOf(state))
              );
            },
          }))}
          loading={!!status && status.state !== "completed" && status.state !== "failed"}
          onComplete={() => {
            // Only redirect if we're actually completed
            if (status?.state === "completed") {
              router.push(`/agent/${agentId}`);
            }
          }}
        />
      </div>
    </div>
  );
}
