import { Sun, Moon, Bell, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { alerts } from "./data";

interface TopbarProps {
  title: string;
  subtitle?: string;
  dark: boolean;
  onToggleDark: () => void;
  onOpenAlerts?: () => void;
}

const sevIcon = {
  critical: { I: AlertCircle, tone: "text-rose-600 dark:text-rose-400" },
  warning: { I: AlertTriangle, tone: "text-amber-600 dark:text-amber-400" },
  info: { I: Info, tone: "text-sky-600 dark:text-sky-400" },
} as const;

export function Topbar({ title, subtitle, dark, onToggleDark, onOpenAlerts }: TopbarProps) {
  const recent = [...alerts].sort((a, b) => Number(a.resolved) - Number(b.resolved)).slice(0, 6);
  const unread = alerts.filter((a) => !a.resolved).length;

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur-sm flex items-center justify-between px-8" role="banner">
      <div>
        <h2 className="tracking-tight text-foreground" style={{ fontSize: "1.05rem", lineHeight: 1.2, margin: 0 }}>{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5" style={{ margin: 0 }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleDark}
          className="size-9 rounded-lg border border-border hover:bg-accent flex items-center justify-center text-muted-foreground"
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          aria-pressed={dark}
          type="button"
        >
          {dark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`View notifications (${unread} unread)`}
              className="size-9 rounded-lg border border-border hover:bg-accent flex items-center justify-center text-muted-foreground relative"
            >
              <Bell className="size-4" aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] leading-none flex items-center justify-center tabular-nums" aria-hidden="true">
                  {unread}
                </span>
              )}
              <span className="sr-only">{unread} unread notifications</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-sm text-foreground">Notifications</div>
              <span className="text-xs text-muted-foreground tabular-nums">{unread} unread</span>
            </div>
            <ul className="max-h-80 overflow-y-auto divide-y divide-border" role="list">
              {recent.length === 0 && (
                <li className="px-4 py-6 text-sm text-muted-foreground text-center">No recent alerts</li>
              )}
              {recent.map((a) => {
                const cfg = sevIcon[a.severity];
                const I = cfg.I;
                return (
                  <li key={a.id} className={`px-4 py-3 flex items-start gap-2.5 ${a.resolved ? "opacity-60" : ""}`}>
                    <I className={`size-4 mt-0.5 shrink-0 ${cfg.tone}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-foreground truncate">{a.sensor}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{a.message}</div>
                      <div className="text-[11px] text-muted-foreground mt-1 tabular-nums">{a.time}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="px-4 py-2 border-t border-border">
              <button
                type="button"
                onClick={onOpenAlerts}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5"
              >
                View all alerts →
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
