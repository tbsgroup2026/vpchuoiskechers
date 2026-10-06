export interface AIModelProviderConfig {
  provider: "gemini" | "groq" | "openrouter" | "ollama";
  modelName: string;
  apiKeyEnvVar?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
}

export interface AIAppConfig {
  primaryCloud: AIModelProviderConfig;
  fallbackCloud: AIModelProviderConfig[];
  localModel: AIModelProviderConfig;
  piiMaskingEnabled: boolean;
  defaultAccessLabel: "public" | "internal";
}

export const AI_CONFIG: AIAppConfig = {
  primaryCloud: {
    provider: "gemini",
    modelName: process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash",
    apiKeyEnvVar: "GEMINI_API_KEY",
    maxTokens: 800,
    temperature: 0.3,
  },
  fallbackCloud: [
    {
      provider: "groq",
      modelName: process.env.GROQ_MODEL_NAME || "llama-3.1-8b-instant",
      apiKeyEnvVar: "GROQ_API_KEY",
      maxTokens: 800,
      temperature: 0.3,
    },
    {
      provider: "openrouter",
      modelName: process.env.OPENROUTER_MODEL_NAME || "meta-llama/llama-3.1-8b-instruct:free",
      apiKeyEnvVar: "OPENROUTER_API_KEY",
      baseUrl: "https://openrouter.ai/api/v1",
      maxTokens: 800,
      temperature: 0.3,
    },
  ],
  localModel: {
    provider: "ollama",
    modelName: process.env.OLLAMA_MODEL_NAME || "qwen2.5:7b",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    maxTokens: 1000,
    temperature: 0.2,
  },
  piiMaskingEnabled: true,
  defaultAccessLabel: "internal",
};
