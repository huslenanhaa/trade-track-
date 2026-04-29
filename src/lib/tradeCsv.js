import {
  calculateOutcome,
  calculatePnL,
  calculateRiskReward,
} from "./tradeCalculations.js";

export const TRADE_EXPORT_HEADERS = [
  "date",
  "symbol",
  "direction",
  "entry_price",
  "exit_price",
  "stop_loss",
  "take_profit",
  "lot_size",
  "pnl",
  "risk_reward",
  "outcome",
  "session",
  "strategy",
  "notes",
  "tags",
];

const FIELD_ALIASES = {
  // MT4/MT5: Item, MT5: Symbol
  symbol: ["symbol", "instrument", "pair", "market", "asset", "ticker", "item", "currency_pair", "contract", "security"],
  // MT4/MT5: type = buy/sell
  direction: ["direction", "side", "type", "position_type", "order_type", "action", "trade_type", "buy_sell", "operation"],
  // MT4: Price (open), MT5: Price
  entry_price: ["entry_price", "entry", "open_price", "entryprice", "open", "price", "price_1", "fill_price", "execution_price", "open_rate"],
  // MT4: Close Price, MT5: Close Price
  exit_price: ["exit_price", "exit", "close_price", "exitprice", "closing_price", "close", "price_2", "close_rate", "fill_close_price"],
  // MT4: S/L, MT5: S/L
  stop_loss: ["stop_loss", "sl", "s_l", "stop", "stoploss", "stop_price"],
  // MT4: T/P, MT5: T/P
  take_profit: ["take_profit", "tp", "t_p", "target", "takeprofit", "take_profit_price", "tp_price"],
  // MT4: Size, MT5: Volume
  lot_size: ["lot_size", "lots", "lot", "volume", "size", "qty", "quantity", "position_size", "units", "contracts", "shares"],
  // MT4: Profit, MT5: Profit
  pnl: ["pnl", "profit", "net_pnl", "realized_pnl", "net_profit", "gross_profit", "p_l", "p&l", "gain_loss", "return", "pl"],
  risk_reward: ["risk_reward", "rr", "rr_ratio", "r_multiple", "r", "reward_risk"],
  outcome: ["outcome", "result", "trade_result", "win_loss"],
  status: ["status", "state", "trade_status"],
  session: ["session", "trading_session", "market_session"],
  strategy: ["strategy", "setup", "playbook", "pattern", "system", "method"],
  notes: ["notes", "note", "comment", "comments", "reason", "description", "remarks", "memo"],
  tags: ["tags", "tag", "label", "labels", "category"],
  mistakes: ["mistakes", "mistake", "error", "errors"],
  account: ["account", "broker_account", "portfolio", "book", "account_name", "login", "account_id"],
};

const DIRECT_DATE_ALIASES = [
  "datetime",
  "date_time",
  "trade_date",
  "timestamp",
  "open_time",        // MT4/MT5
  "entry_time",
  "close_time",       // MT4/MT5
  "time",
  "time_2",
  "opened",           // some brokers
  "closed",
  "execution_time",
  "transaction_date",
  "trade_datetime",
];

const DATE_ONLY_ALIASES = ["date", "trade_day", "open_date", "close_date", "day", "entry_date", "exit_date"];
const TIME_ONLY_ALIASES = [
  "time",
  "time_2",
  "time_only",
  "clock",
  "hour",
  "trade_time",
  "entry_time",
  "entry_time_only",
  "exit_time",
  "open_time",
  "open_time_only",
  "close_time",
  "close_time_only",
];
const AMBIGUOUS_DATE_ALIASES = ["open", "close"];
const LONG_DIRECTION_PATTERN = /\b(buy|long)\b/;
const SHORT_DIRECTION_PATTERN = /\b(sell|short)\b/;
const TIME_ONLY_VALUE_PATTERN = /^\d{1,2}:\d{2}(?::\d{2})?(?:\s?[ap]m)?$/i;
const NUMERIC_DATE_PATTERN = /^(\d{1,4})([./-])(\d{1,2})\2(\d{1,4})(?:[ T]+(.+))?$/;
const DATE_SIGNAL_PATTERN = /(?:\d{1,4}[./-]\d{1,2}[./-]\d{1,4}|\d{10,13}|[a-z]{3,})/i;

const normalizeHeader = (header) =>
  String(header ?? "")
    .replace(/^\ufeff/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const detectDelimiter = (text) => {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0);
  if (!firstLine) {
    return ",";
  }

  const delimiters = [",", ";", "\t"];
  return delimiters.reduce((bestDelimiter, delimiter) => {
    const currentCount = firstLine.split(delimiter).length;
    const bestCount = firstLine.split(bestDelimiter).length;
    return currentCount > bestCount ? delimiter : bestDelimiter;
  }, ",");
};

const parseCsvText = (text) => {
  const delimiter = detectDelimiter(text);
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let inQuotes = false;

  const pushValue = () => {
    currentRow.push(currentValue);
    currentValue = "";
  };

  const pushRow = () => {
    if (currentRow.length === 0) {
      return;
    }

    if (currentRow.some((cell) => String(cell).trim().length > 0)) {
      rows.push(currentRow);
    }

    currentRow = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (inQuotes) {
      if (character === '"') {
        if (nextCharacter === '"') {
          currentValue += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentValue += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
      continue;
    }

    if (character === delimiter) {
      pushValue();
      continue;
    }

    if (character === "\n") {
      pushValue();
      pushRow();
      continue;
    }

    if (character === "\r") {
      pushValue();
      pushRow();
      if (nextCharacter === "\n") {
        index += 1;
      }
      continue;
    }

    currentValue += character;
  }

  pushValue();
  pushRow();

  return rows;
};

const buildUniqueHeaders = (headers) => {
  const seenHeaders = new Map();

  return headers.map((header, index) => {
    const normalizedHeader = normalizeHeader(header) || `column_${index + 1}`;
    const seenCount = seenHeaders.get(normalizedHeader) || 0;
    seenHeaders.set(normalizedHeader, seenCount + 1);
    return seenCount === 0 ? normalizedHeader : `${normalizedHeader}_${seenCount + 1}`;
  });
};

const getFieldValue = (row, aliases) => {
  for (const alias of aliases) {
    const value = row[alias];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return "";
};

const getTrimmedCellValue = (row, alias) => {
  const value = row[alias];
  return typeof value === "string" ? value.trim() : "";
};

const getNumericFieldValue = (row, aliases) => {
  for (const alias of aliases) {
    const rawValue = row[alias];
    if (typeof rawValue !== "string" || rawValue.trim() === "") {
      continue;
    }

    const parsedValue = parseNumberCell(rawValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return null;
};

const hasAnyAlias = (headers, aliases) => aliases.some((alias) => headers.includes(alias));

const normalizeNumberSeparators = (value) => {
  const lastCommaIndex = value.lastIndexOf(",");
  const lastDotIndex = value.lastIndexOf(".");

  if (lastCommaIndex !== -1 && lastDotIndex !== -1) {
    return lastCommaIndex > lastDotIndex
      ? value.replace(/\./g, "").replace(",", ".")
      : value.replace(/,/g, "");
  }

  if (lastCommaIndex !== -1) {
    const commaParts = value.split(",");
    const lastPart = commaParts.at(-1);
    const looksLikeThousands =
      commaParts.length > 2 ||
      (lastPart?.length === 3 && commaParts.slice(0, -1).every((part) => /^\d{1,3}$/.test(part)));

    return looksLikeThousands ? value.replace(/,/g, "") : value.replace(",", ".");
  }

  const dotParts = value.split(".");
  if (dotParts.length > 2 && dotParts.at(-1)?.length === 3) {
    return value.replace(/\./g, "");
  }

  return value;
};

const parseNumberCell = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  let normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return null;
  }

  let isNegative = false;
  if (/^\(.*\)$/.test(normalizedValue)) {
    isNegative = true;
    normalizedValue = normalizedValue.slice(1, -1);
  }

  normalizedValue = normalizedValue
    .replace(/[\u00a3$\u20ac\u00a5%]/g, "")
    .replace(/\s+/g, "");

  normalizedValue = normalizeNumberSeparators(normalizedValue);

  normalizedValue = normalizedValue.replace(/[^0-9.-]/g, "");
  if (!normalizedValue || normalizedValue === "-" || normalizedValue === ".") {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return isNegative ? -Math.abs(parsedValue) : parsedValue;
};

const parseListCell = (value) => {
  if (!value) {
    return [];
  }

  const listValues = /[;|]/.test(value)
    ? value.split(/[;|]/)
    : value.includes(", ")
      ? value.split(",")
      : [value];

  return listValues.map((item) => item.trim()).filter(Boolean);
};

const normalizeDirection = (value) => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) {
    return "long";
  }

  if (LONG_DIRECTION_PATTERN.test(normalizedValue)) {
    return "long";
  }

  if (SHORT_DIRECTION_PATTERN.test(normalizedValue)) {
    return "short";
  }

  return "";
};

const normalizeStatus = (value) => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) {
    return "";
  }

  if (["open", "opened", "active", "running", "pending"].includes(normalizedValue)) {
    return "open";
  }

  if (["closed", "complete", "completed", "done", "filled"].includes(normalizedValue)) {
    return "closed";
  }

  if (["win", "loss", "breakeven", "break_even", "be"].includes(normalizedValue)) {
    return "closed";
  }

  return "";
};

const normalizeOutcome = (value) => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) {
    return "";
  }

  if (["open", "opened", "active", "running", "pending"].includes(normalizedValue)) {
    return "open";
  }

  if (["win", "winner", "profit", "tp", "take_profit", "positive"].includes(normalizedValue)) {
    return "win";
  }

  if (["loss", "lose", "sl", "stop_loss", "negative"].includes(normalizedValue)) {
    return "loss";
  }

  if (["breakeven", "break_even", "be", "scratch"].includes(normalizedValue)) {
    return "breakeven";
  }

  return "";
};

const isTimeOnlyValue = (value) => TIME_ONLY_VALUE_PATTERN.test(String(value || "").trim());

const parseTimeParts = (value = "") => {
  const trimmedValue = String(value || "").trim();
  if (!trimmedValue) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  const match = trimmedValue.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?(?:\s*([ap])\.?m\.?)?$/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const meridiem = match[4]?.toLowerCase();

  if (meridiem === "p" && hours < 12) {
    hours += 12;
  }

  if (meridiem === "a" && hours === 12) {
    hours = 0;
  }

  if (hours > 23 || minutes > 59 || seconds > 59) {
    return null;
  }

  return { hours, minutes, seconds };
};

const normalizeYear = (value) => {
  const year = Number(value);
  if (!Number.isInteger(year)) {
    return null;
  }

  if (String(value).length <= 2) {
    return year >= 70 ? 1900 + year : 2000 + year;
  }

  return year;
};

const buildDateFromParts = ({ year, month, day, time }) => {
  const normalizedYear = normalizeYear(year);
  const normalizedMonth = Number(month);
  const normalizedDay = Number(day);
  const timeParts = parseTimeParts(time);

  if (
    !normalizedYear ||
    !Number.isInteger(normalizedMonth) ||
    !Number.isInteger(normalizedDay) ||
    !timeParts ||
    normalizedMonth < 1 ||
    normalizedMonth > 12 ||
    normalizedDay < 1 ||
    normalizedDay > 31
  ) {
    return null;
  }

  const date = new Date(
    normalizedYear,
    normalizedMonth - 1,
    normalizedDay,
    timeParts.hours,
    timeParts.minutes,
    timeParts.seconds,
  );

  if (
    date.getFullYear() !== normalizedYear ||
    date.getMonth() !== normalizedMonth - 1 ||
    date.getDate() !== normalizedDay
  ) {
    return null;
  }

  return date;
};

const parseNumericDateCell = (value) => {
  const match = String(value || "").trim().match(NUMERIC_DATE_PATTERN);
  if (!match) {
    return null;
  }

  const [, first, separator, second, third, time] = match;
  if (first.length === 4) {
    return buildDateFromParts({ year: first, month: second, day: third, time });
  }

  const firstNumber = Number(first);
  const secondNumber = Number(second);
  const thirdLooksLikeYear = third.length === 4 || third.length === 2;
  if (!thirdLooksLikeYear) {
    return null;
  }

  if (firstNumber > 12) {
    return buildDateFromParts({ year: third, month: second, day: first, time });
  }

  if (secondNumber > 12) {
    return buildDateFromParts({ year: third, month: first, day: second, time });
  }

  // Keep slash dates compatible with the browser's US-style default, while
  // broker-style dot dates usually mean day.month.year.
  return separator === "."
    ? buildDateFromParts({ year: third, month: second, day: first, time })
    : buildDateFromParts({ year: third, month: first, day: second, time });
};

const parseDateCell = (value) => {
  const trimmedValue = String(value || "").replace(/^\ufeff/, "").trim();
  if (!trimmedValue) {
    return null;
  }

  if (/^\d{10}$/.test(trimmedValue)) {
    return new Date(Number(trimmedValue) * 1000);
  }

  if (/^\d{13}$/.test(trimmedValue)) {
    return new Date(Number(trimmedValue));
  }

  const numericDate = parseNumericDateCell(trimmedValue);
  if (numericDate) {
    return numericDate;
  }

  if (!DATE_SIGNAL_PATTERN.test(trimmedValue) || /^\d+(?:\.\d+)?$/.test(trimmedValue)) {
    return null;
  }

  const nativeDate = new Date(trimmedValue);
  return Number.isNaN(nativeDate.getTime()) ? null : nativeDate;
};

const normalizeDateCell = (value) => {
  const date = parseDateCell(value);
  return date ? date.toISOString() : "";
};

const getTimeOnlyValue = (row) => {
  for (const alias of TIME_ONLY_ALIASES) {
    const value = getTrimmedCellValue(row, alias);
    if (value && isTimeOnlyValue(value)) {
      return value;
    }
  }

  return "";
};

const getDateValue = (row) => {
  const dateOnlyValue = getFieldValue(row, DATE_ONLY_ALIASES);
  const timeOnlyValue = getTimeOnlyValue(row);

  if (dateOnlyValue && timeOnlyValue && !dateOnlyValue.includes(":")) {
    return `${dateOnlyValue} ${timeOnlyValue}`;
  }

  for (const alias of DIRECT_DATE_ALIASES) {
    const value = getTrimmedCellValue(row, alias);
    if (!value || isTimeOnlyValue(value) || !isValidDateValue(value)) {
      continue;
    }

    return value;
  }

  for (const alias of AMBIGUOUS_DATE_ALIASES) {
    const value = getTrimmedCellValue(row, alias);
    if (value && !isTimeOnlyValue(value) && isValidDateValue(value)) {
      return value;
    }
  }

  return dateOnlyValue;
};

const isValidDateValue = (value) => Boolean(parseDateCell(value));

const mapCsvRowToTrade = (row) => {
  const symbol = getFieldValue(row, FIELD_ALIASES.symbol).toUpperCase();
  const date = normalizeDateCell(getDateValue(row));
  const entryPrice = getNumericFieldValue(row, FIELD_ALIASES.entry_price);
  const exitPrice = getNumericFieldValue(row, FIELD_ALIASES.exit_price);
  const stopLoss = getNumericFieldValue(row, FIELD_ALIASES.stop_loss);
  const takeProfit = getNumericFieldValue(row, FIELD_ALIASES.take_profit);
  const lotSize = getNumericFieldValue(row, FIELD_ALIASES.lot_size);
  const pnl = getNumericFieldValue(row, FIELD_ALIASES.pnl);
  const riskReward = getNumericFieldValue(row, FIELD_ALIASES.risk_reward);
  const direction = normalizeDirection(getFieldValue(row, FIELD_ALIASES.direction));
  const explicitStatus = normalizeStatus(getFieldValue(row, FIELD_ALIASES.status));
  const explicitOutcome = normalizeOutcome(getFieldValue(row, FIELD_ALIASES.outcome));

  if (!symbol || !date || !direction) {
    return null;
  }

  const trade = {
    date,
    symbol,
    direction,
    entry_price: entryPrice ?? "",
    exit_price: exitPrice ?? "",
    stop_loss: stopLoss ?? "",
    take_profit: takeProfit ?? "",
    lot_size: lotSize ?? "",
    pnl: pnl ?? "",
    risk_reward: riskReward ?? "",
    session: getFieldValue(row, FIELD_ALIASES.session),
    strategy: getFieldValue(row, FIELD_ALIASES.strategy),
    notes: getFieldValue(row, FIELD_ALIASES.notes),
    tags: parseListCell(getFieldValue(row, FIELD_ALIASES.tags)),
    mistakes: parseListCell(getFieldValue(row, FIELD_ALIASES.mistakes)),
    account: getFieldValue(row, FIELD_ALIASES.account),
  };

  const inferredStatus = explicitStatus || (exitPrice !== null || pnl !== null || explicitOutcome ? "closed" : "open");
  trade.status = inferredStatus;

  if (explicitOutcome) {
    trade.outcome = explicitOutcome;
  } else if (inferredStatus === "open") {
    trade.outcome = "open";
  } else if (pnl !== null) {
    trade.outcome = calculateOutcome(pnl);
  } else {
    trade.outcome = calculateOutcome(calculatePnL({
      direction,
      entry_price: entryPrice || 0,
      exit_price: exitPrice || 0,
      lot_size: lotSize || 0,
    }));
  }

  if (trade.risk_reward === "" && entryPrice !== null && exitPrice !== null && stopLoss !== null) {
    trade.risk_reward = calculateRiskReward({
      direction,
      entry_price: entryPrice,
      exit_price: exitPrice,
      stop_loss: stopLoss,
    });
  }

  return trade;
};

export const parseTradeCsv = (text) => {
  if (!text || !text.trim()) {
    throw new Error("The CSV file is empty.");
  }

  const rows = parseCsvText(text);
  if (rows.length < 2) {
    throw new Error("The CSV file needs a header row and at least one trade row.");
  }

  const [headerRow, ...dataRows] = rows;
  const normalizedHeaders = buildUniqueHeaders(headerRow);

  const hasSymbolHeader = hasAnyAlias(normalizedHeaders, FIELD_ALIASES.symbol);
  const hasDateHeader = hasAnyAlias(normalizedHeaders, [...DIRECT_DATE_ALIASES, ...DATE_ONLY_ALIASES, ...AMBIGUOUS_DATE_ALIASES]);

  if (!hasSymbolHeader || !hasDateHeader) {
    throw new Error("I couldn't find the required symbol/date columns. Supported examples: symbol or instrument, and date, datetime, trade_date, or open_time.");
  }

  const trades = [];
  let skippedRows = 0;

  for (const rowValues of dataRows) {
    const row = {};
    normalizedHeaders.forEach((header, index) => {
      row[header] = String(rowValues[index] ?? "").trim();
    });

    const trade = mapCsvRowToTrade(row);
    if (trade) {
      trades.push(trade);
    } else {
      skippedRows += 1;
    }
  }

  return {
    trades,
    importedRows: trades.length,
    skippedRows,
    totalRows: dataRows.length,
  };
};

const escapeCsvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const MT5_SUMMARY_LABELS = new Set(["balance", "deposit", "withdrawal", "credit", "bonus", "correction"]);

export function parseMt5HtmlReport(htmlText) {
  const doc = new DOMParser().parseFromString(htmlText, "text/html");
  const tables = Array.from(doc.querySelectorAll("table"));

  let tradeTable = null;
  for (const table of tables) {
    const ths = Array.from(table.querySelectorAll("th, td")).map((el) => el.textContent.trim().toLowerCase());
    const hasClose = ths.some((h) => h.includes("close"));
    const hasType = ths.some((h) => h === "type" || h === "direction");
    if (hasClose && hasType) { tradeTable = table; break; }
  }
  if (!tradeTable) {
    throw new Error("No trade history table found. Export a Statement or History report from MT5.");
  }

  const allRows = Array.from(tradeTable.querySelectorAll("tr"));

  let headerIdx = -1;
  let headers = [];
  for (let i = 0; i < allRows.length; i++) {
    const cells = Array.from(allRows[i].querySelectorAll("th, td")).map((el) =>
      el.textContent.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
    );
    if (cells.some((c) => c === "type" || c === "item" || c === "symbol")) {
      headerIdx = i;
      headers = cells;
      break;
    }
  }
  if (headerIdx === -1) throw new Error("Could not find column headers in MT5 report.");

  const col = (...aliases) => {
    for (const alias of aliases) {
      const idx = headers.findIndex((h) => h.includes(alias));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const openTimeIdx = col("open_time");
  const closeTimeIdx = col("close_time");
  const typeIdx = col("type");
  const symbolIdx = col("item", "symbol");
  const sizeIdx = col("size", "volume", "lots");
  const priceIdx = col("open_price", "price");
  const closePriceIdx = col("close_price");
  const slIdx = col("s_l", "sl", "stop");
  const tpIdx = col("t_p", "tp", "take");
  const profitIdx = col("profit");
  const commissionIdx = col("commission");
  const swapIdx = col("swap");

  const parseMt5Date = (s) => {
    if (!s) return "";
    const iso = s.replace(/^(\d{4})\.(\d{2})\.(\d{2})/, "$1-$2-$3");
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? normalizeDateCell(s) : d.toISOString();
  };

  const getNum = (cells, idx) => {
    if (idx === -1 || idx >= cells.length) return null;
    return parseNumberCell(cells[idx]);
  };

  const trades = [];
  let skippedRows = 0;

  for (let i = headerIdx + 1; i < allRows.length; i++) {
    const cells = Array.from(allRows[i].querySelectorAll("td")).map((el) => el.textContent.trim());
    if (cells.length < 3) { skippedRows++; continue; }

    const symbol = symbolIdx !== -1 ? (cells[symbolIdx] || "").trim() : "";
    if (!symbol || MT5_SUMMARY_LABELS.has(symbol.toLowerCase())) { skippedRows++; continue; }

    const rawType = typeIdx !== -1 ? (cells[typeIdx] || "").trim() : "";
    const direction = normalizeDirection(rawType);
    if (!direction) { skippedRows++; continue; }

    const date = parseMt5Date(openTimeIdx !== -1 ? cells[openTimeIdx] : "") ||
                 parseMt5Date(closeTimeIdx !== -1 ? cells[closeTimeIdx] : "");
    if (!date) { skippedRows++; continue; }

    const entryPrice = getNum(cells, priceIdx);
    const exitPrice = getNum(cells, closePriceIdx);
    const sl = getNum(cells, slIdx);
    const tp = getNum(cells, tpIdx);
    const lot = getNum(cells, sizeIdx);
    const profit = getNum(cells, profitIdx);
    const commission = getNum(cells, commissionIdx) ?? 0;
    const swap = getNum(cells, swapIdx) ?? 0;
    const totalPnl = profit !== null ? parseFloat((profit + commission + swap).toFixed(2)) : null;

    const trade = {
      date,
      symbol: symbol.toUpperCase(),
      direction,
      entry_price: entryPrice ?? "",
      exit_price: exitPrice ?? "",
      stop_loss: sl ?? "",
      take_profit: tp ?? "",
      lot_size: lot ?? "",
      pnl: totalPnl ?? "",
      risk_reward: "",
      session: "",
      strategy: "",
      notes: "",
      tags: [],
      mistakes: [],
      account: "",
      status: "closed",
    };

    trade.outcome = totalPnl !== null
      ? calculateOutcome(totalPnl)
      : calculateOutcome(calculatePnL({ direction, entry_price: entryPrice || 0, exit_price: exitPrice || 0, lot_size: lot || 0 }));

    if (entryPrice !== null && exitPrice !== null && sl !== null) {
      trade.risk_reward = calculateRiskReward({ direction, entry_price: entryPrice, exit_price: exitPrice, stop_loss: sl });
    }

    trades.push(trade);
  }

  return { trades, skippedRows, importedRows: trades.length, totalRows: trades.length + skippedRows };
}

export const exportTradesToCsv = (trades) =>
  [
    TRADE_EXPORT_HEADERS.join(","),
    ...trades.map((trade) =>
      TRADE_EXPORT_HEADERS.map((header) => {
        if (header === "tags") {
          return escapeCsvCell((trade.tags || []).join(";"));
        }

        return escapeCsvCell(trade[header] ?? "");
      }).join(","),
    ),
  ].join("\n");
