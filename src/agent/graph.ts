import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export class EntireGraphService {
  private entireBin: string;

  constructor() {
    // Check local bin first, then system path
    const localBin = path.join(process.cwd(), "bin", "entire.exe");
    if (fs.existsSync(localBin)) {
      this.entireBin = localBin;
    } else {
      this.entireBin = "entire";
    }
  }

  private runCommand(cmd: string): string {
    try {
      return execSync(`"${this.entireBin}" graph ${cmd}`, {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"]
      });
    } catch (err: any) {
      if (err.stdout) return err.stdout.toString();
      return `Graph command error: ${err.message || String(err)}`;
    }
  }

  public search(query: string): string {
    return this.runCommand(`search "${query.replace(/"/g, '\\"')}"`);
  }

  public impact(symbol: string): string {
    return this.runCommand(`impact "${symbol.replace(/"/g, '\\"')}"`);
  }

  public def(symbol: string): string {
    return this.runCommand(`def "${symbol.replace(/"/g, '\\"')}"`);
  }

  public explain(errorText: string): string {
    return this.runCommand(`explain "${errorText.replace(/"/g, '\\"')}"`);
  }

  public stats(): string {
    return this.runCommand("stats");
  }
}
