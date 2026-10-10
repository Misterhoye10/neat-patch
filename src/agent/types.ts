export interface AgentGoal {
  id: string;
  title: string;
  description: string;
  targetRepository?: string;
  expectedOutcome: string;
}

export interface AgentStep {
  stepIndex: number;
  timestamp: string;
  thought: string;
  action: string;
  toolName?: string;
  toolInput?: Record<string, any>;
  toolOutput?: Record<string, any> | string;
  status: "success" | "failure" | "pending";
  error?: string;
}

export interface AgentState {
  sessionId: string;
  goal: AgentGoal;
  iteration: number;
  maxIterations: number;
  phase: "PLANNING" | "EXECUTING" | "VERIFYING" | "RECOVERING" | "COMPLETED" | "FAILED";
  plan: string[];
  currentStepIndex: number;
  history: AgentStep[];
  context: {
    filesModified: string[];
    discoveredSymbols: string[];
    testResults?: { passed: boolean; details: string };
    lastFailureReason?: string;
  };
  metrics: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
    durationMs: number;
    recoveryAttempts: number;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any, state: AgentState) => Promise<any>;
}
