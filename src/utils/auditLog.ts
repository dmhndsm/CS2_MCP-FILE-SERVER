import * as fs from "node:fs";
import * as path from "node:path";

// Audit log lives OUTSIDE the workspace so tools cannot read or edit it.
// Override with AUDIT_LOG; set AUDIT_LOG=off to disable.
const target = process.env.AUDIT_LOG ?? path.resolve(process.cwd(), "logs", "audit.log");

export function audit(
  tool: string,
  details: Record<string, unknown>,
  outcome: "ok" | "denied" | "error" = "ok"
): void {
  if (target === "off") return;
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.appendFileSync(
      target,
      JSON.stringify({ ts: new Date().toISOString(), tool, outcome, ...details }) + "\n"
    );
  } catch {
    // Logging must never break a tool call.
  }
}
