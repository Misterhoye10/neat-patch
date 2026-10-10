import { describe, it, expect } from "vitest";
import { getAgentConfig, callAgentProvider } from "../src/sample/agent_provider.js";

describe("Agent Provider Resilience", () => {
  it("should not use discontinued or deprecated models", () => {
    const config = getAgentConfig();
    expect(config.model).not.toBe("gemini-2.5-flash");
  });

  it("should successfully execute without 404 model errors", () => {
    const config = getAgentConfig();
    const result = callAgentProvider(config);
    expect(result.success).toBe(true);
    expect(["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"]).toContain(result.activeModel);
  });
});
