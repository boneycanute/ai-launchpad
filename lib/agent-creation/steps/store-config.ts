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

interface UpdateConfigParams {
  id: string;
  documentUrls: string[];
  logoUrl?: string;
  vectorDbConfig?: {
    collectionId: string;
    documentCount: number;
  } | null;
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

export async function updateConfig(params: UpdateConfigParams) {
  // Simulate config update (2 seconds)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return simulated data
  return {
    id: params.id,
    document_urls: params.documentUrls,
    logo_url: params.logoUrl,
    vector_db_config: params.vectorDbConfig,
    updated_at: new Date().toISOString(),
  };
}
