import type { SensorStatus } from "./data";

const STATUS_CFG: Record<SensorStatus, { dot: string; text: string; bg: string; label: string; pulse: boolean }> = {
  online:   { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-500/15", label: "Online",   pulse: true },
  unstable: { dot: "bg-amber-500",   text: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-100 dark:bg-amber-500/15",   label: "Unstable", pulse: true },
  warning:  { dot: "bg-amber-500",   text: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-100 dark:bg-amber-500/15",   label: "Unstable", pulse: true },
  offline:  { dot: "bg-rose-500",    text: "text-rose-700 dark:text-rose-300",     bg: "bg-rose-100 dark:bg-rose-500/15",     label: "Offline",  pulse: false },
};

export function StatusBadge({ status, delayMin, missed }: { status: SensorStatus; delayMin?: number; missed?: number }) {
  const cfg = STATUS_CFG[status];
  return (
    <span
      role="status"
      aria-label={`Status: ${cfg.label}${delayMin ? `, delayed ${delayMin} minutes` : ""}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${cfg.bg} ${cfg.text}`}
      title={
        status === "unstable" || status === "warning"
          ? `Missed ${missed ?? 0} transmission${(missed ?? 0) === 1 ? "" : "s"} (not critical yet)`
          : undefined
      }
    >
      <span className="relative flex size-1.5" aria-hidden="true">
        {cfg.pulse && <span className={`absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60 animate-ping motion-reduce:hidden`} />}
        <span className={`relative inline-flex size-1.5 rounded-full ${cfg.dot}`} />
      </span>
      {cfg.label}
      {delayMin !== undefined && delayMin > 0 && (
        <span className="opacity-70">+{delayMin}m</span>
      )}
    </span>
  );
}

export function BatteryBar({ value }: { value: number }) {
  const color = value >= 30 ? "bg-emerald-500" : value >= 15 ? "bg-amber-500" : value > 0 ? "bg-rose-500" : "bg-slate-300";
  const level = value >= 30 ? "healthy" : value >= 15 ? "warning" : value > 0 ? "critical" : "empty";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Battery ${value}% (${level})`}
        className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"
      >
        <div className={`h-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right" aria-hidden="true">{value}%</span>
    </div>
  );
}
