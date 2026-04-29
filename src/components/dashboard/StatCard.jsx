import React from "react";
import { Card } from "@/components/ui/card";

export default function StatCard({ title, value, icon: Icon, trend, trendUp, subtitle }) {
  return (
    <Card className="p-5 bg-card border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`text-xs font-semibold ${trendUp ? "text-green-500" : "text-red-500"}`}>
            {trendUp ? "+" : ""}{trend}
          </span>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>
      )}
    </Card>
  );
}