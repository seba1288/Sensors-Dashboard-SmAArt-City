import { Car, Wind, CloudSun, Sprout, TrafficCone, Droplets } from "lucide-react";
import type { SensorType } from "./data";

const map: Record<SensorType, { icon: React.ComponentType<{ className?: string }>; bg: string; fg: string; label: string }> = {
  parking: { icon: Car, bg: "bg-indigo-100 dark:bg-indigo-500/15", fg: "text-indigo-600 dark:text-indigo-300", label: "Parking" },
  air: { icon: Wind, bg: "bg-emerald-100 dark:bg-emerald-500/15", fg: "text-emerald-600 dark:text-emerald-300", label: "Air Quality" },
  weather: { icon: CloudSun, bg: "bg-sky-100 dark:bg-sky-500/15", fg: "text-sky-600 dark:text-sky-300", label: "Weather" },
  soil: { icon: Sprout, bg: "bg-amber-100 dark:bg-amber-500/15", fg: "text-amber-600 dark:text-amber-300", label: "Soil" },
  traffic: { icon: TrafficCone, bg: "bg-rose-100 dark:bg-rose-500/15", fg: "text-rose-600 dark:text-rose-300", label: "Traffic" },
  water: { icon: Droplets, bg: "bg-violet-100 dark:bg-violet-500/15", fg: "text-violet-600 dark:text-violet-300", label: "Water" },
};

export function SensorIcon({ type, size = "md" }: { type: SensorType; size?: "sm" | "md" }) {
  const cfg = map[type];
  const Icon = cfg.icon;
  const dim = size === "sm" ? "size-7" : "size-9";
  const ic = size === "sm" ? "size-3.5" : "size-4";
  return (
    <div className={`${dim} rounded-lg ${cfg.bg} ${cfg.fg} flex items-center justify-center shrink-0`}>
      <Icon className={ic} />
    </div>
  );
}

export function sensorTypeLabel(t: SensorType) {
  return map[t].label;
}
