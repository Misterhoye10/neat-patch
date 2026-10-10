import type { AgentGoal } from "../agent/types.js";

export interface RealWorldBugScenario {
  id: string;
  name: string;
  category: "SDK_DEPRECATION" | "SCHEMA_DRIFT" | "RUNTIME_EXCEPTION";
  description: string;
  culpritFile: string;
  reproducingError: string;
  expectedHealedCode: string;
}

export const REAL_WORLD_SCENARIOS: Record<string, RealWorldBugScenario> = {
  // Scenario 1: The exact real-world problem competitor tweeted about!
  // Google deprecated a model or changed API endpoint, crashing agent runs
  gemini_model_deprecation: {
    id: "gemini_model_deprecation",
    name: "LLM Model Sunset & 404 Deprecation Crash",
    category: "SDK_DEPRECATION",
    description: "Production agent crashed: 'models/gemini-2.5-flash is not found or unsupported for this API key'. NeatPatch must localize the model config via entire-graph and hot-patch with verified active model fallback.",
    culpritFile: "src/sample/agent_provider.ts",
    reproducingError: "GoogleGenAIError: 404 Not Found: models/gemini-2.5-flash is discontinued. Resource has been removed.",
    expectedHealedCode: "model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'"
  },

  // Scenario 2: Tool Schema Drift & Missing Arguments
  tool_schema_drift: {
    id: "tool_schema_drift",
    name: "Tool Calling Schema Drift & Missing Arguments",
    category: "SCHEMA_DRIFT",
    description: "Agent tool failed: LLM output omitted required parameter 'timeoutMs' causing unhandled undefined rejection in database query tool.",
    culpritFile: "src/sample/db_tool.ts",
    reproducingError: "ZodError: [{\"code\":\"invalid_type\",\"expected\":\"number\",\"received\":\"undefined\",\"path\":[\"timeoutMs\"]}]",
    expectedHealedCode: "timeoutMs = args.timeoutMs ?? 5000;"
  },

  // Scenario 3: Runtime ZeroDivision & Null Pointer
  math_zerodivision_null: {
    id: "math_zerodivision_null",
    name: "Production Runtime Crash (ZeroDivision & Null Pointer)",
    category: "RUNTIME_EXCEPTION",
    description: "Production metrics calculation threw ZeroDivisionError on empty arrays and TypeError on null payloads.",
    culpritFile: "src/sample/buggy_module.ts",
    reproducingError: "ZeroDivisionError: values array is empty & null pointer unhandled",
    expectedHealedCode: "if (!values || values.length === 0) return { average: 0, count: 0 };"
  }
};
