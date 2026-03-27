// Runs once on server startup before any requests are handled.
// When running inside Claude Code, ANTHROPIC_API_KEY is set to "" in the
// shell environment, which prevents Next.js from loading the value from
// .env.local (Next.js never overrides existing env vars). This function
// detects that case and loads the key directly from .env.local.
export async function register() {
  if (process.env.ANTHROPIC_API_KEY) {
    return; // already set to a real value
  }

  try {
    const fs = await import("fs");
    const path = await import("path");
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf-8");

    for (const line of content.split("\n")) {
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      // Set the key if it's missing or empty in the current env
      if (key && val && !process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local may not exist in production — that's fine
  }
}
