import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { CheckCircle2, AlertCircle, Minus, Battery, Radio, Activity, Code2, Sliders, Lightbulb, Navigation } from "lucide-react";
import type { Sensor } from "./data";
import { diagnoseSensor, batteryHealth, rssiQuality, estimateLifetime, sensors as allSensors } from "./data";
import { StatusBadge } from "./StatusBadge";
import { SensorIcon } from "./SensorIcon";

function StepIcon({ status }: { status: "ok" | "concern" | "skip" }) {
  if (status === "ok") return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />;
  if (status === "concern") return <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />;
  return <Minus className="size-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />;
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">
        <span className="text-foreground tabular-nums">{value}</span>
        {hint && <span className="text-xs text-muted-foreground ml-2">{hint}</span>}
      </span>
    </div>
  );
}

export function SensorDetailSheet({ sensor, onClose }: { sensor: Sensor | null; onClose: () => void }) {
  const [techView, setTechView] = useState(false);
  const open = !!sensor;

  const diag = useMemo(() => (sensor ? diagnoseSensor(sensor, allSensors) : null), [sensor]);
  if (!sensor || !diag) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Sensor</SheetTitle>
            <SheetDescription>No sensor selected.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const bh = batteryHealth(sensor);
  const rq = rssiQuality(sensor.rssi);
  const lifetime = estimateLifetime(sensor);

  const payload = {
    id: sensor.id,
    timestamp: new Date().toISOString(),
    firmware: sensor.firmware,
    rssi_dbm: sensor.rssi,
    snr_db: sensor.snr,
    battery_pct: sensor.battery,
    voltage_v: sensor.voltage,
    readings: sensor.readings ?? {},
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <SensorIcon type={sensor.type} />
            <div className="flex-1 min-w-0">
              <SheetTitle className="truncate">{sensor.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-0.5">
                <span>{sensor.id} · {sensor.location}</span>
              </SheetDescription>
            </div>
            <StatusBadge status={sensor.status} delayMin={sensor.delayMin} missed={sensor.missedTransmissions} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${sensor.lat},${sensor.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Navigation className="size-3.5" aria-hidden="true" /> Directions
            </a>
            <span className="text-xs text-muted-foreground tabular-nums">{sensor.lat.toFixed(4)}, {sensor.lng.toFixed(4)}</span>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-4">
          <Section title="Diagnosis / Analysis" icon={Activity}>
            <ol className="space-y-2.5">
              {diag.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <StepIcon status={step.status} />
                  <div className="text-sm">
                    <div className="text-foreground">{step.label}</div>
                    <div className="text-xs text-muted-foreground">{step.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4 rounded-lg bg-muted/50 border border-border p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm flex-1">
                  <div className="text-foreground">{diag.conclusion}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>Recommended: <span className="text-foreground">{diag.recommendation}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Battery Intelligence" icon={Battery}>
            <Row label="Charge" value={`${sensor.battery}%`} hint={`${sensor.voltage.toFixed(2)} V`} />
            <Row label="Discharge rate" value={`${sensor.dischargePerDay.toFixed(2)} %/day`} />
            <Row label="Estimated lifetime" value={lifetime} />
            <div className={`mt-2 text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5 ${bh.tone === "good" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : bh.tone === "fair" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"}`}>
              {bh.label}
            </div>
          </Section>

          <Section title="Signal Quality" icon={Radio}>
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-muted-foreground">Connectivity</span>
              <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${rq.tier === "excellent" || rq.tier === "strong" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : rq.tier === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"}`}>
                <span className={`size-1.5 rounded-full ${rq.tier === "excellent" || rq.tier === "strong" ? "bg-emerald-500" : rq.tier === "medium" ? "bg-amber-500" : "bg-rose-500"}`} aria-hidden="true" />
                {rq.label}
              </span>
            </div>
            <Row label="RSSI" value={`${sensor.rssi} dBm`} />
            <Row label="SNR" value={`${sensor.snr.toFixed(1)} dB`} />
            <Row label="Communication" value={sensor.communication} />
            <Row label="Firmware" value={sensor.firmware} />
          </Section>

          <Section title="Adaptive Thresholds" icon={Sliders}>
            <Row label="Expected interval" value={`${sensor.expectedIntervalMin} min`} />
            <Row label="Offline threshold" value={`${sensor.offlineThresholdMin} min`} hint="auto-tuned" />
            <Row label="Alert sensitivity" value={sensor.alertSensitivity} />
            <Row label="Current delay" value={sensor.delayMin > 0 ? `+${sensor.delayMin} min` : "On time"} />
            <Row label="Missed transmissions" value={String(sensor.missedTransmissions)} />
          </Section>

          <Section title="Live Readings" icon={Code2}>
            <div className="flex items-center justify-end mb-2">
              <button
                type="button"
                onClick={() => setTechView((v) => !v)}
                className="text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-accent transition-colors"
                aria-pressed={techView}
              >
                {techView ? "Normalized view" : "Technical view"}
              </button>
            </div>
            {techView ? (
              <pre className="text-xs bg-muted/60 rounded-md p-3 overflow-x-auto tabular-nums">
{JSON.stringify(payload, null, 2)}
              </pre>
            ) : sensor.readings && Object.keys(sensor.readings).length > 0 ? (
              <div>
                {sensor.readings.temperatureC !== undefined && <Row label="Temperature" value={`${sensor.readings.temperatureC} °C`} />}
                {sensor.readings.humidityPct !== undefined && <Row label="Humidity" value={`${sensor.readings.humidityPct} %`} />}
                {sensor.readings.pm25 !== undefined && <Row label="PM2.5" value={`${sensor.readings.pm25} µg/m³`} />}
                {sensor.readings.no2 !== undefined && <Row label="NO₂" value={`${sensor.readings.no2} µg/m³`} />}
                {sensor.readings.co2 !== undefined && <Row label="CO₂" value={`${sensor.readings.co2} ppm`} />}
                {sensor.readings.moisturePct !== undefined && <Row label="Soil moisture" value={`${sensor.readings.moisturePct} %`} />}
                {sensor.readings.parkingTotal !== undefined && (
                  <Row
                    label="Parking availability"
                    value={`${sensor.readings.parkingAvailable ?? 0} / ${sensor.readings.parkingTotal} spots`}
                  />
                )}
                {sensor.readings.vehicleCount !== undefined && <Row label="Vehicle count" value={`${sensor.readings.vehicleCount} / 15 min`} />}
                {sensor.readings.trafficFlow !== undefined && (
                  <div className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">Traffic flow</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sensor.readings.trafficFlow === "low" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : sensor.readings.trafficFlow === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"} capitalize`}>
                      {sensor.readings.trafficFlow}
                    </span>
                  </div>
                )}
                {sensor.readings.waterLevelM !== undefined && (
                  <Row
                    label="Water level"
                    value={`${sensor.readings.waterLevelM.toFixed(2)} m`}
                    hint={sensor.readings.waterLevelPct !== undefined ? `${sensor.readings.waterLevelPct}%` : undefined}
                  />
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No payload received this cycle.</div>
            )}
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
