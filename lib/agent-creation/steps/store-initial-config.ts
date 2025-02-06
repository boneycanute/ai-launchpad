interface StoreInitialConfigParams {
  name: string;
  user_id: string;
  documentUrls: string[];
  logoUrl?: string;
}

export async function storeInitialConfig(params: StoreInitialConfigParams) {
  // Simulate a delay (3 seconds)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Return simulated data
  return {
    id: `agent_${Date.now()}`,
    name: params.name,
    user_id: params.user_id,
    document_urls: params.documentUrls,
    logo_url: params.logoUrl,
    creation_progress: {
      state: "storing_initial_config",
      updated_at: new Date().toISOString(),
    },
  };
}
