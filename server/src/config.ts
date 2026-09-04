import type { ImageCompressionConfig } from "./types";

export interface AuthConfig {
  enabled: boolean;
  username: string;
  password: string;
  secret: string;
  secureCookies: boolean;
}

export interface AppConfig {
  port: number;
  dataDir: string;
  staticDir: string | null;
  corsOrigin: string;
  auth: AuthConfig;
  modularApiKey: string;
  modularApiUrl: string;
  modularSteps: number;
  modularGuidanceScale: number;
  modularSeed: number;
  inputCompression: ImageCompressionConfig;
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric env var ${name}: ${raw}`);
  }
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const dataDir = env.DATA_DIR ?? "./data";
  const basicUser = env.BASIC_AUTH_USERNAME?.trim() ?? "";
  const basicPass = env.BASIC_AUTH_PASSWORD ?? "";
  const authEnabled = basicUser.length > 0 && basicPass.length > 0;

  return {
    port: readNumber("PORT", 3000),
    dataDir,
    staticDir: env.STATIC_DIR?.trim() || null,
    corsOrigin: env.CORS_ORIGIN ?? "http://localhost:5173",
    auth: {
      enabled: authEnabled,
      username: basicUser,
      password: basicPass,
      secret: env.AUTH_SECRET?.trim() || basicPass || "fluxoid-dev-auth-secret",
      secureCookies: env.NODE_ENV === "production",
    },
    modularApiKey: env.MODULAR_API_KEY ?? "",
    modularApiUrl: env.MODULAR_API_URL ?? "https://api.modular.com/v1/responses",
    modularSteps: readNumber("MODULAR_STEPS", 4),
    modularGuidanceScale: readNumber("MODULAR_GUIDANCE_SCALE", 7.5),
    modularSeed: readNumber("MODULAR_SEED", 42),
    inputCompression: {
      minWidth: readNumber("INPUT_MIN_WIDTH", 768),
      minHeight: readNumber("INPUT_MIN_HEIGHT", 768),
      maxBytes: readNumber("INPUT_MAX_BYTES", 1_500_000),
      maxLongEdge: readNumber("INPUT_MAX_LONG_EDGE", 2048),
      quality: readNumber("INPUT_QUALITY", 85),
    },
  };
}
