import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    // HMAC secret agents sign enrollment requests with. Required by
    // @openmdm/core >= 0.9 — unauthenticated enrollment is no longer allowed.
    MDM_DEVICE_SECRET: z.string().min(32),
    CORS_ORIGIN: z.string().default("*"), // Allow * for development
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
