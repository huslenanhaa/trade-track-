import postgres from "postgres";
import { env, isSupabaseConfigured } from "./env.js";
import { getSupabaseAdmin } from "./supabase.js";
import { schemaSql } from "./schema.js";

const verifyTable = async (tableName) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from(tableName).select("id").limit(1);
  return !error;
};

export const prepareBackend = async () => {
  if (!isSupabaseConfigured()) {
    console.log("Supabase credentials are missing. The API will start, but protected routes will return 503 until you configure the environment.");
    return;
  }

  if (env.supabaseDbUrl) {
    const sql = postgres(env.supabaseDbUrl, {
      prepare: false,
      max: 1,
    });

    try {
      await sql.unsafe(schemaSql);
      console.log("Supabase schema bootstrap finished.");
    } catch (error) {
      console.log(`Schema bootstrap failed: ${error.message}`);
    } finally {
      await sql.end({ timeout: 5 });
    }
  } else {
    console.log("SUPABASE_DB_URL is not set. Skipping automatic schema bootstrap.");
    console.log(
      "\n📋 BACKTESTING MIGRATION — paste this into your Supabase SQL editor:\n" +
      "─".repeat(60) + "\n" +
      "ALTER TABLE public.backtest_sessions\n" +
      "  ADD COLUMN IF NOT EXISTS asset_type text NOT NULL DEFAULT 'forex',\n" +
      "  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT true,\n" +
      "  ADD COLUMN IF NOT EXISTS prop_firm_mode boolean NOT NULL DEFAULT false,\n" +
      "  ADD COLUMN IF NOT EXISTS prop_rules jsonb,\n" +
      "  ADD COLUMN IF NOT EXISTS current_replay_date date;\n\n" +
      "ALTER TABLE public.trades\n" +
      "  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',\n" +
      "  ADD COLUMN IF NOT EXISTS backtest_session_id uuid\n" +
      "    REFERENCES public.backtest_sessions(id) ON DELETE SET NULL;\n" +
      "─".repeat(60) + "\n"
    );
  }

  const checks = await Promise.all([
    verifyTable("trades"),
    verifyTable("backtest_sessions"),
    verifyTable("backtest_trades"),
  ]);

  if (checks.every(Boolean)) {
    console.log("Supabase tables are reachable.");
    return;
  }

  console.log("One or more Supabase tables are missing. Add SUPABASE_DB_URL so the API can create them automatically.");
};
