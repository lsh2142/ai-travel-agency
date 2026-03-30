import fs from "fs";
import path from "path";

if (!process.env.ANTHROPIC_API_KEY) {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf-8");

    for (const line of content.split("\n")) {
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && val && !process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local may not exist in production — that's fine
  }
}
