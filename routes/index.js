import { Router } from "express";
import authRoutes from "./authRoutes.js";
import backtestSessionRoutes from "./backtestSessionRoutes.js";
import tradeRoutes from "./tradeRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import marketDataRoutes from "./marketDataRoutes.js";
import candleRoutes from "./candleRoutes.js";
import mt5Routes from "./mt5Routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/trades", tradeRoutes);
router.use("/backtest-sessions", backtestSessionRoutes);
router.use("/upload", uploadRoutes);
router.use("/market-data", marketDataRoutes);
router.use("/market/candles", candleRoutes);
router.use("/mt5", mt5Routes);

export default router;
