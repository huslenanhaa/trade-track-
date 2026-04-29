import { AppError, asyncHandler, mapSupabaseError } from "./http.js";
import { getSupabaseAdmin } from "./supabase.js";

const getBearerToken = (authorizationHeader = "") => {
  if (!authorizationHeader.startsWith("Bearer ")) {
    return "";
  }

  return authorizationHeader.slice("Bearer ".length).trim();
};

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const accessToken = getBearerToken(req.headers.authorization);

  if (!accessToken) {
    throw new AppError(401, "A valid Bearer token is required.");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data?.user) {
    throw mapSupabaseError(error, "Your session is invalid or has expired.", 401);
  }

  req.accessToken = accessToken;
  req.user = data.user;
  next();
});
