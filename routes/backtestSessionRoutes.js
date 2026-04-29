import { Router } from "express";
import {
  createBacktestSession,
  deleteBacktestSession,
  getBacktestSession,
  listBacktestSessions,
  updateBacktestSession,
} from "../controllers/backtestSessionController.js";
import { requireAuth } from "../lib/auth.js";
import backtestTradeRoutes from "./backtestTradeRoutes.js";

const router = Router();

router.use(requireAuth);
router.get("/", listBacktestSessions);
router.post("/", createBacktestSession);
router.get("/:sessionId", getBacktestSession);
router.put("/:sessionId", updateBacktestSession);
router.patch("/:sessionId", updateBacktestSession);
router.delete("/:sessionId", deleteBacktestSession);
router.use("/:sessionId/trades", backtestTradeRoutes);

export default router;
