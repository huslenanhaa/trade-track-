import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const envFiles = [".env", ".env.local"];

envFiles.forEach((fileName, index) => {
  const filePath = path.join(rootDir, fileName);
  if (fs.existsSync(filePath)) {
    dotenv.config({
      path: filePath,
      override: index > 0,
      quiet: true,
    });
  }
});

const normalizePort = (value, fallback) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: normalizePort(process.env.PORT, 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseDbUrl: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || "",
};

export const getAllowedOrigins = () =>
  env.clientUrl
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

export const getMissingSupabaseEnvKeys = () => {
  const missingKeys = [];

  if (!env.supabaseUrl) {
    missingKeys.push("SUPABASE_URL");
  }

  if (!env.supabaseAnonKey) {
    missingKeys.push("SUPABASE_ANON_KEY");
  }

  if (!env.supabaseServiceRoleKey) {
    missingKeys.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return missingKeys;
};

export const isSupabaseConfigured = () => getMissingSupabaseEnvKeys().length === 0;
