export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export const parseWithSchema = (schema, payload, errorMessage = "Validation failed.") => {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new AppError(400, errorMessage, result.error.flatten());
  }

  return result.data;
};

export const mapSupabaseError = (error, fallbackMessage = "Supabase request failed.", fallbackStatus = 400) => {
  if (!error) {
    return new AppError(fallbackStatus, fallbackMessage);
  }

  return new AppError(error.status || fallbackStatus, error.message || fallbackMessage, error);
};

export const notFoundHandler = (req, _res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found.`));
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || error.status || 500;
  const responseBody = {
    error: error.message || "Internal server error.",
  };

  if (error.details) {
    responseBody.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && error.stack) {
    responseBody.stack = error.stack;
  }

  res.status(statusCode).json(responseBody);
};
