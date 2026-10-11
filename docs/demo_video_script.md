# 🎬 NeatPatch AI: 2-Minute Demo Video Script (120s)
> **Speaker**: Folarin Oyewole (Passenger #1119, Team OVF)  
> **Tool to record with**: [Loom.com](https://loom.com) (free) or Windows Screen Recorder (`Win + Alt + R`)

---

### [0:00 – 0:25] The Hook & Introduction
* **Screen**: Show `http://localhost:3000` (NeatPatch Studio).
* **Say**:
  > *"Hi judges, I’m Folarin Oyewole from Team OVF for neatHack 2026. This is **NeatPatch AI** — an autonomous multi-agent SRE that investigates, tests, and self-heals broken code in production."*
  > *"Most agents freeze when tests fail. NeatPatch doesn't just write code — it autonomously catches failures, reasons about the error, and self-heals until tests pass."*

---

### [0:25 – 0:55] Live Execution & Self-Healing Demo
* **Screen**: Click the blue button **`Execute Autonomous Fix`**.
* **Say**:
  > *"Watch our 4-agent swarm in action. When I click 'Execute Autonomous Fix', the Coordinator dispatches the goal."*
  > *"Look at the terminal: the initial patch failed in Vitest with a ZeroDivisionError. But watch what happens next: the agent enters self-healing recovery, analyzes the assertion error, hot-patches defensive guards, and reruns Vitest."*
  > *"Boom — all tests pass with zero human intervention!"*

---

### [0:55 – 1:20] Entire Graph & Git Checkpoints
* **Screen**: Click **"Source Code Diff"** tab, then **"Entire Graph Map"** and **"Entire Checkpoints"** tab.
* **Say**:
  > *"How did it find the code? We integrated **Entire Graph** to query AST symbol definitions and caller blast radiuses locally with tree-sitter, avoiding expensive context stuffing."*
  > *"And once verified, **Entire** attached a deterministic checkpoint trailer to our Git commit, giving developers a complete audit trail."*

---

### [1:20 – 1:40] Neatlogs Observability & Benchmark
* **Screen**: Click **"Neatlogs Waterfall"** tab, then **"Benchmark Evidence"** tab.
* **Say**:
  > *"Every single span is traced live in **Neatlogs** — from LLM planning to tool executions and recovery events."*
  > *"Our benchmark proves an **84.6% token reduction**, cutting cost to just $0.0021 per fix while boosting test accuracy from 33% to 100%."*

---

### [1:40 – 2:00] cfo.ai Unit Economics & Conclusion
* **Screen**: Click **"cfo.ai Projections"** tab and move the customer slider.
* **Say**:
  > *"Finally, we modeled our economics in **cfo.ai**: charging $20 per seat delivers an **83% gross margin** and a cash-flow-positive runway."*
  > *"All code and commits are live on our public GitHub at `github.com/Misterhoye10/neat-patch`. Thank you!"*
