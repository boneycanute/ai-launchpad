interface AgentConfig {
  name: string;
  documentUrls?: string[];
  logoUrl?: string;
  vectorDbConfig?: {
    dbUrl: string;
    documentCount: number;
  };
  // Add other config fields
}

interface UpdatedConfig {
  id: string;
  documentUrls?: string[];
  logoUrl?: string;
  vectorDbConfig?: {
    dbUrl: string;
    documentCount: number;
  };
}

export async function storeConfig(config: AgentConfig) {
  // Simulate database storage time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    id: `agent_${Date.now()}`,
    ...config,
    createdAt: new Date().toISOString()
  };
}

export async function updateConfig(config: UpdatedConfig) {
  // Simulate updating config in database
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    ...config,
    updatedAt: new Date().toISOString()
  };
}
