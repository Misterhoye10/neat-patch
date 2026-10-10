import { EntireCheckpointManager } from "./checkpoint.js";
import { NeatlogsTracer } from "./neatlogs_tracer.js";
import { LLMClient } from "./llm.js";
import { tools } from "./tools.js";
import type { AgentState, AgentGoal } from "./types.js";

export class AutonomousAgent {
  private llm: LLMClient;
  private tracer: NeatlogsTracer;
  private checkpoint: EntireCheckpointManager;

  constructor() {
    this.llm = new LLMClient();
    this.tracer = new NeatlogsTracer();
    this.checkpoint = new EntireCheckpointManager();
  }

  public async run(initialState?: AgentState): Promise<AgentState> {
    // Phase 1: Planning & State Initialization
    const state: AgentState = initialState || this.createInitialState({
      id: "goal_001",
      title: "Fix ZeroDivision & NullPointer crash in metrics calculation",
      description: "Fix crash in calculateMetrics when empty or null input is passed",
      expectedOutcome: "All vitest assertions pass and Entire checkpoint recorded"
    });

    const rootSpan = this.tracer.startSpan("autonomous_agent_run", "agent", {
      goalId: state.goal.id,
      goalTitle: state.goal.title
    });

    console.log(`\n🚀 [NeatPatch Agent] Started Goal: "${state.goal.title}"`);
    console.log(`   Session: ${state.sessionId} | Phase: ${state.phase}`);

    while (state.iteration < state.maxIterations && state.phase !== "COMPLETED" && state.phase !== "FAILED") {
      state.iteration++;
      console.log(`\n--- Iteration ${state.iteration} [${state.phase}] ---`);

      // 1. LLM Planning Step
      const planSpan = this.tracer.startSpan(`llm_plan_step_${state.iteration}`, "llm");
      const decision = await this.llm.planAndAct(state, Object.keys(tools));
      
      this.tracer.endSpan(planSpan, "success", {
        thought: decision.thought,
        action: decision.action
      }, {
        tokens: decision.tokensUsed,
        costUsd: decision.costUsd
      });

      state.metrics.totalTokens += decision.tokensUsed;
      state.metrics.estimatedCostUsd += decision.costUsd;

      console.log(`🤔 [Thought]: ${decision.thought}`);
      console.log(`⚡ [Action]:  ${decision.action}`);

      if (decision.action === "finish") {
        state.phase = "COMPLETED";
        break;
      }

      // 2. Tool Execution Step
      if (decision.toolName && tools[decision.toolName]) {
        const toolDef = tools[decision.toolName];
        const toolSpan = this.tracer.startSpan(`tool_${decision.toolName}`, "tool", {
          input: decision.toolInput
        });

        try {
          console.log(`🛠️ [Tool Exec]: ${decision.toolName}(${JSON.stringify(decision.toolInput || {})})`);
          const result = await toolDef.execute(decision.toolInput, state);
          
          this.tracer.endSpan(toolSpan, "success", { output: result });
          
          state.history.push({
            stepIndex: state.history.length + 1,
            timestamp: new Date().toISOString(),
            thought: decision.thought,
            action: decision.action,
            toolName: decision.toolName,
            toolInput: decision.toolInput,
            toolOutput: result,
            status: "success"
          });

          // Check if tool resulted in successful verification or completion
          if (decision.toolName === "test_runner" && result.passed) {
            state.phase = "VERIFYING";
          } else if (decision.action === "checkpoint_and_complete") {
            state.phase = "COMPLETED";
            break;
          }

        } catch (err: any) {
          // 3. Error Handling & Recovery Loop (Pillar: Recovery & Iteration)
          const errorMsg = err.message || String(err);
          console.error(`❌ [Tool Error]: ${errorMsg}`);
          
          this.tracer.endSpan(toolSpan, "error", { error: errorMsg });
          this.tracer.recordRecovery(errorMsg, "Reflect on failure, adapt patch, and rerun verification");

          state.phase = "RECOVERING";
          state.metrics.recoveryAttempts++;
          state.context.lastFailureReason = errorMsg;

          state.history.push({
            stepIndex: state.history.length + 1,
            timestamp: new Date().toISOString(),
            thought: decision.thought,
            action: decision.action,
            toolName: decision.toolName,
            toolInput: decision.toolInput,
            status: "failure",
            error: errorMsg
          });

          // Save checkpoint upon failure so we can restore exact state
          const recoveryCheckpointId = this.checkpoint.save(state, `Pre-recovery snapshot after ${decision.toolName} failure`);
          console.log(`💾 [Entire Checkpoint]: Saved failure state snapshot -> ${recoveryCheckpointId}`);
        }
      }

      // Checkpoint state after iteration
      this.checkpoint.save(state, `Iteration ${state.iteration} complete`);
    }

    if (state.phase === "VERIFYING" || state.phase === "COMPLETED") {
      state.phase = "COMPLETED";
      console.log(`\n🎉 [NeatPatch Agent] Mission Accomplished! Goal verified.`);
    }

    this.tracer.endSpan(rootSpan, state.phase === "COMPLETED" ? "success" : "error", {
      finalPhase: state.phase,
      totalIterations: state.iteration,
      recoveryAttempts: state.metrics.recoveryAttempts
    });

    // Print trace tree
    this.tracer.printTraceTree();

    return state;
  }

  private createInitialState(goal: AgentGoal): AgentState {
    return {
      sessionId: `session_${Date.now()}`,
      goal,
      iteration: 0,
      maxIterations: 8,
      phase: "PLANNING",
      plan: [
        "1. Query codebase graph using entire-graph",
        "2. Compute symbol blast radius & impact",
        "3. Read implementation file",
        "4. Apply bug fix patch",
        "5. Run vitest verification suite",
        "6. Save Entire session checkpoint & Git trailer"
      ],
      currentStepIndex: 0,
      history: [],
      context: {
        filesModified: [],
        discoveredSymbols: []
      },
      metrics: {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: 0,
        durationMs: 0,
        recoveryAttempts: 0
      }
    };
  }
}

// Direct executable runner matching the hackathon PR snippet:
// - const state = createState();
// + const state = checkpoint.restore();
// + await agent.run(state);
// + checkpoint.save(state);
async function main() {
  const agent = new AutonomousAgent();
  const checkpoint = new EntireCheckpointManager();

  // Try restoring existing checkpoint or run fresh
  const restoredState = checkpoint.restore("active_session");
  const finalState = await agent.run(restoredState || undefined);
  checkpoint.save(finalState, "Final session checkpoint");
}

if (process.argv[1]?.endsWith("run.ts") || process.argv[1]?.endsWith("run.js")) {
  main().catch(console.error);
}
