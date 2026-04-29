import { ChevronLeft, ChevronRight, Pause, Play, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// ReplayControls
// Play / Pause / Step Forward / Step Back / Speed selector
// ---------------------------------------------------------------------------

const SPEEDS = [1, 2, 5, 10];

export function ReplayControls({
  isPlaying,
  speed,
  currentIndex,
  totalCandles,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onSetSpeed,
  onReset,
  disabled = false,
}) {
  const progress = totalCandles > 0 ? ((currentIndex / totalCandles) * 100).toFixed(1) : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Progress bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums w-16 shrink-0">
          {currentIndex.toLocaleString()} / {totalCandles.toLocaleString()}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="tabular-nums w-10 text-right">{progress}%</span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Reset to start */}
        {onReset && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onReset}
            disabled={disabled || currentIndex <= 1}
            title="Reset to start"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Step back */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onStepBack}
          disabled={disabled || currentIndex <= 1}
          title="Previous candle"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {/* Play / Pause */}
        <Button
          size="sm"
          className="h-8 px-4 gap-1.5"
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled || currentIndex >= totalCandles}
        >
          {isPlaying ? (
            <><Pause className="h-3.5 w-3.5" /> Pause</>
          ) : (
            <><Play  className="h-3.5 w-3.5" /> Play</>
          )}
        </Button>

        {/* Step forward */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onStepForward}
          disabled={disabled || currentIndex >= totalCandles}
          title="Next candle"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        {/* Speed pills */}
        <div className="ml-1 flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              disabled={disabled}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                speed === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
