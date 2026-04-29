import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// useReplayEngine
//
// Core replay logic for the backtesting room.
// - Fetches ALL candles for the asset/date range upfront
// - currentIndex is the "now" pointer (1-based)
// - visibleCandles = allCandles.slice(0, currentIndex)
// - A setInterval advances currentIndex at the chosen speed
// ---------------------------------------------------------------------------

const SPEED_MAP = { 1: 800, 2: 400, 5: 160, 10: 80 };
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function fetchCandlesFromApi(asset, timeframe, startDate) {
  const params = new URLSearchParams({ asset, timeframe });
  if (startDate) params.set("from", startDate);

  // Try the new /api/market/candles endpoint first
  try {
    const res = await fetch(`${API_URL}/api/market/candles?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.candles) && data.candles.length > 0) {
        return data.candles;
      }
    }
  } catch {
    // fall through to legacy endpoint
  }

  // Fallback → existing /api/market-data endpoint (Twelve Data)
  const legacyParams = new URLSearchParams({ symbol: asset, timeframe });
  if (startDate) legacyParams.set("start_date", startDate);
  const res = await fetch(`${API_URL}/api/market-data?${legacyParams}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.candles;
}

export function useReplayEngine({ asset, timeframe = "15m", startDate, initialIndex = 1 }) {
  const [allCandles, setAllCandles]   = useState([]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [speed, setSpeed]             = useState(1);
  const [status, setStatus]           = useState("idle");   // idle | loading | ready | error
  const [error, setError]             = useState(null);
  const intervalRef = useRef(null);

  // ── Fetch candles whenever asset/timeframe/startDate change ────────────────
  useEffect(() => {
    if (!asset) return;

    setStatus("loading");
    setError(null);
    setIsPlaying(false);
    clearInterval(intervalRef.current);

    fetchCandlesFromApi(asset, timeframe, startDate)
      .then((candles) => {
        if (!candles?.length) throw new Error("No candles returned.");
        setAllCandles(candles);

        // Land on the candle that matches startDate, with at least 50 visible
        let landingIdx = 50;
        if (startDate) {
          const target = new Date(startDate).getTime();
          for (let i = 0; i < candles.length; i++) {
            if (new Date(candles[i].time).getTime() >= target) {
              landingIdx = Math.max(50, i + 1);
              break;
            }
          }
        }
        setCurrentIndex(initialIndex > 1 ? Math.min(initialIndex, candles.length) : landingIdx);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, [asset, timeframe, startDate]);

  // ── Playback interval ───────────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(intervalRef.current);

    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((i) => {
          if (i >= allCandles.length) {
            setIsPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, SPEED_MAP[speed] ?? 800);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, allCandles.length]);

  // ── Controls ────────────────────────────────────────────────────────────────
  const play        = useCallback(() => setIsPlaying(true),  []);
  const pause       = useCallback(() => setIsPlaying(false), []);
  const stepForward = useCallback(() => setCurrentIndex((i) => Math.min(i + 1, allCandles.length)), [allCandles.length]);
  const stepBack    = useCallback(() => setCurrentIndex((i) => Math.max(i - 1, 1)), []);
  const jumpTo      = useCallback((idx) => setCurrentIndex(Math.max(1, Math.min(idx, allCandles.length))), [allCandles.length]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const visibleCandles = allCandles.slice(0, currentIndex);
  const currentCandle  = allCandles[currentIndex - 1] ?? null;

  return {
    // Data
    allCandles,
    visibleCandles,
    currentCandle,
    currentIndex,
    totalCandles: allCandles.length,
    // State
    isPlaying,
    speed,
    status,   // 'idle' | 'loading' | 'ready' | 'error'
    error,
    // Controls
    play,
    pause,
    stepForward,
    stepBack,
    jumpTo,
    setSpeed,
    setCurrentIndex,
  };
}
