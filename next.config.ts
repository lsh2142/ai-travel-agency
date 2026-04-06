import path from "path";
import { existsSync } from "fs";
import type { NextConfig } from "next";

// In git worktrees node_modules live in the repo root, not the worktree dir.
// Walk up from __dirname to find the directory that actually contains next.
function getWorkspaceRoot(): string {
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (existsSync(path.join(dir, "node_modules", "next", "package.json"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return __dirname;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: getWorkspaceRoot(),
  },
};

export default nextConfig;
