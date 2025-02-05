export type CreationState = 
  | 'storing_initial_config'
  | 'creating_vectordb'
  | 'updating_config'
  | 'deploying_agent'
  | 'finalizing_agent'
  | 'completed'
  | 'failed';

export interface AgentConfig {
  id: string;
  user_id: string;
  name: string;
  creation_progress: {
    state: CreationState;
    started_at: string;
    updated_at: string;
    error?: string;
  };
  documentUrls?: string[];
  logoUrl?: string;
  vectorDbConfig?: {
    dbUrl: string;
    documentCount: number;
  };
  deploymentUrl?: string;
}
