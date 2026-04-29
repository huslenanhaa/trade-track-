import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { backtestApi } from "@/api/backtestApi";

// ---------------------------------------------------------------------------
// useBacktestTrades
//
// Manages open/closed trades inside a replay session.
// Handles:
//  - Opening trades (stored in backtest_trades)
//  - SL/TP auto-close on each candle tick
//  - Manual close
//  - Auto-sync closed trades → trades (journal) table with source='backtest'
// ---------------------------------------------------------------------------

function calcPnl(trade, exitPrice) {
  const diff =
    trade.direction === "long"
      ? exitPrice - trade.entryPrice
      : trade.entryPrice - exitPrice;
  return Number((diff * trade.lotSize).toFixed(2));
}

function calcRR(trade, exitPrice) {
  const slDist = Math.abs(trade.entryPrice - trade.sl);
  if (!slDist) return 0;
  const pnl = calcPnl(trade, exitPrice);
  return Number((pnl / (slDist * trade.lotSize)).toFixed(2));
}

function getResult(pnl) {
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "breakeven";
}

// ── Journal sync ─────────────────────────────────────────────────────────────
async function syncToJournal(trade, sessionId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const row = {
      user_id:            session.user.id,
      symbol:             trade.symbol,
      date:               trade.closeTime || new Date().toISOString(),
      direction:          trade.direction,
      entry_price:        trade.entryPrice,
      exit_price:         trade.exitPrice,
      stop_loss:          trade.sl || 0,
      take_profit:        trade.tp || 0,
      lot_size:           trade.lotSize,
      pnl:                trade.pnl,
      risk_reward:        trade.rr,
      outcome:            getResult(trade.pnl),
      status:             "closed",
      source:             "backtest",
      backtest_session_id: sessionId,
      notes:              trade.notes || "",
      tags:               ["backtest"],
      session:            "Backtest",
      strategy:           trade.setupTag || "",
    };

    await supabase.from("trades").insert(row);
  } catch (err) {
    console.warn("[useBacktestTrades] journal sync failed:", err.message);
  }
}

export function useBacktestTrades({ sessionId, symbol, startingBalance = 10000, syncToJournalEnabled = true }) {
  const [openTrades,   setOpenTrades]   = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [isSaving,     setIsSaving]     = useState(false);

  // Track trades we've already auto-closed this tick to avoid double-fires
  const closingRef = useRef(new Set());

  // ── Open a trade ─────────────────────────────────────────────────────────
  const openTrade = useCallback(async ({
    direction, entryPrice, sl, tp, lotSize,
    entryCandle, setupTag = "", notes = "",
  }) => {
    setIsSaving(true);
    try {
      const result = await backtestApi.trades.create(sessionId, {
        symbol,
        direction,
        entryPrice,
        sl,
        tp,
        lotSize,
        status:   "open",
        openTime: entryCandle?.time || new Date().toISOString(),
        notes,
        setupTag,
        pnl:    0,
        result: "breakeven",
        rr:     0,
      });

      const newTrade = {
        ...result.trade,
        entryPrice,
        sl,
        tp,
        lotSize,
        direction,
      };

      setOpenTrades((prev) => [...prev, newTrade]);
      return newTrade;
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, symbol]);

  // ── Close a trade ─────────────────────────────────────────────────────────
  const closeTrade = useCallback(async (trade, exitPrice, exitCandle = null) => {
    if (closingRef.current.has(trade.id)) return; // prevent double-fire
    closingRef.current.add(trade.id);

    const pnl    = calcPnl(trade, exitPrice);
    const rr     = calcRR(trade, exitPrice);
    const result = getResult(pnl);

    const closed = {
      ...trade,
      exitPrice,
      pnl,
      rr,
      result,
      status:    "closed",
      closeTime: exitCandle?.time || new Date().toISOString(),
    };

    // Optimistic UI update first
    setOpenTrades((prev) => prev.filter((t) => t.id !== trade.id));
    setClosedTrades((prev) => [...prev, closed]);

    // Persist to DB
    try {
      await backtestApi.trades.create(sessionId, {
        symbol,
        direction:  trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice,
        sl:         trade.sl,
        tp:         trade.tp,
        lotSize:    trade.lotSize,
        pnl,
        rr,
        result,
        status:    "closed",
        openTime:  trade.openTime,
        closeTime: closed.closeTime,
        notes:     trade.notes,
        setupTag:  trade.setupTag,
      });

      if (syncToJournalEnabled) {
        await syncToJournal(closed, sessionId);
      }
    } catch (err) {
      console.warn("[useBacktestTrades] closeTrade persist failed:", err.message);
    } finally {
      closingRef.current.delete(trade.id);
    }

    return closed;
  }, [sessionId, symbol, syncToJournalEnabled]);

  // ── SL/TP auto-check on new candle ────────────────────────────────────────
  const checkSlTp = useCallback((candle) => {
    if (!candle || openTrades.length === 0) return;

    openTrades.forEach((trade) => {
      const { high, low } = candle;

      if (trade.direction === "long") {
        if (trade.sl && low <= trade.sl) {
          closeTrade(trade, trade.sl, candle);
        } else if (trade.tp && high >= trade.tp) {
          closeTrade(trade, trade.tp, candle);
        }
      } else {
        // short
        if (trade.sl && high >= trade.sl) {
          closeTrade(trade, trade.sl, candle);
        } else if (trade.tp && low <= trade.tp) {
          closeTrade(trade, trade.tp, candle);
        }
      }
    });
  }, [openTrades, closeTrade]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalPnl   = closedTrades.reduce((s, t) => s + t.pnl, 0);
  const wins       = closedTrades.filter((t) => t.result === "win");
  const winRate    = closedTrades.length > 0
    ? ((wins.length / closedTrades.length) * 100).toFixed(1)
    : "0.0";
  const balance    = startingBalance + totalPnl;

  return {
    openTrades,
    closedTrades,
    allTrades: [...closedTrades, ...openTrades],
    isSaving,
    openTrade,
    closeTrade,
    checkSlTp,
    stats: {
      totalPnl,
      winRate,
      balance,
      tradeCount: closedTrades.length,
      wins: wins.length,
    },
  };
}
