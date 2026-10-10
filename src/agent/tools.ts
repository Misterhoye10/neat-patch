import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import type { ToolDefinition, AgentState } from "./types.js";
import { EntireGraphService } from "./graph.js";
import { EntireCheckpointManager } from "./checkpoint.js";

const graphService = new EntireGraphService();
const checkpointManager = new EntireCheckpointManager();

export const tools: Record<string, ToolDefinition> = {
  entire_graph_search: {
    name: "entire_graph_search",
    description: "Search the codebase relationship graph using entire-graph",
    parameters: { query: "string" },
    execute: async (args: { query: string }, state: AgentState) => {
      const output = graphService.search(args.query);
      return {
        query: args.query,
        result: output || "Found symbol `calculateMetrics` in src/sample/buggy_module.ts"
      };
    }
  },

  entire_graph_impact: {
    name: "entire_graph_impact",
    description: "Calculate blast radius and caller impact for a code symbol",
    parameters: { symbol: "string" },
    execute: async (args: { symbol: string }, state: AgentState) => {
      const output = graphService.impact(args.symbol);
      return {
        symbol: args.symbol,
        blastRadius: output || "Symbol `calculateMetrics` called by `src/sample/server.ts:42` and `tests/sample.test.ts:18`"
      };
    }
  },

  file_read: {
    name: "file_read",
    description: "Read contents of a file within the workspace",
    parameters: { path: "string" },
    execute: async (args: { path: string }, state: AgentState) => {
      const fullPath = path.resolve(process.cwd(), args.path);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${args.path}`);
      }
      const content = fs.readFileSync(fullPath, "utf-8");
      return { path: args.path, content };
    }
  },

  file_patch: {
    name: "file_patch",
    description: "Apply a patch to fix an issue in code",
    parameters: { path: "string", strategy: "string" },
    execute: async (args: { path: string; strategy: string }, state: AgentState) => {
      const fullPath = path.resolve(process.cwd(), args.path);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      let patchContent = "";
      if (args.strategy === "apply_initial_fix") {
        // Initial fix has a subtle edge case to demonstrate neatlogs failure trace & recovery!
        patchContent = `// Auto-generated patch by NeatPatch
export function calculateMetrics(values: number[]): { average: number; count: number } {
  if (!values) throw new Error("Null pointer: values array cannot be null");
  // Deliberate initial flaw: division when array is empty triggers failure for agent recovery
  if (values.length === 0) {
    throw new Error("ZeroDivisionError: values array is empty");
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return { average: sum / values.length, count: values.length };
}
`;
      } else {
        // Self-healed fix handling all edge cases
        patchContent = `// Auto-generated self-healed patch by NeatPatch
export function calculateMetrics(values: number[]): { average: number; count: number } {
  if (!values || values.length === 0) {
    return { average: 0, count: 0 };
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return { average: sum / values.length, count: values.length };
}
`;
      }

      fs.writeFileSync(fullPath, patchContent, "utf-8");
      state.context.filesModified.push(args.path);
      return { path: args.path, patched: true, strategy: args.strategy };
    }
  },

  test_runner: {
    name: "test_runner",
    description: "Run verification tests against the patched code",
    parameters: { testPath: "string" },
    execute: async (args: { testPath: string }, state: AgentState) => {
      const fullPath = path.resolve(process.cwd(), args.testPath);
      if (!fs.existsSync(fullPath)) {
        // Create sample verification test if missing
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          fullPath,
          `import { describe, it, expect } from "vitest";
import { calculateMetrics } from "../src/sample/buggy_module.js";

describe("calculateMetrics", () => {
  it("should calculate average for normal numbers", () => {
    expect(calculateMetrics([10, 20, 30])).toEqual({ average: 20, count: 3 });
  });

  it("should handle empty arrays without throwing", () => {
    expect(calculateMetrics([])).toEqual({ average: 0, count: 0 });
  });

  it("should handle null inputs safely", () => {
    expect(calculateMetrics(null as any)).toEqual({ average: 0, count: 0 });
  });
});
`,
          "utf-8"
        );
      }

      try {
        const out = execSync("npx vitest run tests/sample.test.ts", {
          encoding: "utf-8",
          stdio: ["ignore", "pipe", "pipe"]
        });
        state.context.testResults = { passed: true, details: out };
        return { passed: true, stdout: out };
      } catch (err: any) {
        const errOutput = err.stderr || err.stdout || err.message;
        state.context.testResults = { passed: false, details: errOutput.toString() };
        throw new Error(`Test assertion failed:\n${errOutput}`);
      }
    }
  },

  checkpoint_save: {
    name: "checkpoint_save",
    description: "Save session state snapshot via Entire checkpoint manager",
    parameters: { message: "string" },
    execute: async (args: { message: string }, state: AgentState) => {
      const checkpointId = checkpointManager.save(state, args.message);
      return { checkpointId, message: args.message, status: "saved" };
    }
  }
};
