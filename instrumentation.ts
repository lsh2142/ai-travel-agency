// Runs once on server startup before any requests are handled.
// When running inside Claude Code, ANTHROPIC_API_KEY is set to "" in the
// shell environment, which prevents Next.js from loading the value from
// .env.local (Next.js never overrides existing env vars). This function
// detects that case and loads the key directly from .env.local.
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    require('./register.node');
  }
}
