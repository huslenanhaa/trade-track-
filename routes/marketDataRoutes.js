import { Router } from "express";
import { getMarketData } from "../controllers/marketDataController.js";

const router = Router();

// GET /api/market-data — Yahoo Finance proxy (no auth required)
router.get("/", getMarketData);

export default router;
