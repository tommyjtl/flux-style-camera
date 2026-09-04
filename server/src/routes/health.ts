import { Hono } from "hono";

export function createHealthRouter(): Hono {
  const app = new Hono();
  app.get("/", (c) => c.json({ ok: true, service: "fluxoid-server" }));
  return app;
}
