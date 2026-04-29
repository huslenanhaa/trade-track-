import cors from "cors";
import express from "express";
import { env, getAllowedOrigins, isSupabaseConfigured } from "./lib/env.js";
import { prepareBackend } from "./lib/bootstrap.js";
import { errorHandler, notFoundHandler } from "./lib/http.js";
import apiRouter from "./routes/index.js";

const app = express();
const allowedOrigins = getAllowedOrigins();
const isLocalDevOrigin = (origin = "") =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin);

app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      const allowLocalDevOrigin =
        env.nodeEnv !== "production" && origin && isLocalDevOrigin(origin);

      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        allowLocalDevOrigin
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Api-Key"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "trade-track-api",
    supabaseConfigured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

await prepareBackend();

app.listen(env.port, () => {
  const originLabel = allowedOrigins.length > 0 ? allowedOrigins.join(", ") : "all origins";
  console.log(`Trade Track Pro API listening on http://localhost:${env.port}`);
  console.log(`CORS enabled for ${originLabel}`);
});
