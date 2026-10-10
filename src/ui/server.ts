import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { AutonomousAgent } from "../agent/run.js";
import { EntireCheckpointManager } from "../agent/checkpoint.js";
import { EntireGraphService } from "../agent/graph.js";
import { CFOFinancialModel } from "../economics/cfo_model.js";

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(process.cwd(), "src", "ui", "public");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (url.pathname === "/api/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ready", uptime: process.uptime() }));
    return;
  }

  if (url.pathname === "/api/run" && req.method === "POST") {
    try {
      const agent = new AutonomousAgent();
      const checkpoint = new EntireCheckpointManager();
      const state = await agent.run();
      const checkpointId = checkpoint.save(state, "UI Triggered Run");

      // Read the newest trace
      const traceDir = path.join(process.cwd(), ".neatlogs", "traces");
      let latestTrace = null;
      if (fs.existsSync(traceDir)) {
        const files = fs.readdirSync(traceDir).sort().reverse();
        if (files.length > 0) {
          latestTrace = JSON.parse(fs.readFileSync(path.join(traceDir, files[0]), "utf-8"));
        }
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, state, checkpointId, trace: latestTrace }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  if (url.pathname === "/api/traces") {
    const traceDir = path.join(process.cwd(), ".neatlogs", "traces");
    let traces: any[] = [];
    if (fs.existsSync(traceDir)) {
      const files = fs.readdirSync(traceDir).sort().reverse();
      traces = files.map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(traceDir, f), "utf-8"));
        } catch {
          return null;
        }
      }).filter(Boolean);
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ traces }));
    return;
  }

  if (url.pathname === "/api/cfo") {
    const model = new CFOFinancialModel();
    const unit = model.calculateUnitEconomics();
    const scenarios = model.generateScenarios();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ unit, scenarios }));
    return;
  }

  if (url.pathname === "/api/graph") {
    const graph = new EntireGraphService();
    const searchRes = graph.search("calculateMetrics");
    const impactRes = graph.impact("calculateMetrics");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ search: searchRes, impact: impactRes }));
    return;
  }

  // Static Assets
  let filePath = path.join(PUBLIC_DIR, url.pathname === "/" ? "index.html" : url.pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, "index.html");
  }

  const ext = path.extname(filePath);
  const contentTypes: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml"
  };

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "text/plain" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`\n🛸 [NeatPatch HUD] Distinct Cyber-SRE UI live at: http://localhost:${PORT}`);
});
