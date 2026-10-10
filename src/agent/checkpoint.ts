import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import type { AgentState } from "./types.js";

export class EntireCheckpointManager {
  private checkpointDir: string;

  constructor(baseDir = process.cwd()) {
    this.checkpointDir = path.join(baseDir, ".entire", "checkpoints");
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  /**
   * Save a state checkpoint snapshot with reasoning, files modified, and step history.
   */
  public save(state: AgentState, message = "Agent step checkpoint"): string {
    const timestamp = Date.now();
    const checkpointId = `chk_${state.sessionId}_${state.iteration}_${timestamp}`;
    const filePath = path.join(this.checkpointDir, `${checkpointId}.json`);

    const payload = {
      checkpointId,
      timestamp: new Date().toISOString(),
      message,
      state,
      gitCommitTrailer: `Entire-Checkpoint: ${checkpointId}`
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");

    // Also update current active session pointer
    const latestPath = path.join(this.checkpointDir, `latest_${state.sessionId}.json`);
    fs.writeFileSync(latestPath, JSON.stringify(payload, null, 2), "utf-8");

    return checkpointId;
  }

  /**
   * Restore state across retries or after unexpected failures.
   */
  public restore(sessionId: string): AgentState | null {
    const latestPath = path.join(this.checkpointDir, `latest_${sessionId}.json`);
    if (fs.existsSync(latestPath)) {
      try {
        const raw = fs.readFileSync(latestPath, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed.state as AgentState;
      } catch (err) {
        console.error("Failed to restore checkpoint:", err);
      }
    }
    return null;
  }

  /**
   * Attach Entire-Checkpoint trailer to git commit if git is initialized.
   */
  public attachCommitTrailer(checkpointId: string, commitMessage: string): void {
    const fullMessage = `${commitMessage}\n\nEntire-Checkpoint: ${checkpointId}`;
    try {
      execSync(`git commit -m "${fullMessage.replace(/"/g, '\\"')}"`, { stdio: "ignore" });
    } catch {
      // Ignore if nothing to commit or git not ready
    }
  }
}
