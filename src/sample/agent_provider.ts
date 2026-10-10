// Auto-healed by NeatPatch: fixed model sunset 404 crash
export interface ModelConfig {
  provider: string;
  model: string;
  maxTokens: number;
}

export function getAgentConfig(): ModelConfig {
  // Fixed: Fallback to active supported model (gemini-1.5-flash)
  return {
    provider: "google-genai",
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    maxTokens: 2048
  };
}

export function callAgentProvider(config: ModelConfig): { success: boolean; activeModel: string } {
  if (config.model === "gemini-2.5-flash") {
    throw new Error("GoogleGenAIError: 404 Not Found: models/gemini-2.5-flash is discontinued.");
  }
  return { success: true, activeModel: config.model };
}
