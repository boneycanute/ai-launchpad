"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { CreationState } from "../api/agent/create/route";

interface CreationStatus {
  state: CreationState;
  updated_at: string;
}

const stateOrder: CreationState[] = [
  "storing_initial_config",
  "creating_vectordb",
  "updating_config",
  "deploying_agent",
  "finalizing_agent",
  "completed",
];

const stateMessages: Record<CreationState, string> = {
  storing_initial_config: "Storing initial configuration...",
  creating_vectordb: "Creating vector database...",
  updating_config: "Updating configuration...",
  deploying_agent: "Deploying agent...",
  finalizing_agent: "Finalizing agent...",
  completed: "Agent creation completed!",
  failed: "Agent creation failed",
};

export default function CreatePage() {
  const [status, setStatus] = useState<CreationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");

  useEffect(() => {
    if (!agentId) {
      router.replace("/");
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/agent/status/${agentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          clearInterval(interval);
          return;
        }

        setStatus(data.progress);

        // Handle completion
        if (data.progress.state === "completed") {
          clearInterval(interval);
          // Navigate to the agent's page or dashboard
          setTimeout(() => {
            router.replace(`/agent/${agentId}`);
          }, 1000); // Give user a moment to see completion
        }

        // Handle failure
        if (data.progress.state === "failed") {
          clearInterval(interval);
          setError("Agent creation failed. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching status:", error);
        setError("Failed to fetch status. Please refresh the page.");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [agentId, router]);

  if (!agentId) {
    return null; // Will redirect in useEffect
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 font-medium">{error}</div>
        <button
          onClick={() => router.replace("/")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Calculate current step index based on status
  const currentStepIndex = status ? stateOrder.indexOf(status.state) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl space-y-8">
        <MultiStepLoader
          loadingStates={stateOrder.map((state) => ({
            text: stateMessages[state],
            // No process function, we'll control the state purely through status
          }))}
          loading={true}
          currentStep={currentStepIndex} // Pass the current step explicitly
          onComplete={() => {
            // Only redirect if we're actually completed
            if (status?.state === "completed") {
              router.replace(`/agent/${agentId}`);
            }
          }}
        />
      </div>
    </div>
  );
}
