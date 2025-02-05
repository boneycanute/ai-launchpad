interface DeploymentConfig {
  agentId: string;
  name: string;
  vectorDbConfig?: {
    dbUrl: string;
    documentCount: number;
  };
}

export async function deployAgent(config: DeploymentConfig) {
  // Simulate deployment time
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  return {
    deploymentUrl: `https://agent-${config.agentId}.fake-deployment.com`,
    status: 'deployed'
  };
}
