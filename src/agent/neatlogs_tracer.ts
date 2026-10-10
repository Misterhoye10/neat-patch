import fs from "node:fs";
import path from "node:path";

export interface SpanRecord {
  id: string;
  name: string;
  type: "agent" | "llm" | "tool" | "recovery" | "verification";
  startTime: number;
  endTime?: number;
  durationMs?: number;
  tokens?: number;
  costUsd?: number;
  attributes: Record<string, any>;
  status: "success" | "error" | "recovering";
  children: SpanRecord[];
}

export class NeatlogsTracer {
  private apiKey?: string;
  private currentTraceId: string;
  private spans: SpanRecord[] = [];
  private activeSpanStack: SpanRecord[] = [];
  private logDir: string;

  constructor(traceId = `trace_${Date.now()}`) {
    this.apiKey = process.env.NEATLOGS_API_KEY;
    this.currentTraceId = traceId;
    this.logDir = path.join(process.cwd(), ".neatlogs", "traces");
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  public startSpan(
    name: string,
    type: "agent" | "llm" | "tool" | "recovery" | "verification",
    attributes: Record<string, any> = {}
  ): SpanRecord {
    const span: SpanRecord = {
      id: `span_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      type,
      startTime: Date.now(),
      attributes,
      status: "success",
      children: []
    };

    if (this.activeSpanStack.length > 0) {
      const parent = this.activeSpanStack[this.activeSpanStack.length - 1];
      parent.children.push(span);
    } else {
      this.spans.push(span);
    }

    this.activeSpanStack.push(span);
    return span;
  }

  public endSpan(
    span: SpanRecord,
    status: "success" | "error" | "recovering" = "success",
    extraAttributes: Record<string, any> = {},
    metrics?: { tokens?: number; costUsd?: number }
  ): void {
    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    span.status = status;
    span.attributes = { ...span.attributes, ...extraAttributes };
    if (metrics?.tokens) span.tokens = metrics.tokens;
    if (metrics?.costUsd) span.costUsd = metrics.costUsd;

    // Pop from stack
    const idx = this.activeSpanStack.indexOf(span);
    if (idx !== -1) {
      this.activeSpanStack.splice(idx, 1);
    }

    this.persistTrace();
  }

  public recordRecovery(originalError: string, strategy: string): void {
    const span = this.startSpan("self_healing_recovery", "recovery", {
      originalError,
      recoveryStrategy: strategy
    });
    this.endSpan(span, "recovering");
  }

  private persistTrace(): void {
    const summary = {
      traceId: this.currentTraceId,
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!this.apiKey,
      spansCount: this.calculateTotalSpans(this.spans),
      spans: this.spans
    };

    const filePath = path.join(this.logDir, `${this.currentTraceId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), "utf-8");
  }

  private calculateTotalSpans(spans: SpanRecord[]): number {
    let count = 0;
    for (const s of spans) {
      count += 1 + this.calculateTotalSpans(s.children);
    }
    return count;
  }

  public printTraceTree(): void {
    console.log(`\n================= NEATLOGS TRACE (${this.currentTraceId}) =================`);
    const printTree = (spans: SpanRecord[], indent = 0) => {
      for (const s of spans) {
        const pad = "  ".repeat(indent);
        const dur = s.durationMs ? `${s.durationMs}ms` : "running";
        const tok = s.tokens ? ` | ${s.tokens} tokens` : "";
        const cost = s.costUsd ? ` | $${s.costUsd.toFixed(4)}` : "";
        const statIcon = s.status === "success" ? "✓" : s.status === "error" ? "✗" : "↻";
        console.log(`${pad}[${s.type.toUpperCase()}] ${s.name} (${dur}${tok}${cost}) ${statIcon}`);
        if (s.children.length > 0) {
          printTree(s.children, indent + 1);
        }
      }
    };
    printTree(this.spans);
    console.log("====================================================================\n");
  }

  public getTraceSummary() {
    let totalTokens = 0;
    let totalCost = 0;
    let totalDurationMs = 0;

    const traverse = (spans: SpanRecord[]) => {
      for (const s of spans) {
        if (s.tokens) totalTokens += s.tokens;
        if (s.costUsd) totalCost += s.costUsd;
        if (s.durationMs && s.type === "agent") totalDurationMs += s.durationMs;
        traverse(s.children);
      }
    };
    traverse(this.spans);

    return {
      traceId: this.currentTraceId,
      spansCount: this.calculateTotalSpans(this.spans),
      totalTokens,
      totalCost,
      totalDurationMs
    };
  }
}
