import { AppError, asyncHandler, mapSupabaseError, parseWithSchema } from "../lib/http.js";
import { loginSchema, signupSchema } from "../lib/schemas.js";
import { getSupabaseAdmin, getSupabaseAuth } from "../lib/supabase.js";

const serializeAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  full_name: user.user_metadata?.full_name || "",
});

const serializeSession = (session) => ({
  access_token: session.access_token,
  refresh_token: session.refresh_token,
  expires_at: session.expires_at,
  expires_in: session.expires_in,
  token_type: session.token_type,
});

const isAlreadyRegisteredError = (error) =>
  /already.*registered|already.*exists|user.*exists/i.test(error?.message || "");

const findUserByEmail = async (supabaseAdmin, email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw mapSupabaseError(error, "Unable to check your account.");
  }

  return (data?.users || []).find((user) => user.email?.toLowerCase() === normalizedEmail) || null;
};

const recoverUnconfirmedUser = async (supabaseAdmin, payload, createError) => {
  if (!isAlreadyRegisteredError(createError)) {
    throw mapSupabaseError(createError, "Unable to create your account.");
  }

  const existingUser = await findUserByEmail(supabaseAdmin, payload.email);

  if (!existingUser) {
    throw mapSupabaseError(createError, "Unable to create your account.");
  }

  if (existingUser.email_confirmed_at) {
    throw new AppError(409, "An account with this email already exists. Log in instead.");
  }

  const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    existingUser.id,
    {
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata || {}),
        full_name: payload.fullName,
      },
    },
  );

  if (updateError) {
    throw mapSupabaseError(updateError, "Unable to activate your account.");
  }

  return updatedUser;
};

export const signup = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(signupSchema, req.body, "Signup payload is invalid.");
  const supabaseAdmin = getSupabaseAdmin();
  const supabaseAuth = getSupabaseAuth();

  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      full_name: payload.fullName,
    },
  });

  const createdUser = createError
    ? await recoverUnconfirmedUser(supabaseAdmin, payload, createError)
    : createData;

  const { data: sessionData, error: loginError } = await supabaseAuth.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (loginError || !sessionData.session || !sessionData.user) {
    throw mapSupabaseError(loginError, "Account created, but automatic login failed.", 400);
  }

  res.status(201).json({
    message: "Signup successful.",
    user: serializeAuthUser(sessionData.user || createdUser?.user),
    session: serializeSession(sessionData.session),
  });
});

export const login = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(loginSchema, req.body, "Login payload is invalid.");
  const supabaseAuth = getSupabaseAuth();

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error || !data.session || !data.user) {
    throw mapSupabaseError(error, "Invalid email or password.", 401);
  }

  res.json({
    message: "Login successful.",
    user: serializeAuthUser(data.user),
    session: serializeSession(data.session),
  });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "You are not authenticated.");
  }

  res.json({
    user: serializeAuthUser(req.user),
  });
});
