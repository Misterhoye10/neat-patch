# NeatPatch AI 🛡️
> **Autonomous Issue-to-PR & Self-Healing Coding Agent**  
> Built by **Team OVF (Folarin Oyewole)** for **neatHack 2026** (Oct 10–12).

---

## 🚀 Overview

**NeatPatch** is an autonomous SRE and software engineering agent designed to investigate runtime crashes, failing test suites, and GitHub issues. Instead of hallucinating patches or brute-force scanning massive repositories, NeatPatch navigates codebases via **local AST relationship graphs**, generates minimal reproduction tests, iterates on fixes, self-heals unexpected failures, and commits verified PRs with full audit checkpoints.

---

## 🏆 Hackathon Stack & Integrations

NeatPatch is engineered to leverage the **3 core partner pillars**:

| Technology | Integration Role | Evidence & Artifacts |
| :--- | :--- | :--- |
| **[neatlogs](https://neatlogs.com)** | **Agent Observability & Tracing** | Traces hierarchical execution spans (`agent`, `llm`, `tool`, `recovery`). Captures millisecond latencies, token consumption, cost metrics, and self-healing recovery events. Stored in `.neatlogs/traces/`. |
| **[Entire](https://entire.io)** | **Code Graph & Session Checkpoints** | Uses `entire-graph` (v0.4.0) tree-sitter AST queries for definition resolution and caller blast radius. Attaches `Entire-Checkpoint: <id>` trailers to Git commits for deterministic context auditing. |
| **[cfo.ai](https://cfo.ai)** | **Unit Economics & Financial Plan** | Investor-grade SaaS financial model: $0.0035 inference cost per fix vs $0.50 customer charge (83% blended gross margin, infinite runway). Stored in `docs/cfo_business_plan.md`. |

---

## 🎯 8 Focus Areas Implementation

1. **Planning**: Deconstructs goals into 6 execution phases (`Ingestion` $\rightarrow$ `AST Analysis` $\rightarrow$ `Patch Generation` $\rightarrow$ `Vitest Adjudication` $\rightarrow$ `Recovery Reflection` $\rightarrow$ `Checkpointing`).
2. **Tool Use**: Dynamically executes `entire_graph_search`, `entire_graph_impact`, `file_read`, `file_patch`, `test_runner`, and `checkpoint_save`.
3. **State**: Preserves state across iterations and retries with `EntireCheckpointManager`.
4. **Context**: Employs `entire-graph` to fetch only relevant symbol surfaces, keeping prompt token overhead minimal.
5. **Execution**: Long-running loop runs until test assertions pass without human intervention.
6. **Recovery**: Catches test assertion errors (e.g. `ZeroDivisionError` & null pointer edge cases), triggers reflection, and adapts code hot-patches.
7. **Verification**: Adjudicates fixes against real test suites (`vitest`).
8. **Iteration**: Incorporates previous tool outputs into subsequent reasoning steps.

---

## 💻 Quickstart

### Prerequisites
- Node.js v18+ (tested on Node v24)
- Git 2.36+

### Installation
```bash
git clone https://github.com/Misttterhoye/Neat.git
cd Neat
npm install
```

### Launch Interactive Studio & Command Deck
```bash
npm run ui
```
Open your browser at **`http://localhost:3000`** to inspect the live PR console, unified diffs, Neatlogs flamechart, and cfo.ai economics sliders.

### Run Autonomous Agent CLI
```bash
npm start
```

---

## 📊 Live Metrics
- **Verification Rate**: 3/3 Tests Passing
- **Autonomous Recovery**: 100% on edge cases
- **Avg. Latency**: ~4.7s
- **Inference Cost / Fix**: $0.0035
- **Gross Margin**: 83%

---

## 👥 Team
- **Builder**: Folarin Oyewole (Passenger #1119)
- **Team**: OVF
- **Event**: neatHack 2026
