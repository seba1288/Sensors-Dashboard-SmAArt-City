import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { sensors as defaultSensors, AALEN_CENTER } from "./data";
import type { Sensor } from "./data";

export interface AreaZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  color?: string;
}

export const DEFAULT_ZONES: AreaZone[] = [
  { id: "aalen-mitte", name: "Aalen-Mitte", lat: 48.8378, lng: 10.0950, radiusM: 900,  color: "#6366f1" },
  { id: "nord",        name: "Nord",        lat: 48.8650, lng: 10.0900, radiusM: 1100, color: "#0ea5e9" },
  { id: "west",        name: "West",        lat: 48.8445, lng: 10.0700, radiusM: 950,  color: "#10b981" },
  { id: "sued-ost",    name: "Süd-Ost",     lat: 48.8260, lng: 10.1200, radiusM: 1100, color: "#f59e0b" },
  { id: "ost",         name: "Ost",         lat: 48.8420, lng: 10.1450, radiusM: 1000, color: "#8b5cf6" },
];
import { ExternalLink, X as XIcon } from "lucide-react";

function markerHtml(status: Sensor["status"]) {
  if (status === "offline") {
    return `<div style="
      width:18px;height:18px;background:#e11d48;
      border:2px solid white;cursor:pointer;
      box-shadow:0 0 0 3px rgba(244,63,94,.30);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:12px;line-height:1;
    ">×</div>`;
  }
  if (status === "unstable" || status === "warning") {
    return `<div style="
      width:0;height:0;cursor:pointer;
      border-left:9px solid transparent;
      border-right:9px solid transparent;
      border-bottom:14px solid #f59e0b;
      filter: drop-shadow(0 0 0 2px white) drop-shadow(0 0 4px rgba(245,158,11,.55));
    "></div>`;
  }
  return `<div style="
    width:14px;height:14px;border-radius:9999px;background:#10b981;cursor:pointer;
    border:2px solid white;
    box-shadow:0 0 0 4px rgba(16,185,129,.25);
  "></div>`;
}

function buildIcon(status: Sensor["status"]) {
  return L.divIcon({
    className: "citypulse-marker",
    html: markerHtml(status),
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function readingSummary(s: Sensor): string {
  const r = s.readings ?? {};
  if (r.parkingTotal !== undefined) return `${r.parkingAvailable ?? 0}/${r.parkingTotal} spots free`;
  if (r.trafficFlow !== undefined) return `Flow: ${r.trafficFlow} (${r.vehicleCount ?? 0} veh)`;
  if (r.waterLevelM !== undefined) return `Level: ${r.waterLevelM.toFixed(2)} m`;
  if (r.pm25 !== undefined) return `PM2.5: ${r.pm25} µg/m³`;
  if (r.temperatureC !== undefined) return `Temp: ${r.temperatureC} °C${r.humidityPct !== undefined ? ` · ${r.humidityPct}%` : ""}`;
  if (r.moisturePct !== undefined) return `Soil: ${r.moisturePct}%`;
  if (s.status === "offline") return "No reading — offline";
  return "—";
}

export function CityMap({
  compact = false,
  sensors,
  onSelectSensor,
  zones = DEFAULT_ZONES,
  highlightedZoneId,
  showZones = true,
  onSelectZone,
}: {
  compact?: boolean;
  sensors?: Sensor[];
  onSelectSensor?: (s: Sensor) => void;
  zones?: AreaZone[];
  highlightedZoneId?: string | null;
  showZones?: boolean;
  onSelectZone?: (zone: AreaZone) => void;
}) {
  const list = sensors ?? defaultSensors;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onSelectRef = useRef(onSelectSensor);
  onSelectRef.current = onSelectSensor;
  const onSelectZoneRef = useRef(onSelectZone);
  onSelectZoneRef.current = onSelectZone;
  const fullLink = `https://www.openstreetmap.org/?mlat=${AALEN_CENTER.lat}&mlon=${AALEN_CENTER.lng}#map=13/${AALEN_CENTER.lat}/${AALEN_CENTER.lng}`;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [AALEN_CENTER.lat, AALEN_CENTER.lng],
      zoom: 13,
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showZones) return;
    const layers: L.Layer[] = [];
    zones.forEach((z) => {
      const highlight = highlightedZoneId === z.id;
      const color = z.color ?? "#6366f1";
      const circle = L.circle([z.lat, z.lng], {
        radius: z.radiusM,
        color,
        weight: highlight ? 3 : 1.5,
        opacity: highlight ? 0.95 : 0.6,
        fillColor: color,
        fillOpacity: highlight ? 0.18 : 0.08,
        interactive: true,
        bubblingMouseEvents: false,
        className: "citypulse-zone",
      }).addTo(map);
      circle.bindTooltip(`${z.name} · click to view sensors`, { sticky: true });
      circle.on("click", () => onSelectZoneRef.current?.(z));
      circle.on("mouseover", () => circle.setStyle({ fillOpacity: 0.22, weight: 3 }));
      circle.on("mouseout", () => circle.setStyle({ fillOpacity: highlight ? 0.18 : 0.08, weight: highlight ? 3 : 1.5 }));
      const label = L.marker([z.lat, z.lng], {
        interactive: !!onSelectZoneRef.current,
        icon: L.divIcon({
          className: "citypulse-zone-label",
          html: `<div style="
            font-family:inherit;font-size:11px;font-weight:600;
            color:${color};background:rgba(255,255,255,.85);
            padding:2px 6px;border-radius:6px;border:1px solid ${color}33;
            white-space:nowrap;transform:translate(-50%,-50%);cursor:${onSelectZoneRef.current ? "pointer" : "default"};
          ">${z.name}</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(map);
      if (onSelectZoneRef.current) label.on("click", () => onSelectZoneRef.current?.(z));
      layers.push(circle, label);
    });
    return () => {
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [zones, highlightedZoneId, showZones]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers: L.Layer[] = [];
    list.forEach((s) => {
      const marker = L.marker([s.lat, s.lng], { icon: buildIcon(s.status), title: s.name }).addTo(map);
      const popup = `
        <div style="font-family:inherit;min-width:200px">
          <div style="font-weight:600">${s.name}</div>
          <div style="color:#64748b;font-size:12px;text-transform:capitalize">${s.type} sensor · ${s.location}</div>
          <div style="margin-top:6px;font-size:12px">${readingSummary(s)}</div>
          <div style="color:#64748b;font-size:12px;margin-top:2px">Battery: ${s.battery}% · Status: ${s.status}</div>
          <button data-sensor-link="${s.id}" style="margin-top:8px;cursor:pointer;background:#0f172a;color:white;border:0;border-radius:6px;padding:4px 8px;font-size:12px">View details →</button>
        </div>`;
      marker.bindPopup(popup);
      marker.on("popupopen", (e) => {
        const el = (e.popup as L.Popup).getElement();
        const btn = el?.querySelector(`button[data-sensor-link="${s.id}"]`);
        btn?.addEventListener("click", () => onSelectRef.current?.(s));
      });
      marker.on("click", () => onSelectRef.current?.(s));
      layers.push(marker);
    });
    return () => {
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [list]);

  return (
    <section
      aria-label="Live sensor map of Aalen, Germany"
      className={`relative w-full ${compact ? "h-72" : "h-[420px]"} rounded-xl overflow-hidden border border-border`}
    >
      <div ref={containerRef} role="application" aria-label="Interactive map" className="absolute inset-0 z-0" />

      <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs flex items-center gap-3 z-[500] pointer-events-none">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Online</span>
        <span className="flex items-center gap-1.5">
          <span className="size-0" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: "7px solid #f59e0b" }} />
          Unstable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 bg-rose-600 flex items-center justify-center text-white"><XIcon className="size-2" strokeWidth={4} /></span>
          Offline
        </span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2 z-[500]">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
          Aalen, Germany • {list.length} devices
        </div>
        <a
          href={fullLink}
          target="_blank"
          rel="noreferrer noopener"
          className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          Open <ExternalLink className="size-3" />
        </a>
      </div>
    </section>
  );
}
