import { useState, useEffect } from 'react';
import { CreationState } from '@/lib/types/agent';

interface AgentProgress {
  state: CreationState;
  started_at: string;
  updated_at: string;
  error?: string;
}

export function useAgentStatus(agentId: string | null) {
  const [progress, setProgress] = useState<AgentProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/agent/status/${agentId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message);
        }

        setProgress(data.progress);
        
        // Keep polling if not completed or failed
        if (data.progress.state !== 'completed' && !data.progress.error) {
          setTimeout(checkStatus, 2000); // Poll every 2 seconds
        }

      } catch (err) {
        setError(err.message);
      }
    };

    checkStatus();

    // Cleanup on unmount
    return () => {
      setProgress(null);
      setError(null);
    };
  }, [agentId]);

  return { progress, error };
}
