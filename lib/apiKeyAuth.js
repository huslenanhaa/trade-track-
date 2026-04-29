import crypto from "node:crypto";
import { AppError, asyncHandler, mapSupabaseError } from "./http.js";
import { getSupabaseAdmin } from "./supabase.js";

export const hashApiKey = (rawKey) =>
  crypto.createHash("sha256").update(rawKey).digest("hex");

export const requireMt5ApiKey = asyncHandler(async (req, _res, next) => {
  const rawKey = req.headers["x-api-key"];
  if (!rawKey) throw new AppError(401, "X-Api-Key header is required.");

  const keyHash = hashApiKey(rawKey);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("mt5_api_keys")
    .select("id, user_id, is_active")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error) throw mapSupabaseError(error, "Unable to validate API key.");
  if (!data || !data.is_active) throw new AppError(401, "Invalid or inactive API key.");

  // Update last_used_at fire-and-forget — don't block the sync request
  supabase
    .from("mt5_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  const { data: userData } = await supabase.auth.admin.getUserById(data.user_id);
  if (!userData?.user) throw new AppError(401, "User account not found.");

  req.user = userData.user;
  req.mt5ApiKeyId = data.id;
  next();
});
