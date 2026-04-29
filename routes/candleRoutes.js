import { Router } from "express";
import { getCandles } from "../controllers/candleController.js";

const router = Router();

// GET /api/market/candles?asset=XAUUSD&from=2020-01-01&to=2020-06-01&timeframe=1h
router.get("/", getCandles);

export default router;
