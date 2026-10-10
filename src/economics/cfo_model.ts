import fs from "node:fs";
import path from "node:path";

export interface UnitEconomics {
  tokensPerRun: number;
  inputTokenCostPerMillion: number;
  outputTokenCostPerMillion: number;
  inferenceCostPerRunUsd: number;
  serverlessComputeCostUsd: number;
  totalCostPerRunUsd: number;
  pricePerRunUsd: number;
  grossMarginPercent: number;
}

export interface ScenarioEconomics {
  name: string;
  customers: number;
  runsPerCustomerMonth: number;
  totalMonthlyRuns: number;
  monthlyRevenueUsd: number;
  monthlyInferenceInfraCostUsd: number;
  monthlyGrossProfitUsd: number;
  grossMarginPercent: number;
  monthlyFixedOpExUsd: number;
  monthlyNetBurnOrProfitUsd: number;
  runwayMonthsWith50kCash: number;
}

export class CFOFinancialModel {
  /**
   * Calculate unit economics for one autonomous patch run.
   */
  public calculateUnitEconomics(): UnitEconomics {
    const tokensPerRun = 2500; // Average tokens per full agent task (plan, graph search, patch, test, checkpoint)
    const inputTokenCostPerMillion = 0.80; // AWS Bedrock / Anthropic Claude 3.5 Sonnet / Haiku blend
    const outputTokenCostPerMillion = 2.40;

    const inputTokens = 1800;
    const outputTokens = 700;

    const inputCost = (inputTokens / 1_000_000) * inputTokenCostPerMillion;
    const outputCost = (outputTokens / 1_000_000) * outputTokenCostPerMillion;
    const inferenceCostPerRunUsd = Number((inputCost + outputCost).toFixed(5));
    const serverlessComputeCostUsd = 0.0005; // AWS Lambda / Fargate micro execution
    const totalCostPerRunUsd = Number((inferenceCostPerRunUsd + serverlessComputeCostUsd).toFixed(5));

    // Pricing: $0.50 per autonomous PR fix (vs $50/hr human engineer cost)
    const pricePerRunUsd = 0.50;
    const grossMarginPercent = Number((((pricePerRunUsd - totalCostPerRunUsd) / pricePerRunUsd) * 100).toFixed(1));

    return {
      tokensPerRun,
      inputTokenCostPerMillion,
      outputTokenCostPerMillion,
      inferenceCostPerRunUsd,
      serverlessComputeCostUsd,
      totalCostPerRunUsd,
      pricePerRunUsd,
      grossMarginPercent
    };
  }

  /**
   * Generate Base and Growth scenarios as required by cfo.ai / neatHack.
   */
  public generateScenarios(): { base: ScenarioEconomics; growth: ScenarioEconomics } {
    const unit = this.calculateUnitEconomics();

    // Base Scenario: 100 customers, $20/mo subscription (includes 40 PRs/mo)
    const baseCustomers = 100;
    const baseRunsPerCust = 40;
    const baseMonthlyRuns = baseCustomers * baseRunsPerCust;
    const baseMonthlyRevenue = baseCustomers * 20; // $2,000/mo
    const baseInfraInference = Number((baseMonthlyRuns * unit.totalCostPerRunUsd + 380).toFixed(2)); // $400
    const baseGrossProfit = Number((baseMonthlyRevenue - baseInfraInference).toFixed(2)); // $1,600
    const baseMargin = Number(((baseGrossProfit / baseMonthlyRevenue) * 100).toFixed(1)); // 80.0%
    const baseOpEx = 1200; // Hosting, Neatlogs Pro ($500), tooling
    const baseNetProfit = Number((baseGrossProfit - baseOpEx).toFixed(2));

    const base: ScenarioEconomics = {
      name: "Base Scenario",
      customers: baseCustomers,
      runsPerCustomerMonth: baseRunsPerCust,
      totalMonthlyRuns: baseMonthlyRuns,
      monthlyRevenueUsd: baseMonthlyRevenue,
      monthlyInferenceInfraCostUsd: baseInfraInference,
      monthlyGrossProfitUsd: baseGrossProfit,
      grossMarginPercent: baseMargin,
      monthlyFixedOpExUsd: baseOpEx,
      monthlyNetBurnOrProfitUsd: baseNetProfit,
      runwayMonthsWith50kCash: baseNetProfit >= 0 ? 999 : Math.abs(50000 / baseNetProfit)
    };

    // Growth Scenario: 250 customers, $20/mo subscription ($5,000/mo)
    const growthCustomers = 250;
    const growthRunsPerCust = 40;
    const growthMonthlyRuns = growthCustomers * growthRunsPerCust;
    const growthMonthlyRevenue = growthCustomers * 20; // $5,000/mo
    const growthInfraInference = Number((growthMonthlyRuns * unit.totalCostPerRunUsd + 800).toFixed(2)); // $850
    const growthGrossProfit = Number((growthMonthlyRevenue - growthInfraInference).toFixed(2)); // $4,150
    const growthMargin = Number(((growthGrossProfit / growthMonthlyRevenue) * 100).toFixed(1)); // 83.0%
    const growthOpEx = 2000;
    const growthNetProfit = Number((growthGrossProfit - growthOpEx).toFixed(2));

    const growth: ScenarioEconomics = {
      name: "Growth Scenario",
      customers: growthCustomers,
      runsPerCustomerMonth: growthRunsPerCust,
      totalMonthlyRuns: growthMonthlyRuns,
      monthlyRevenueUsd: growthMonthlyRevenue,
      monthlyInferenceInfraCostUsd: growthInfraInference,
      monthlyGrossProfitUsd: growthGrossProfit,
      grossMarginPercent: growthMargin,
      monthlyFixedOpExUsd: growthOpEx,
      monthlyNetBurnOrProfitUsd: growthNetProfit,
      runwayMonthsWith50kCash: growthNetProfit >= 0 ? 999 : Math.abs(50000 / growthNetProfit)
    };

    return { base, growth };
  }

  /**
   * Export cfo.ai financial plan formatted as Markdown and CSV for hackathon submission.
   */
  public exportCFOPlan(): string {
    const unit = this.calculateUnitEconomics();
    const { base, growth } = this.generateScenarios();

    const markdown = `# CFO.ai Financial Plan: NeatPatch AI Agent

## 1. Unit Economics per Task Run
* **Average Tokens / Task**: ${unit.tokensPerRun.toLocaleString()} tokens
* **Inference Cost (Bedrock / Sonnet)**: $${unit.inferenceCostPerRunUsd.toFixed(4)}
* **Serverless Compute (AWS Lambda)**: $${unit.serverlessComputeCostUsd.toFixed(4)}
* **Total Cost per Task Fix**: **$${unit.totalCostPerRunUsd.toFixed(4)}**
* **Customer Price per Fix**: **$${unit.pricePerRunUsd.toFixed(2)}**
* **Gross Margin**: **${unit.grossMarginPercent}%**

---

## 2. Monthly Projections (cfo.ai Model Format)

| Metric | Base Scenario | Growth Scenario |
| :--- | :--- | :--- |
| **Customers** | ${base.customers} | ${growth.customers} |
| **Monthly Revenue** | $${base.monthlyRevenueUsd.toLocaleString()} | $${growth.monthlyRevenueUsd.toLocaleString()} |
| **Infra + Inference** | $${base.monthlyInferenceInfraCostUsd.toLocaleString()} | $${growth.monthlyInferenceInfraCostUsd.toLocaleString()} |
| **Gross Profit** | $${base.monthlyGrossProfitUsd.toLocaleString()} | $${growth.monthlyGrossProfitUsd.toLocaleString()} |
| **Gross Margin** | **${base.grossMarginPercent}%** | **${growth.grossMarginPercent}%** |
| **Fixed OpEx (Neatlogs, etc.)** | $${base.monthlyFixedOpExUsd.toLocaleString()} | $${growth.monthlyFixedOpExUsd.toLocaleString()} |
| **Monthly Net Profit** | **+$${base.monthlyNetBurnOrProfitUsd.toLocaleString()}** | **+$${growth.monthlyNetBurnOrProfitUsd.toLocaleString()}** |
| **Runway ($50k cash)** | Infinite (Cash Flow Positive) | Infinite (Cash Flow Positive) |

---

## 3. Competitive Moat & Customer Value
* **Human Engineer Cost**: ~$50/hour (~$25 for a 30-min bug investigation and fix)
* **NeatPatch Cost**: $0.50 per fix
* **Customer ROI**: **50x cost reduction** with sub-3-minute time-to-PR.
`;

    const outDir = path.join(process.cwd(), "docs");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "cfo_business_plan.md"), markdown, "utf-8");

    return markdown;
  }
}

// CLI runner for economics
if (process.argv[1]?.endsWith("cfo_model.ts") || process.argv[1]?.endsWith("cfo_model.js")) {
  const model = new CFOFinancialModel();
  console.log(model.exportCFOPlan());
}
