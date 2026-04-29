import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths, startOfWeek, endOfWeek
} from "date-fns";

export default function CalendarReview() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: () => appClient.entities.Trade.list("-date", 5000),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Build trade data by date
  const tradesByDate = {};
  trades.forEach(t => {
    const d = format(new Date(t.date), "yyyy-MM-dd");
    if (!tradesByDate[d]) tradesByDate[d] = { pnl: 0, count: 0, trades: [], wins: 0 };
    tradesByDate[d].pnl += t.pnl || 0;
    tradesByDate[d].count++;
    tradesByDate[d].trades.push(t);
    if (t.outcome === "win") tradesByDate[d].wins++;
  });

  // Build calendar grid (Mon–Sun)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Month summary
  const monthTrades = Object.entries(tradesByDate)
    .filter(([d]) => d >= format(monthStart, "yyyy-MM-dd") && d <= format(monthEnd, "yyyy-MM-dd"));
  const monthPnl = monthTrades.reduce((s, [, v]) => s + v.pnl, 0);
  const monthTradeCount = monthTrades.reduce((s, [, v]) => s + v.count, 0);
  const greenDays = monthTrades.filter(([, v]) => v.pnl > 0).length;
  const redDays = monthTrades.filter(([, v]) => v.pnl < 0).length;

  const selectedData = selectedDay ? tradesByDate[format(selectedDay, "yyyy-MM-dd")] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar Review</h1>
          <p className="text-sm text-muted-foreground mt-1">Daily P&L performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-base font-semibold min-w-36 text-center">{format(currentMonth, "MMMM yyyy")}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Month P&L</p>
          <p className={`text-xl font-bold ${monthPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
            {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4 rounded-2xl text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trades</p>
          <p className="text-xl font-bold">{monthTradeCount}</p>
        </Card>
        <Card className="p-4 rounded-2xl text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Green Days</p>
          <p className="text-xl font-bold text-green-600">{greenDays}</p>
        </Card>
        <Card className="p-4 rounded-2xl text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Red Days</p>
          <p className="text-xl font-bold text-red-600">{redDays}</p>
        </Card>
      </div>

      <div className="flex gap-4">
        {/* Calendar Grid */}
        <Card className={`overflow-hidden rounded-2xl flex-1`}>
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-muted/30 border-b border-border">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => (
              <div key={d} className="py-3 text-xs font-semibold text-muted-foreground text-center border-r border-border last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {allDays.map((day, i) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayData = tradesByDate[dateKey];
              const isCurrentMonth = day >= monthStart && day <= monthEnd;
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay && isSameDay(day, selectedDay);

              return (
                <div
                  key={i}
                  onClick={() => isCurrentMonth && dayData && setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                  className={`min-h-20 border-r border-b border-border p-2 transition-colors relative
                    ${isCurrentMonth ? "cursor-pointer hover:bg-orange-50/60" : "bg-muted/10 opacity-40"}
                    ${isSelected ? "bg-orange-50 ring-2 ring-inset ring-primary/30" : ""}
                    ${dayData && dayData.pnl > 0 && isCurrentMonth ? "bg-green-50/50 hover:bg-green-50" : ""}
                    ${dayData && dayData.pnl < 0 && isCurrentMonth ? "bg-red-50/50 hover:bg-red-50" : ""}
                  `}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary font-bold" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  {dayData && isCurrentMonth && (
                    <div className="flex flex-col gap-0.5">
                      <div className={`text-sm font-bold leading-tight ${dayData.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {dayData.pnl >= 0 ? "+" : ""}{dayData.pnl.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dayData.count} trade{dayData.count !== 1 ? "s" : ""}
                      </div>
                      <div className={`h-1 rounded-full mt-0.5 ${dayData.pnl >= 0 ? "bg-green-500" : "bg-red-500"}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Side Drawer */}
        {selectedDay && selectedData && (
          <Card className="w-72 p-5 rounded-2xl flex-shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{format(selectedDay, "MMMM dd, yyyy")}</h3>
              <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Day P&L</p>
                <p className={`text-lg font-bold ${selectedData.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {selectedData.pnl >= 0 ? "+" : ""}{selectedData.pnl.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-lg font-bold">
                  {selectedData.count > 0 ? Math.round((selectedData.wins / selectedData.count) * 100) : 0}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trades</p>
              {selectedData.trades.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold">{t.symbol}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      t.direction === "long" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{t.direction}</span>
                  </div>
                  <p className={`text-sm font-bold ${(t.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {(t.pnl || 0) >= 0 ? "+" : ""}${(t.pnl || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!selectedDay && (
          <Card className="w-64 p-5 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center text-center gap-3 hidden lg:flex">
            <div className="text-4xl">📅</div>
            <p className="text-sm text-muted-foreground">Click a day to view trades</p>
          </Card>
        )}
      </div>
    </div>
  );
}
