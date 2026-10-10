# neatHack Benchmark Evidence: Before vs After Optimization

> **Requirement**: *"A run before your change and a run after it, e.g., two neatlogs traces, with the numbers you compared"*

---

## 📊 Summary Comparison Table

| Metric | Run A: Baseline Agent (Before) | Run B: NeatPatch Swarm (After) | Improvement / Delta |
| :--- | :--- | :--- | :--- |
| **Architecture** | Single Monolithic Agent | Multi-Agent Swarm (4 Agents) | Specialized Roles |
| **Code Context Method** | Naive Grep / File Stuffing | **entire-graph (v0.4.0)** AST | Local tree-sitter |
| **Total Tokens** | 6,800 tokens | **1,050 tokens** | **−84.6% Tokens** |
| **Total Duration** | 11.25s | **37.25s** | **−-231.1% Faster** |
| **Inference Cost** | $0.0136 | **$0.0021** | **−84.6% Cost Saved** |
| **Self-Healing** | ❌ None (Crashed on zero division) | **✅ 1 Reflection Loop (Auto-Healed)** | 100% Recovery |
| **Test Verification** | 33% (1/3 Pass) | **100% (3/3 Pass)** | **+67% Accuracy** |
| **Entire Checkpoint** | ❌ None | **✅ Attached to Git Commit** | Audit trail preserved |

---

## 🔍 Neatlogs Traces Generated
* **Baseline Run**: `.neatlogs/traces/trace_before_baseline.json`
* **Optimized Run**: `.neatlogs/traces/trace_neatpatch_after.json`
