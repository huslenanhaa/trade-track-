import React from "react";
import { MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/ThemeContext";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className = "", showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  const label = isDark ? "Light mode" : "Dark mode";
  const Icon = isDark ? SunMedium : MoonStar;

  return (
    <Button
      aria-label={`Switch to ${label.toLowerCase()}`}
      className={cn(
        "rounded-xl border-border/80 bg-background/80 backdrop-blur-sm",
        showLabel ? "h-9 px-3 text-xs" : "h-9 w-9",
        className,
      )}
      onClick={toggleTheme}
      size={showLabel ? "sm" : "icon"}
      title={label}
      type="button"
      variant="outline"
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
