import { mkdirSync } from "node:fs";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { AppConfig } from "./config";
import { loadConfig } from "./config";
import { createHealthRouter } from "./routes/health";
import { createLoginRouter } from "./routes/login";
import { createTransformRouter } from "./routes/transform";
import { createAuthMiddleware } from "./middleware/auth";
import { ModularClient } from "./services/modular";
import { TransformService } from "./services/transform";
import type { FetchFn, StylePreset } from "./types";

export interface CreateAppOptions {
  config?: AppConfig;
  preset?: StylePreset;
  fetchImpl?: FetchFn;
}

export async function createApp(options: CreateAppOptions = {}): Promise<{
  app: Hono;
  config: AppConfig;
  transformService: TransformService;
}> {
  const config = options.config ?? loadConfig();
  mkdirSync(config.dataDir, { recursive: true });

  const modularClient = new ModularClient({
    apiKey: config.modularApiKey,
    apiUrl: config.modularApiUrl,
    fetchImpl: options.fetchImpl,
  });

  const transformService = new TransformService({
    config,
    modularClient,
    preset: options.preset,
  });

  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: config.corsOrigin,
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      exposeHeaders: [
        "X-Fluxoid-Aspect-Ratio",
        "X-Fluxoid-Output-Width",
        "X-Fluxoid-Output-Height",
        "X-Fluxoid-Preset-Id",
      ],
    }),
  );

  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json({ error: error.message }, error.status);
    }
    console.error(error);
    return c.json({ error: "Internal Server Error" }, 500);
  });

  app.route("/", createLoginRouter(config));
  app.use("*", createAuthMiddleware(config));

  app.route("/api/health", createHealthRouter());
  app.route("/api/transform", createTransformRouter(transformService));

  if (config.staticDir) {
    const root = config.staticDir;
    app.use("*", async (c, next) => {
      if (c.req.path.startsWith("/api/")) {
        return next();
      }
      return serveStatic({ root })(c, next);
    });
    app.get("*", async (c, next) => {
      if (c.req.path.startsWith("/api/")) {
        return next();
      }
      return serveStatic({ root, path: "index.html" })(c, next);
    });
  }

  return { app, config, transformService };
}
