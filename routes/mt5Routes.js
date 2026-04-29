import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../lib/auth.js";
import { requireMt5ApiKey } from "../lib/apiKeyAuth.js";
import {
  syncTrades,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
  getSyncStatus,
} from "../controllers/mt5Controller.js";

const syncRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sync requests. Please wait before retrying." },
});

const router = Router();

// EA endpoint — API key auth (not JWT)
router.post("/sync", syncRateLimit, requireMt5ApiKey, syncTrades);

// User-facing key management — JWT auth
router.get("/keys", requireAuth, listApiKeys);
router.post("/keys", requireAuth, createApiKey);
router.patch("/keys/:keyId/revoke", requireAuth, revokeApiKey);
router.delete("/keys/:keyId", requireAuth, deleteApiKey);

// Sync status for frontend
router.get("/status", requireAuth, getSyncStatus);

export default router;
