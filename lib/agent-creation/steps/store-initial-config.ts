interface InitialConfig {
  name: string;
  user_id: string;
  documentUrls?: string[];
  logoUrl?: string;
  // Add other initial config fields
}

export async function storeInitialConfig(config: InitialConfig) {
  // Simulate storing initial config
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    id: `agent_${Date.now()}`,
    ...config,
    creation_progress: {
      state: 'storing_initial_config',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };
}
