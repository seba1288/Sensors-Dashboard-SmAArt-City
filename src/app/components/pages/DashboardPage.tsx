import { useState } from "react";
import { Cpu, Wifi, WifiOff, BatteryWarning, AlertTriangle, ArrowUpRight, Sparkles, ShieldAlert, Network, Lock, ShieldCheck } from "lucide-react";
import { Card } from "../ui/card";
import { CityMap } from "../CityMap";
import { SensorDetailSheet } from "../SensorDetailSheet";
import { alerts, sensors, trendData, aggregatedInsights, dataQualityIssues } from "../data";
import type { Sensor } from "../data";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

function StatCard({ label, value, sub, icon: Icon, accent, trend, onClick }: { label: string; value: string; sub: string; icon: React.ComponentType<{ className?: string }>; accent: string; trend?: string; onClick?: () => void }) {
  const interactive = !!onClick;
  return (
    <Card
      className={`p-5 gap-3 ${interactive ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" : ""}`}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
      aria-label={interactive ? `${label}: ${value}. Click to view.` : undefined}
    >
      <div className="flex items-start justify-between">
        <div className={`size-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="size-5" />
        </div>
        {trend && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight className="size-3" />
            {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 tabular-nums tracking-tight" style={{ fontSize: "1.6rem", lineHeight: 1.1 }}>{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </div>
    </Card>
  );
}

const METRICS = {
  temp: { label: "Temperature", unit: "°C", color: "#0ea5e9", domain: [0, 30] as [number, number] },
  aqi: { label: "Air Quality", unit: "AQI", color: "#10b981", domain: [0, 200] as [number, number] },
  humidity: { label: "Humidity", unit: "%", color: "#8b5cf6", domain: [0, 100] as [number, number] },
} as const;
type MetricKey = keyof typeof METRICS;

type NavFn = (p: "dashboard" | "sensors" | "locations" | "alerts", opts?: { sensorStatus?: string; sensorDistrict?: string }) => void;

export function DashboardPage({ onNavigate }: { onNavigate?: NavFn }) {
  const [metric, setMetric] = useState<MetricKey>("temp");
  const [viewing, setViewing] = useState<Sensor | null>(null);
  const totalSensors = 120;
  const unstableCount = 9;
  const offlineCount = 7;
  const onlineCount = totalSensors - offlineCount;
  const onlinePct = ((onlineCount / totalSensors) * 100).toFixed(1);
  const lowBattery = sensors.filter((s) => s.battery > 0 && s.battery < 15).length;
  const unresolved = alerts.filter((a) => !a.resolved).length;
  const m = METRICS[metric];
  const insights = aggregatedInsights(sensors);
  const dq = dataQualityIssues(sensors);

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sensors" value={String(totalSensors)} sub="across 6 districts" icon={Cpu} accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300" onClick={() => onNavigate?.("sensors", { sensorStatus: "all" })} />
        <StatCard label="Active Sensors" value={String(onlineCount)} sub={`${onlinePct}% of network`} icon={Wifi} accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" trend={`${unstableCount} unstable`} onClick={() => onNavigate?.("sensors", { sensorStatus: "online" })} />
        <StatCard label="Offline Sensors" value={String(offlineCount)} sub="confirmed — needs inspection" icon={WifiOff} accent="bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300" onClick={() => onNavigate?.("sensors", { sensorStatus: "offline" })} />
        <StatCard label="Active Alerts" value={String(unresolved)} sub={`${lowBattery} battery critical`} icon={AlertTriangle} accent="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" onClick={() => onNavigate?.("alerts")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" aria-hidden="true" />
              <div className="text-foreground">Network Insights</div>
            </div>
            <span className="text-xs text-muted-foreground">aggregated</span>
          </div>
          {insights.length === 0 ? (
            <div className="text-sm text-muted-foreground">All systems nominal — no aggregated issues detected.</div>
          ) : (
            <ul className="space-y-2">
              {insights.map((ins, i) => {
                const tone = ins.tone === "crit" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" : ins.tone === "warn" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
                return (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className={`min-w-7 px-2 py-0.5 rounded-md text-xs tabular-nums text-center ${tone}`}>{ins.count}</span>
                    <span className="text-sm text-foreground">{ins.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-sky-500" aria-hidden="true" />
              <div className="text-foreground">Data Quality Issues</div>
            </div>
            <span className="text-xs text-muted-foreground">{dq.length} issue{dq.length === 1 ? "" : "s"}</span>
          </div>
          {dq.length === 0 ? (
            <div className="text-sm text-muted-foreground">All payloads passing validation — no missing metadata, no inconsistent readings.</div>
          ) : (
            <ul className="space-y-2 max-h-44 overflow-y-auto">
              {dq.slice(0, 6).map((d, i) => (
                <li key={i} className="text-sm flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="text-left hover:text-foreground"
                    onClick={() => {
                      const s = sensors.find((x) => x.id === d.sensorId);
                      if (s) setViewing(s);
                    }}
                  >
                    <div className="text-foreground">{d.sensorName}</div>
                    <div className="text-xs text-muted-foreground">{d.problem}</div>
                  </button>
                  <span className="text-xs text-muted-foreground shrink-0 px-2 py-0.5 rounded-md bg-muted">{d.field}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-5 gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-foreground">Environmental Trends</div>
              <div className="text-xs text-muted-foreground">Last 24 hours • {m.label} ({m.unit})</div>
            </div>
            <div className="inline-flex items-center bg-muted rounded-lg p-0.5 text-xs">
              {(Object.keys(METRICS) as MetricKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setMetric(k)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${metric === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {METRICS[k].label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={m.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" domain={m.domain} unit={m.unit === "AQI" ? undefined : m.unit} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", fontSize: 12 }}
                  formatter={(v: number) => [`${v} ${m.unit}`, m.label]}
                />
                <Area type="monotone" dataKey={metric} stroke={m.color} strokeWidth={2} fill="url(#metricGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-5 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-foreground">City Sensor Map</div>
              <div className="text-xs text-muted-foreground">Real-time device geolocation · click marker for details</div>
            </div>
            <BatteryWarning className="size-4 text-muted-foreground" />
          </div>
          <CityMap
            onSelectSensor={setViewing}
            onSelectZone={(z) => onNavigate?.("sensors", { sensorDistrict: z.name })}
          />
        </Card>

        <Card className="p-5 gap-3">
          <div className="flex items-center justify-between">
            <div className="text-foreground">Recent Alerts</div>
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onNavigate?.("alerts")}>
              {unresolved} unresolved →
            </button>
          </div>
          <div className="space-y-2.5">
            {alerts.slice(0, 5).map((a) => {
              const sev = a.severity === "critical" ? "border-l-rose-500 bg-rose-50 dark:bg-rose-500/10" : a.severity === "warning" ? "border-l-amber-500 bg-amber-50 dark:bg-amber-500/10" : "border-l-sky-500 bg-sky-50 dark:bg-sky-500/10";
              return (
                <button
                  key={a.id}
                  onClick={() => onNavigate?.("alerts")}
                  className={`w-full text-left border-l-2 ${sev} rounded-r-lg px-3 py-2.5 hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm text-foreground flex items-center gap-1.5">
                      {a.group && <Network className="size-3.5 text-muted-foreground" aria-hidden="true" />}
                      {a.sensor}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.message}</div>
                  {a.rootCause && (
                    <div className="text-xs text-muted-foreground/80 mt-1 italic">Why: {a.rootCause}</div>
                  )}
                  {a.group && (
                    <div className="text-xs text-muted-foreground mt-1 tabular-nums">Affected: {a.group.join(", ")}</div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground border-t border-border pt-4">
        <span className="inline-flex items-center gap-1.5"><Lock className="size-3.5" aria-hidden="true" /> Data securely transmitted (LoRaWAN AES-128 encrypted)</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" aria-hidden="true" /> Access controlled (role-based)</span>
        <span aria-hidden="true">·</span>
        <span>{totalSensors} sensors across 6 districts · expandable</span>
      </div>

      <SensorDetailSheet sensor={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
