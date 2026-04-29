import { Router } from "express";
import {
  bulkCreateTrades,
  clearTrades,
  createTrade,
  deleteTrade,
  getTrade,
  listTrades,
  updateTrade,
} from "../controllers/tradeController.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listTrades);
router.post("/", createTrade);
router.post("/bulk", bulkCreateTrades);
router.delete("/", clearTrades);
router.get("/:tradeId", getTrade);
router.put("/:tradeId", updateTrade);
router.patch("/:tradeId", updateTrade);
router.delete("/:tradeId", deleteTrade);

export default router;
