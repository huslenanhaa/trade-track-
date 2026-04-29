// ---------------------------------------------------------------------------
// OHLCV CSV Parser
// Supported formats:
//   datetime,open,high,low,close,volume
//   date,time,open,high,low,close,volume  (date + time split into two cols)
//   timestamp,open,high,low,close         (unix or ISO)
// ---------------------------------------------------------------------------

function detectDelimiter(line) {
  if (line.includes(";")) return ";";
  if (line.includes("\t")) return "\t";
  return ",";
}

function parseDateTime(raw) {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/"/g, "");
  // Unix timestamp (seconds or milliseconds)
  if (/^\d{10}$/.test(trimmed)) return new Date(Number(trimmed) * 1000);
  if (/^\d{13}$/.test(trimmed)) return new Date(Number(trimmed));
  // ISO or common formats
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;
  // Try YYYY.MM.DD HH:MM or DD.MM.YYYY HH:MM
  const dotFormat = trimmed.replace(/(\d{4})\.(\d{2})\.(\d{2})/, "$1-$2-$3");
  const d2 = new Date(dotFormat);
  if (!isNaN(d2.getTime())) return d2;
  return null;
}

/**
 * Parse raw CSV text into candle objects compatible with the app's format.
 * Returns array of { time, open, high, low, close, volume, bullish }
 */
export function parseCsvToCandles(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const delim = detectDelimiter(lines[0]);
  const headers = lines[0].split(delim).map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  // Detect column indices
  const col = (names) => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx = col(["datetime", "date", "time", "timestamp", "date_time", "dt"]);
  const timeIdx = col(["time"]);
  const openIdx = col(["open", "o"]);
  const highIdx = col(["high", "h"]);
  const lowIdx = col(["low", "l"]);
  const closeIdx = col(["close", "c"]);
  const volumeIdx = col(["volume", "vol", "v"]);

  // Separate date + time columns (e.g. MT4 exports)
  const dateSplitIdx = col(["date"]);
  const timeSplitIdx = headers.findIndex((h, i) => h === "time" && i !== dateIdx);

  if (openIdx === -1 || highIdx === -1 || lowIdx === -1 || closeIdx === -1) {
    throw new Error("CSV must have open, high, low, close columns.");
  }

  const candles = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim).map((c) => c.trim().replace(/"/g, ""));
    if (cols.length < 4) continue;

    let dateStr;
    if (dateSplitIdx !== -1 && timeSplitIdx !== -1 && dateSplitIdx !== timeSplitIdx) {
      dateStr = `${cols[dateSplitIdx]} ${cols[timeSplitIdx]}`;
    } else {
      dateStr = cols[dateIdx] ?? cols[0];
    }

    const dt = parseDateTime(dateStr);
    if (!dt) continue;

    const open = parseFloat(cols[openIdx]);
    const high = parseFloat(cols[highIdx]);
    const low = parseFloat(cols[lowIdx]);
    const close = parseFloat(cols[closeIdx]);
    const volume = volumeIdx !== -1 ? parseFloat(cols[volumeIdx]) || 0 : 0;

    if ([open, high, low, close].some(isNaN)) continue;

    candles.push({
      time: dt.toISOString(),
      open,
      high,
      low,
      close,
      volume,
      bullish: close >= open,
    });
  }

  // Sort ascending by time (some exports are newest-first)
  candles.sort((a, b) => new Date(a.time) - new Date(b.time));

  // Deduplicate by timestamp
  const seen = new Set();
  return candles.filter((c) => {
    if (seen.has(c.time)) return false;
    seen.add(c.time);
    return true;
  });
}
