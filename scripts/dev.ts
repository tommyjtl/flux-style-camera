#!/usr/bin/env bun

const root = `${import.meta.dir}/..`;

const procs = [
  {
    name: "server",
    proc: Bun.spawn(["bun", "run", "dev"], {
      cwd: `${root}/server`,
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
      env: { ...process.env, FORCE_COLOR: "1" },
    }),
  },
  {
    name: "client",
    proc: Bun.spawn(["bun", "run", "dev"], {
      cwd: `${root}/client`,
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
      env: { ...process.env, FORCE_COLOR: "1" },
    }),
  },
];

let shuttingDown = false;

function shutdown(signal?: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (signal) {
    console.log(`\nStopping Fluxoid (${signal})…`);
  }

  for (const { name, proc } of procs) {
    if (proc.exitCode === null) {
      proc.kill();
    }
  }

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log("Starting Fluxoid…");
console.log("  API  → http://localhost:3000");
console.log("  App  → http://localhost:5173");
console.log("Press Ctrl+C to stop both.\n");

const results = await Promise.all(
  procs.map(async ({ name, proc }) => {
    const code = await proc.exited;
    if (code !== 0 && !shuttingDown) {
      console.error(`[${name}] exited with code ${code}`);
    }
    return code;
  }),
);

if (!shuttingDown && results.some((code) => code !== 0)) {
  shutdown();
}
