import { useState } from "react";
import { LayoutDashboard, Cpu, MapPin, Bell, Settings, Activity } from "lucide-react";
import { SettingsDialog } from "./SettingsDialog";

type Page = "dashboard" | "sensors" | "locations" | "alerts";

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
  alertCount: number;
}

const items: { id: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sensors", label: "Sensors", icon: Cpu },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "alerts", label: "Alerts", icon: Bell },
];

export function Sidebar({ current, onNavigate, alertCount }: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col" aria-label="Primary">
      <div className="px-6 py-5 flex items-center gap-2.5 border-b border-border">
        <div className="size-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-sm shadow-sky-500/30" aria-hidden="true">
          <Activity className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-foreground tracking-tight" style={{ fontSize: "1rem", lineHeight: 1.2, margin: 0 }}>Sensor-SmAArt-City</h1>
          <div className="text-xs text-muted-foreground">IoT Control Center</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main">
        <ul className="space-y-1" role="list">
          {items.map((it) => {
            const Icon = it.icon;
            const active = current === it.id;
            return (
              <li key={it.id}>
                <button
                  onClick={() => onNavigate(it.id)}
                  aria-current={active ? "page" : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="flex-1">{it.label}</span>
                  {it.id === "alerts" && alertCount > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md ${active ? "bg-white/20" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"}`}
                      aria-label={`${alertCount} unresolved alerts`}
                    >
                      {alertCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Settings className="size-4" aria-hidden="true" />
          <span>Settings</span>
        </button>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        <div className="mt-3 px-3 py-2.5 rounded-lg bg-muted/50 flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
            OP
          </div>
          <div className="min-w-0">
            <div className="text-sm truncate">Op. Station</div>
            <div className="text-xs text-muted-foreground truncate">admin@city.io</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
