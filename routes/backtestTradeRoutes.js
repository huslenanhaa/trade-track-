import { Router } from "express";
import {
  createBacktestTrade,
  deleteBacktestTrade,
  getBacktestTrade,
  listBacktestTrades,
  updateBacktestTrade,
} from "../controllers/backtestTradeController.js";

const router = Router({ mergeParams: true });

router.get("/", listBacktestTrades);
router.post("/", createBacktestTrade);
router.get("/:tradeId", getBacktestTrade);
router.put("/:tradeId", updateBacktestTrade);
router.patch("/:tradeId", updateBacktestTrade);
router.delete("/:tradeId", deleteBacktestTrade);

export default router;
