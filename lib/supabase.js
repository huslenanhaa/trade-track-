import { createClient } from "@supabase/supabase-js";
import { getMissingSupabaseEnvKeys, env, isSupabaseConfigured } from "./env.js";
import { AppError } from "./http.js";

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

const supabaseAdmin = isSupabaseConfigured()
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, clientOptions)
  : null;

const supabaseAuth = isSupabaseConfigured()
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions)
  : null;

export const ensureSupabaseConfigured = () => {
  if (isSupabaseConfigured()) {
    return;
  }

  throw new AppError(
    503,
    `Supabase is not configured. Missing environment variables: ${getMissingSupabaseEnvKeys().join(", ")}.`,
  );
};

export const getSupabaseAdmin = () => {
  ensureSupabaseConfigured();
  return supabaseAdmin;
};

export const getSupabaseAuth = () => {
  ensureSupabaseConfigured();
  return supabaseAuth;
};
