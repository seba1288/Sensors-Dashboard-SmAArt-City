export type SensorType = "parking" | "weather" | "air" | "soil" | "traffic" | "water";
/** "warning" remains for back-compat; treat as "unstable". */
export type SensorStatus = "online" | "unstable" | "offline" | "warning";
export type AlertSensitivity = "low" | "medium" | "high";

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  model: string;
  /** Human-readable function / role of the device */
  func: string;
  /** Communication protocol(s) */
  communication: string;
  status: SensorStatus;
  /** Confidence in current status assessment (0–100). */
  confidence: number;
  battery: number;
  /** Battery cell voltage (V). */
  voltage: number;
  /** % drained per day */
  dischargePerDay: number;
  /** Expected reporting cadence in minutes. */
  expectedIntervalMin: number;
  /** Current delay vs. expected interval, in minutes (0 = on-time). */
  delayMin: number;
  /** Number of consecutive missed transmissions. */
  missedTransmissions: number;
  /** Received signal strength indicator (dBm, typically −30 to −120). */
  rssi: number;
  /** Signal-to-noise ratio (dB, typically −20 to 10). */
  snr: number;
  /** Hardware firmware version. */
  firmware: string;
  /** Adaptive alert sensitivity. */
  alertSensitivity: AlertSensitivity;
  /** Auto-tuned offline threshold in minutes (derived from history). */
  offlineThresholdMin: number;
  /** Sample readings, used by the Detail view. */
  readings?: {
    temperatureC?: number;
    humidityPct?: number;
    pm25?: number;
    co2?: number;
    no2?: number;
    moisturePct?: number;
    /** Parking sensors */
    parkingAvailable?: number;
    parkingTotal?: number;
    /** Traffic sensors */
    vehicleCount?: number;
    trafficFlow?: "low" | "medium" | "high";
    /** Water sensors */
    waterLevelM?: number;
    waterLevelPct?: number;
  };
  lastSeen: string;
  location: string;
  district: string;
  lat: number;
  lng: number;
}

export function daysUntilLowBattery(s: Sensor, threshold = 10): number | null {
  if (s.status === "offline") return null;
  if (s.battery <= threshold) return 0;
  if (s.dischargePerDay <= 0) return Infinity;
  return (s.battery - threshold) / s.dischargePerDay;
}

export function formatForecast(days: number | null): string {
  if (days === null) return "—";
  if (!isFinite(days)) return "Stable";
  if (days <= 0) return "Now";
  if (days < 1) return `< 1 day`;
  if (days < 14) return `~${Math.round(days)} days`;
  if (days < 60) return `~${Math.round(days / 7)} weeks`;
  return `~${Math.round(days / 30)} months`;
}

export type IssueCategory = "battery" | "connectivity" | "gateway" | "hardware" | "software";
export type Urgency = "critical" | "medium" | "low";
export type WorkflowStatus = "open" | "in_progress" | "resolved";

export interface Alert {
  id: string;
  sensor: string;
  message: string;
  severity: "critical" | "warning" | "info";
  /** Operational urgency tier. */
  urgency: Urgency;
  /** Classified root-cause category. */
  category: IssueCategory;
  /** Confidence (%) in the category classification. */
  categoryConfidence: number;
  /** Workflow state — superseded by `resolved` when status === "resolved". */
  workflow: WorkflowStatus;
  /** Currently assigned technician (free text). */
  assignee?: string;
  /** Set when the assigned technician accepts the mission. */
  missionAccepted?: boolean;
  /** ISO timestamp of when the mission was accepted. */
  missionAcceptedAt?: string;
  /** Recommended remediation. */
  recommendedAction?: string;
  resolved: boolean;
  time: string;
  rootCause?: string;
  /** Optional list of sensor IDs grouped under this alert. */
  group?: string[];
  district?: string;
}

export const ISSUE_CATEGORY_META: Record<IssueCategory, { label: string; icon: string; tone: string }> = {
  battery:      { label: "Battery",      icon: "🔋", tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  connectivity: { label: "Connectivity", icon: "📡", tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  gateway:      { label: "Gateway",      icon: "🌐", tone: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  hardware:     { label: "Hardware",     icon: "⚙️", tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  software:     { label: "Software",     icon: "🧠", tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" },
};

export const URGENCY_META: Record<Urgency, { label: string; tone: string; dot: string }> = {
  critical: { label: "Critical", tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", dot: "bg-rose-500" },
  medium:   { label: "Medium",   tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", dot: "bg-amber-500" },
  low:      { label: "Low",      tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", dot: "bg-emerald-500" },
};

export const WORKFLOW_META: Record<WorkflowStatus, { label: string; tone: string }> = {
  open:        { label: "Open",        tone: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300" },
  in_progress: { label: "In progress", tone: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  resolved:    { label: "Resolved",    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
};

/**
 * Estimate remaining battery lifetime from cell voltage / discharge rate.
 * Returns a human-readable string in months / years (these are LPWAN sensors —
 * they typically last years on a single charge, so days is the wrong unit).
 */
export function estimateLifetime(s: Sensor): string {
  if (s.status === "offline" || s.battery <= 0) return "—";
  if (s.dischargePerDay <= 0) return "Stable (>3 years)";
  const daysLeft = (s.battery - 5) / s.dischargePerDay;
  if (daysLeft <= 30) return `~${Math.max(1, Math.round(daysLeft))} days`;
  if (daysLeft <= 365) return `~${Math.round(daysLeft / 30)} months`;
  const years = daysLeft / 365;
  if (years < 5) return `~${years.toFixed(1)} years`;
  return ">5 years";
}

/** Voltage → percentage estimate for 3.0–3.6 V cells. */
export function voltageToPercent(v: number): number {
  if (v <= 0) return 0;
  const pct = Math.round(((v - 3.0) / (3.6 - 3.0)) * 100);
  return Math.max(0, Math.min(100, pct));
}

export interface Location {
  id: string;
  name: string;
  district: string;
  sensors: number;
  online: number;
  capacity?: number;
}

// Map bounding box covering Aalen, Baden-Württemberg, Germany
export const AALEN_BBOX = {
  minLng: 10.04,
  maxLng: 10.16,
  minLat: 48.815,
  maxLat: 48.875,
};

export const AALEN_CENTER = { lat: 48.8378, lng: 10.0933 };

export const sensors: Sensor[] = [
  { id: "SN-001", name: "Marktplatz Parking", type: "parking", model: "Mini Exterior Parking Sensor", func: "Parking detection", communication: "LoRaWAN",
    status: "online", confidence: 97, battery: 87, voltage: 3.58, dischargePerDay: 0.04,
    expectedIntervalMin: 10, delayMin: 0, missedTransmissions: 0, rssi: -78, snr: 6.4, firmware: "v2.3.1",
    alertSensitivity: "medium", offlineThresholdMin: 25,
    readings: { parkingAvailable: 12, parkingTotal: 50 },
    lastSeen: "2 min ago", location: "Innenstadt", district: "Aalen-Mitte", lat: 48.8378, lng: 10.0933 },
  { id: "SN-002", name: "Bahnhof Air Monitor", type: "air", model: "DL-LP8P Air Quality Sensor", func: "Air monitoring", communication: "LoRaWAN",
    status: "online", confidence: 94, battery: 64, voltage: 3.42, dischargePerDay: 0.9,
    expectedIntervalMin: 5, delayMin: 1, missedTransmissions: 0, rssi: -84, snr: 4.1, firmware: "v3.0.2",
    alertSensitivity: "high", offlineThresholdMin: 15,
    readings: { temperatureC: 12.6, humidityPct: 71, pm25: 18, co2: 612, no2: 22 },
    lastSeen: "1 min ago", location: "Bahnhof", district: "Aalen-Mitte", lat: 48.8389, lng: 10.0875 },
  { id: "SN-003", name: "Limesmuseum Weather", type: "weather", model: "WTS506 Weather Station", func: "Multi-environment monitoring", communication: "LoRaWAN",
    status: "unstable", confidence: 68, battery: 21, voltage: 3.12, dischargePerDay: 1.6,
    expectedIntervalMin: 5, delayMin: 8, missedTransmissions: 1, rssi: -101, snr: -2.3, firmware: "v1.9.0",
    alertSensitivity: "medium", offlineThresholdMin: 20,
    readings: { temperatureC: 11.8, humidityPct: 78 },
    lastSeen: "8 min ago", location: "Limesmuseum", district: "West", lat: 48.8467, lng: 10.0825 },
  { id: "SN-004", name: "Hochschule Soil Probe", type: "soil", model: "SE01-LB Soil Moisture Sensor", func: "Soil monitoring", communication: "LoRaWAN",
    status: "online", confidence: 99, battery: 92, voltage: 3.62, dischargePerDay: 0.05,
    expectedIntervalMin: 30, delayMin: 0, missedTransmissions: 0, rssi: -72, snr: 8.1, firmware: "v2.1.0",
    alertSensitivity: "low", offlineThresholdMin: 90,
    readings: { temperatureC: 9.4, moisturePct: 42 },
    lastSeen: "3 min ago", location: "Hochschule Aalen", district: "West", lat: 48.8420, lng: 10.0635 },
  { id: "SN-005", name: "Wasseralfingen Level", type: "water", model: "WILSEN.sonic Ultrasonic Sensor", func: "Distance / level monitoring", communication: "LoRaWAN + Bluetooth",
    status: "offline", confidence: 91, battery: 0, voltage: 0, dischargePerDay: 0,
    expectedIntervalMin: 15, delayMin: 124, missedTransmissions: 8, rssi: -118, snr: -18, firmware: "v2.0.4",
    alertSensitivity: "high", offlineThresholdMin: 45,
    lastSeen: "2 hr ago", location: "Wasseralfingen", district: "Nord", lat: 48.8600, lng: 10.1100 },
  { id: "SN-006", name: "Kocher Level Monitor", type: "water", model: "WILSEN.sonic Ultrasonic Sensor", func: "Distance / level monitoring", communication: "LoRaWAN + Bluetooth",
    status: "online", confidence: 96, battery: 78, voltage: 3.55, dischargePerDay: 0.06,
    expectedIntervalMin: 15, delayMin: 0, missedTransmissions: 0, rssi: -86, snr: 5.2, firmware: "v2.0.4",
    alertSensitivity: "medium", offlineThresholdMin: 45,
    readings: { waterLevelM: 1.2, waterLevelPct: 38 },
    lastSeen: "5 min ago", location: "Kocher", district: "Süd-Ost", lat: 48.8285, lng: 10.1340 },
  { id: "SN-007", name: "Stadtgarten Parking", type: "parking", model: "Mini Exterior Parking Sensor", func: "Parking detection", communication: "LoRaWAN",
    status: "online", confidence: 92, battery: 55, voltage: 3.38, dischargePerDay: 0.04,
    expectedIntervalMin: 10, delayMin: 2, missedTransmissions: 0, rssi: -88, snr: 3.2, firmware: "v2.3.1",
    alertSensitivity: "medium", offlineThresholdMin: 25,
    readings: { parkingAvailable: 7, parkingTotal: 32 },
    lastSeen: "4 min ago", location: "Stadtgarten", district: "Aalen-Mitte", lat: 48.8395, lng: 10.0985 },
  { id: "SN-008", name: "Reichsstädter Air", type: "air", model: "DL-LP8P Air Quality Sensor", func: "Air monitoring", communication: "LoRaWAN",
    status: "unstable", confidence: 74, battery: 33, voltage: 3.18, dischargePerDay: 1.2,
    expectedIntervalMin: 5, delayMin: 12, missedTransmissions: 2, rssi: -98, snr: 1.1, firmware: "v3.0.2",
    alertSensitivity: "high", offlineThresholdMin: 15,
    readings: { temperatureC: 13.1, humidityPct: 64, pm25: 84, co2: 720, no2: 41 },
    lastSeen: "12 min ago", location: "Reichsstädter Markt", district: "Aalen-Mitte", lat: 48.8362, lng: 10.0958 },
  { id: "SN-009", name: "Tiefer Stollen Rain", type: "weather", model: "MeteoRain IoT Compact", func: "Rain measurement", communication: "LoRaWAN",
    status: "online", confidence: 98, battery: 96, voltage: 3.65, dischargePerDay: 0.3,
    expectedIntervalMin: 10, delayMin: 0, missedTransmissions: 0, rssi: -75, snr: 7.0, firmware: "v1.4.1",
    alertSensitivity: "low", offlineThresholdMin: 30,
    readings: { temperatureC: 8.2, humidityPct: 82 },
    lastSeen: "1 min ago", location: "Wasseralfingen", district: "Nord", lat: 48.8617, lng: 10.0908 },
  { id: "SN-010", name: "Hofherrnweiler Soil", type: "soil", model: "SE01-LB Soil Moisture Sensor", func: "Soil monitoring", communication: "LoRaWAN",
    status: "online", confidence: 95, battery: 71, voltage: 3.49, dischargePerDay: 0.05,
    expectedIntervalMin: 30, delayMin: 4, missedTransmissions: 0, rssi: -82, snr: 5.8, firmware: "v2.1.0",
    alertSensitivity: "medium", offlineThresholdMin: 90,
    readings: { temperatureC: 10.0, moisturePct: 38 },
    lastSeen: "6 min ago", location: "Hofherrnweiler", district: "West", lat: 48.8450, lng: 10.0700 },
  { id: "SN-011", name: "B19 Traffic Counter", type: "traffic", model: "TrafficCount LB", func: "Vehicle counting", communication: "LoRaWAN",
    status: "online", confidence: 96, battery: 68, voltage: 3.46, dischargePerDay: 0.5,
    expectedIntervalMin: 15, delayMin: 0, missedTransmissions: 0, rssi: -80, snr: 5.5, firmware: "v1.2.0",
    alertSensitivity: "medium", offlineThresholdMin: 45,
    readings: { vehicleCount: 412, trafficFlow: "high" },
    lastSeen: "3 min ago", location: "B19 Anschluss", district: "Süd-Ost", lat: 48.8290, lng: 10.1075 },
  { id: "SN-012", name: "Rathaus Traffic", type: "traffic", model: "TrafficCount LB", func: "Vehicle counting", communication: "LoRaWAN",
    status: "online", confidence: 95, battery: 81, voltage: 3.55, dischargePerDay: 0.5,
    expectedIntervalMin: 15, delayMin: 0, missedTransmissions: 0, rssi: -76, snr: 6.8, firmware: "v1.2.0",
    alertSensitivity: "medium", offlineThresholdMin: 45,
    readings: { vehicleCount: 138, trafficFlow: "medium" },
    lastSeen: "2 min ago", location: "Rathaus", district: "Aalen-Mitte", lat: 48.8370, lng: 10.0950 },
];

function sensorLabelFor(t: SensorType): string {
  switch (t) {
    case "parking": return "Parking";
    case "air": return "Air";
    case "weather": return "Weather";
    case "soil": return "Soil";
    case "traffic": return "Traffic";
    case "water": return "Water";
  }
}

// Synthesize additional sensors so the map reflects the full ~120-device deployment.
(function expandSensors() {
  if (sensors.length >= 120) return;
  type Proto = Omit<Sensor, "id" | "lat" | "lng" | "name" | "location" | "district" | "status" | "battery" | "voltage" | "confidence" | "delayMin" | "missedTransmissions" | "rssi" | "snr" | "lastSeen">;
  const base: Proto[] = [
    { type: "parking", model: "Mini Exterior Parking Sensor", func: "Parking detection", communication: "LoRaWAN",
      dischargePerDay: 0.04, expectedIntervalMin: 10, firmware: "v2.3.1",
      alertSensitivity: "medium", offlineThresholdMin: 25, readings: { parkingAvailable: 8, parkingTotal: 30 } },
    { type: "air", model: "DL-LP8P Air Quality Sensor", func: "Air monitoring", communication: "LoRaWAN",
      dischargePerDay: 0.8, expectedIntervalMin: 5, firmware: "v3.0.2",
      alertSensitivity: "high", offlineThresholdMin: 15, readings: { temperatureC: 12.1, humidityPct: 68, pm25: 22, co2: 580, no2: 19 } },
    { type: "weather", model: "WTS506 Weather Station", func: "Multi-environment monitoring", communication: "LoRaWAN",
      dischargePerDay: 0.5, expectedIntervalMin: 10, firmware: "v1.9.0",
      alertSensitivity: "medium", offlineThresholdMin: 20, readings: { temperatureC: 11.2, humidityPct: 74 } },
    { type: "soil", model: "SE01-LB Soil Moisture Sensor", func: "Soil monitoring", communication: "LoRaWAN",
      dischargePerDay: 0.05, expectedIntervalMin: 30, firmware: "v2.1.0",
      alertSensitivity: "low", offlineThresholdMin: 90, readings: { temperatureC: 9.8, moisturePct: 40 } },
    { type: "traffic", model: "TrafficCount LB", func: "Vehicle counting", communication: "LoRaWAN",
      dischargePerDay: 0.5, expectedIntervalMin: 15, firmware: "v1.2.0",
      alertSensitivity: "medium", offlineThresholdMin: 45, readings: { vehicleCount: 220, trafficFlow: "medium" } },
    { type: "water", model: "WILSEN.sonic Ultrasonic Sensor", func: "Distance / level monitoring", communication: "LoRaWAN + Bluetooth",
      dischargePerDay: 0.06, expectedIntervalMin: 15, firmware: "v2.0.4",
      alertSensitivity: "medium", offlineThresholdMin: 45, readings: { waterLevelM: 1.0, waterLevelPct: 32 } },
  ];
  const districts: Array<{ name: string; location: string; lat: number; lng: number }> = [
    { name: "Aalen-Mitte", location: "Innenstadt",         lat: 48.8378, lng: 10.0933 },
    { name: "Aalen-Mitte", location: "Reichsstädter Markt",lat: 48.8362, lng: 10.0958 },
    { name: "Aalen-Mitte", location: "Stadtgarten",        lat: 48.8395, lng: 10.0985 },
    { name: "Aalen-Mitte", location: "Rathaus",            lat: 48.8370, lng: 10.0950 },
    { name: "Nord",        location: "Wasseralfingen",     lat: 48.8617, lng: 10.0908 },
    { name: "Nord",        location: "Hofen",              lat: 48.8700, lng: 10.0750 },
    { name: "West",        location: "Hochschule Aalen",   lat: 48.8420, lng: 10.0635 },
    { name: "West",        location: "Hofherrnweiler",     lat: 48.8450, lng: 10.0700 },
    { name: "West",        location: "Limesmuseum",        lat: 48.8467, lng: 10.0825 },
    { name: "Süd-Ost",     location: "Unterkochen",        lat: 48.8200, lng: 10.1200 },
    { name: "Süd-Ost",     location: "B19 Anschluss",      lat: 48.8290, lng: 10.1075 },
    { name: "Süd-Ost",     location: "Kocher",             lat: 48.8285, lng: 10.1340 },
    { name: "Ost",         location: "Ebnat",              lat: 48.8500, lng: 10.1400 },
    { name: "Ost",         location: "Waldhausen",         lat: 48.8350, lng: 10.1500 },
  ];
  const target = 120;
  let next = sensors.length + 1;
  let seed = 7;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  while (sensors.length < target) {
    const proto = base[Math.floor(rand() * base.length)];
    const dist = districts[Math.floor(rand() * districts.length)];
    const idx = sensors.length;
    let status: SensorStatus = "online";
    if (idx % 18 === 0) status = "offline";
    else if (idx % 13 === 0) status = "unstable";
    else if (rand() > 0.97) status = "unstable";
    const battery = status === "offline" ? 0 : Math.max(8, Math.round(35 + rand() * 60));
    const voltage = status === "offline" ? 0 : +(3.0 + (battery / 100) * 0.6).toFixed(2);
    const lat = dist.lat + (rand() - 0.5) * 0.012;
    const lng = dist.lng + (rand() - 0.5) * 0.018;
    const id = `SN-${String(next++).padStart(3, "0")}`;
    sensors.push({
      ...proto,
      id,
      name: `${dist.location} ${sensorLabelFor(proto.type)} ${idx}`,
      status,
      battery,
      voltage,
      confidence: status === "offline" ? 88 : status === "unstable" ? 70 : 94,
      delayMin: status === "unstable" ? Math.round(rand() * 12) : status === "offline" ? 90 : 0,
      missedTransmissions: status === "unstable" ? 1 : status === "offline" ? 6 : 0,
      rssi: status === "offline" ? -115 : Math.round(-75 - rand() * 30),
      snr: status === "offline" ? -16 : +(rand() * 8 - 1).toFixed(1),
      lastSeen: status === "offline" ? "1 hr ago" : `${Math.max(1, Math.round(rand() * 9))} min ago`,
      location: dist.location,
      district: dist.name,
      lat,
      lng,
    });
  }
})();

// Seed realistic data-quality issues so the dashboard shows representative examples.
(function seedQualityIssues() {
  // 1) Inconsistent parking reading: available > total
  const parking = sensors.find((s) => s.id === "SN-007");
  if (parking?.readings) {
    parking.readings = { ...parking.readings, parkingAvailable: 41, parkingTotal: 32 };
  }
  // 2) Missing battery info while reporting online
  const noBattery = sensors.find((s) => s.id === "SN-002");
  if (noBattery) {
    noBattery.battery = 0;
  }
  // 3) Missing firmware metadata on a synthetic device
  const orphaned = sensors.find((s) => s.id === "SN-013");
  if (orphaned) {
    orphaned.firmware = "";
  }
})();

export type QualityTier = "excellent" | "strong" | "medium" | "poor";
export const QUALITY_META: Record<QualityTier, { label: string; tone: string; dot: string }> = {
  excellent: { label: "Excellent", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", dot: "bg-emerald-500" },
  strong:    { label: "Strong",    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", dot: "bg-emerald-500" },
  medium:    { label: "Medium",    tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",       dot: "bg-amber-500" },
  poor:      { label: "Poor",      tone: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",           dot: "bg-rose-500" },
};

export function rssiQuality(rssi: number): { label: string; tone: "good" | "fair" | "poor"; tier: QualityTier } {
  if (rssi >= -75) return { label: "Excellent", tone: "good", tier: "excellent" };
  if (rssi >= -90) return { label: "Strong", tone: "good", tier: "strong" };
  if (rssi >= -105) return { label: "Medium", tone: "fair", tier: "medium" };
  return { label: "Poor", tone: "poor", tier: "poor" };
}

export function healthTier(s: Sensor): QualityTier {
  if (s.status === "offline") return "poor";
  if (s.battery < 15 || s.status === "unstable" || s.status === "warning") return "medium";
  if (s.battery >= 60 && s.delayMin === 0 && rssiQuality(s.rssi).tier === "excellent") return "excellent";
  return "strong";
}

export function batteryHealth(s: Sensor): { label: string; tone: "good" | "fair" | "poor" } {
  if (s.status === "offline") return { label: "Unknown", tone: "poor" };
  if (s.battery < 15) return { label: "Critical — replace now", tone: "poor" };
  if (s.battery < 30) return { label: "Warning — schedule replacement", tone: "fair" };
  if (s.dischargePerDay > 1.5) return { label: "Drain higher than expected", tone: "fair" };
  return { label: "Stable — no action required", tone: "good" };
}

/**
 * Heuristic root-cause diagnosis.
 * Walks through the same checks an operator would and emits an explainable trail.
 */
export interface DiagnosisStep { label: string; status: "ok" | "concern" | "skip"; detail: string }
export interface Diagnosis {
  steps: DiagnosisStep[];
  conclusion: string;
  confidence: number;
  recommendation: string;
}

export function diagnoseSensor(s: Sensor, all: Sensor[]): Diagnosis {
  const steps: DiagnosisStep[] = [];
  const neighbors = all.filter((n) => n.id !== s.id && n.district === s.district);
  const neighborOnline = neighbors.filter((n) => n.status === "online").length;
  const neighborTotal = neighbors.length;

  // Battery
  if (s.battery > 25 && s.dischargePerDay <= 1.5) {
    steps.push({ label: "Battery", status: "ok", detail: `${s.battery}% @ ${s.voltage.toFixed(2)} V — stable, excluded as cause` });
  } else if (s.battery > 0) {
    steps.push({ label: "Battery", status: "concern", detail: `${s.battery}% — depletion may contribute` });
  } else {
    steps.push({ label: "Battery", status: "concern", detail: "No battery data — depletion possible" });
  }

  // Signal
  const rq = rssiQuality(s.rssi);
  if (rq.tone === "good") {
    steps.push({ label: "Signal quality", status: "ok", detail: `RSSI ${s.rssi} dBm / SNR ${s.snr} dB — connectivity unlikely culprit` });
  } else if (rq.tone === "fair") {
    steps.push({ label: "Signal quality", status: "concern", detail: `RSSI ${s.rssi} dBm — marginal coverage` });
  } else {
    steps.push({ label: "Signal quality", status: "concern", detail: `RSSI ${s.rssi} dBm — likely link degradation` });
  }

  // Neighbors
  if (neighborTotal === 0) {
    steps.push({ label: "Neighbor sensors", status: "skip", detail: "No neighbors in district to compare" });
  } else if (neighborOnline / neighborTotal >= 0.7) {
    steps.push({ label: "Neighbor sensors", status: "ok", detail: `${neighborOnline}/${neighborTotal} online — network issue excluded` });
  } else {
    steps.push({ label: "Neighbor sensors", status: "concern", detail: `${neighborOnline}/${neighborTotal} online — gateway / network outage suspected` });
  }

  // History
  if (s.missedTransmissions === 0) {
    steps.push({ label: "Historical behaviour", status: "ok", detail: "No recent missed transmissions" });
  } else {
    steps.push({ label: "Historical behaviour", status: "concern", detail: `Missed ${s.missedTransmissions} of last expected packets` });
  }

  // Conclusion
  let conclusion: string;
  let recommendation: string;
  let confidence: number;
  if (rq.tone === "poor") {
    conclusion = "Likely connectivity issue — link quality below operating threshold";
    recommendation = "Verify gateway coverage; consider relocating or adding repeater";
    confidence = 82;
  } else if (s.battery > 0 && s.battery < 15) {
    conclusion = "Likely battery exhaustion";
    recommendation = "Schedule battery replacement within 48 hours";
    confidence = 88;
  } else if (s.status === "offline" && rq.tone !== "poor" && (neighborTotal === 0 || neighborOnline / Math.max(neighborTotal, 1) >= 0.7)) {
    conclusion = "Likely hardware or software failure";
    recommendation = "Dispatch technician for on-site inspection and reboot";
    confidence = 91;
  } else if (s.status === "unstable") {
    conclusion = "Intermittent reporting — sensor not yet critical";
    recommendation = "Monitor for next interval; auto-resolves if reporting resumes";
    confidence = 76;
  } else {
    conclusion = "Sensor operating within normal parameters";
    recommendation = "No action required";
    confidence = 96;
  }
  return { steps, conclusion, recommendation, confidence };
}

export const alerts: Alert[] = [
  { id: "AL-101", sensor: "Limesmuseum Weather", message: "Battery below 15% — schedule replacement",
    severity: "warning", urgency: "medium", category: "battery", categoryConfidence: 88,
    workflow: "in_progress", assignee: "T. Becker", recommendedAction: "Swap battery pack on next field visit",
    resolved: false, time: "12 min ago",
    rootCause: "Discharge rate 1.6%/day vs. expected 0.8%/day — likely cold-weather effect", district: "West" },
  { id: "AL-102", sensor: "Wasseralfingen Level", message: "Sensor unresponsive despite strong signal — hardware issue",
    severity: "critical", urgency: "critical", category: "hardware", categoryConfidence: 91,
    workflow: "open", assignee: "M. Schultz", recommendedAction: "Dispatch technician for on-site inspection and reboot",
    resolved: false, time: "2 hr ago",
    rootCause: "Signal strong (RSSI −85), neighbours online, no transmissions for 2+ hours", district: "Nord" },
  { id: "AL-103", sensor: "Reichsstädter Air", message: "PM2.5 exceeded threshold (84 µg/m³)",
    severity: "critical", urgency: "critical", category: "software", categoryConfidence: 72,
    workflow: "open", assignee: "Air Quality Ops", recommendedAction: "Verify reading vs. neighbouring station; review traffic event",
    resolved: false, time: "32 min ago",
    rootCause: "Sustained high reading consistent with traffic-related particulate event", district: "Aalen-Mitte" },
  { id: "AL-104", sensor: "Hochschule Soil Probe", message: "Firmware out of date — v2.1.0 → v2.2.0 available",
    severity: "info", urgency: "low", category: "software", categoryConfidence: 99,
    workflow: "resolved", assignee: "OTA service", recommendedAction: "Schedule OTA upgrade window",
    resolved: true, time: "3 hr ago",
    rootCause: "Stability and power-management fixes in v2.2.0", district: "West" },
  { id: "AL-105", sensor: "Marktplatz Parking", message: "Firmware update available",
    severity: "info", urgency: "low", category: "software", categoryConfidence: 99,
    workflow: "open", assignee: "OTA service", recommendedAction: "Queue device for next scheduled OTA window",
    resolved: false, time: "1 hr ago",
    rootCause: "v2.4.0 published — stability fixes", district: "Aalen-Mitte" },
  { id: "AL-106", sensor: "Hofherrnweiler Soil", message: "Reporting resumed — auto-resolved",
    severity: "info", urgency: "low", category: "connectivity", categoryConfidence: 84,
    workflow: "resolved", recommendedAction: "No action required",
    resolved: true, time: "5 hr ago",
    rootCause: "Brief link loss; sensor back to normal cadence", district: "West" },
  { id: "AL-107", sensor: "Aalen-Mitte gateway", message: "Multiple sensors offline in Aalen-Mitte → gateway issue",
    severity: "critical", urgency: "critical", category: "gateway", categoryConfidence: 93,
    workflow: "in_progress", assignee: "Network Ops", recommendedAction: "Reboot gateway GW-AM-02 and verify backhaul",
    resolved: false, time: "18 min ago",
    rootCause: "Shared gateway latency spike; 3 sensors lost link simultaneously",
    group: ["SN-002", "SN-007", "SN-008"], district: "Aalen-Mitte" },
  { id: "AL-108", sensor: "Reichsstädter Air", message: "Missed last 2 transmissions — Unstable (not critical yet)",
    severity: "warning", urgency: "medium", category: "connectivity", categoryConfidence: 76,
    workflow: "open", recommendedAction: "Monitor for next interval — auto-resolves if reporting resumes",
    resolved: false, time: "22 min ago",
    rootCause: "RSSI fluctuating around −98 dBm — marginal coverage", district: "Aalen-Mitte" },
];

export interface DataQualityIssue {
  sensorId: string;
  sensorName: string;
  field: string;
  problem: string;
}

export function dataQualityIssues(list: Sensor[]): DataQualityIssue[] {
  const out: DataQualityIssue[] = [];
  list.forEach((s) => {
    if (s.battery === 0 && s.status !== "offline") {
      out.push({ sensorId: s.id, sensorName: s.name, field: "battery", problem: "Missing battery info while reporting" });
    }
    if (s.voltage === 0 && s.status !== "offline") {
      out.push({ sensorId: s.id, sensorName: s.name, field: "voltage", problem: "Voltage missing while online" });
    }
    if (!s.readings || Object.keys(s.readings).length === 0) {
      if (s.status !== "offline") {
        out.push({ sensorId: s.id, sensorName: s.name, field: "readings", problem: "No payload received — missing metadata" });
      }
    }
    if (!s.firmware || s.firmware === "") {
      out.push({ sensorId: s.id, sensorName: s.name, field: "firmware", problem: "Missing firmware metadata" });
    }
    if (!s.location || !s.district) {
      out.push({ sensorId: s.id, sensorName: s.name, field: "location", problem: "Missing location/district metadata" });
    }
    if (s.readings?.parkingTotal !== undefined && s.readings.parkingAvailable !== undefined && s.readings.parkingAvailable > s.readings.parkingTotal) {
      out.push({ sensorId: s.id, sensorName: s.name, field: "readings", problem: "Inconsistent reading: available > total" });
    }
    if (s.readings?.humidityPct !== undefined && (s.readings.humidityPct < 0 || s.readings.humidityPct > 100)) {
      out.push({ sensorId: s.id, sensorName: s.name, field: "readings", problem: `Inconsistent humidity ${s.readings.humidityPct}%` });
    }
    if (s.snr < -10 && s.status !== "offline") {
      out.push({ sensorId: s.id, sensorName: s.name, field: "snr", problem: `SNR ${s.snr} dB indicates noisy link` });
    }
  });
  return out;
}

export interface AggregatedInsight { label: string; count: number; tone: "ok" | "warn" | "crit" }
export function aggregatedInsights(list: Sensor[]): AggregatedInsight[] {
  const offlineByDistrict = new Map<string, number>();
  list.filter((s) => s.status === "offline").forEach((s) => {
    offlineByDistrict.set(s.district, (offlineByDistrict.get(s.district) ?? 0) + 1);
  });
  const insights: AggregatedInsight[] = [];
  offlineByDistrict.forEach((count, d) => {
    insights.push({ label: `${count} sensor${count > 1 ? "s" : ""} offline in ${d}`, count, tone: "crit" });
  });
  const critBat = list.filter((s) => s.battery > 0 && s.battery < 15).length;
  if (critBat > 0) insights.push({ label: `${critBat} sensor${critBat > 1 ? "s" : ""} with critical battery (<15%)`, count: critBat, tone: "crit" });
  const warnBat = list.filter((s) => s.battery >= 15 && s.battery < 30).length;
  if (warnBat > 0) insights.push({ label: `${warnBat} sensor${warnBat > 1 ? "s" : ""} on battery warning (15–30%)`, count: warnBat, tone: "warn" });
  const unstable = list.filter((s) => s.status === "unstable" || s.status === "warning").length;
  if (unstable > 0) insights.push({ label: `${unstable} unstable sensor${unstable > 1 ? "s" : ""} — missed transmissions`, count: unstable, tone: "warn" });
  const slow = list.filter((s) => s.delayMin > s.expectedIntervalMin).length;
  if (slow > 0) insights.push({ label: `${slow} sensor${slow > 1 ? "s" : ""} reporting slower than expected`, count: slow, tone: "warn" });
  return insights;
}

export const locations: Location[] = [
  { id: "L1", name: "Innenstadt", district: "Aalen-Mitte", sensors: 24, online: 22 },
  { id: "L2", name: "Wasseralfingen", district: "Nord", sensors: 18, online: 16 },
  { id: "L3", name: "Hochschule Campus", district: "West", sensors: 14, online: 14 },
  { id: "L4", name: "Unterkochen", district: "Süd-Ost", sensors: 12, online: 11 },
  { id: "L5", name: "Hofherrnweiler", district: "West", sensors: 9, online: 9 },
  { id: "L6", name: "Ebnat", district: "Ost", sensors: 11, online: 10 },
];

export const trendData = [
  { t: "00:00", temp: 8, aqi: 32, humidity: 78 },
  { t: "03:00", temp: 6, aqi: 28, humidity: 82 },
  { t: "06:00", temp: 7, aqi: 35, humidity: 80 },
  { t: "09:00", temp: 12, aqi: 48, humidity: 70 },
  { t: "12:00", temp: 17, aqi: 62, humidity: 58 },
  { t: "15:00", temp: 19, aqi: 70, humidity: 52 },
  { t: "18:00", temp: 16, aqi: 55, humidity: 60 },
  { t: "21:00", temp: 11, aqi: 40, humidity: 72 },
];

export const sensorTypeMix = [
  { name: "Parking", value: 124, color: "#6366f1" },
  { name: "Air Quality", value: 86, color: "#10b981" },
  { name: "Weather", value: 54, color: "#0ea5e9" },
  { name: "Soil", value: 38, color: "#f59e0b" },
  { name: "Traffic", value: 47, color: "#ef4444" },
  { name: "Water", value: 29, color: "#8b5cf6" },
];
