import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const port = 4499;
const child = spawn(process.execPath, ["dist/server/entry.mjs"], {
  env: {
    ...process.env,
    PORT: String(port),
    MODDB_API_BASE_URL: "http://127.0.0.1:1",
    WAXLIGHT_GITHUB_REPOSITORY: "invalid/repository",
  },
  stdio: "inherit",
});

try {
  let health;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      health = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (health.ok) break;
    } catch {
      await sleep(100);
    }
  }
  if (!health?.ok || (await health.text()) !== '{"status":"ok"}')
    throw new Error("health endpoint failed");

  const page = await fetch(`http://127.0.0.1:${port}/mod/optimum?noopen=1`);
  const html = await page.text();
  if (!page.ok || !html.includes("waxlight://mod/optimum") || !html.includes("Open in Waxlight")) {
    throw new Error("mod fallback page failed");
  }
} finally {
  child.kill("SIGTERM");
}
