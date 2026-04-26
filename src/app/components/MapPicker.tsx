import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AALEN_CENTER } from "./data";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

export function MapPicker({ value, onChange, height = 180 }: { value: { lat: number; lng: number } | null; onChange: (p: { lat: number; lng: number }) => void; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [latInput, setLatInput] = useState(value ? value.lat.toFixed(5) : "");
  const [lngInput, setLngInput] = useState(value ? value.lng.toFixed(5) : "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false }).setView([AALEN_CENTER.lat, AALEN_CENTER.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    map.on("click", (e: L.LeafletMouseEvent) => {
      onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      return;
    }
    setLatInput(value.lat.toFixed(5));
    setLngInput(value.lng.toFixed(5));
    const icon = L.divIcon({
      className: "map-picker-marker",
      html: `<div style="width:18px;height:18px;border-radius:9999px;background:#0ea5e9;border:2px solid white;box-shadow:0 0 0 4px rgba(14,165,233,.3);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    if (markerRef.current) markerRef.current.setLatLng([value.lat, value.lng]);
    else markerRef.current = L.marker([value.lat, value.lng], { icon }).addTo(map);
    map.panTo([value.lat, value.lng]);
  }, [value]);

  function applyCoords() {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) { setError("Latitude must be between -90 and 90"); return; }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) { setError("Longitude must be between -180 and 180"); return; }
    setError("");
    onChange({ lat, lng });
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyCoords();
    }
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div ref={ref} style={{ height }} className="bg-muted" aria-label="Click on the map to pick a location, or enter coordinates below" />
      <div className="px-3 py-2.5 bg-card/40 border-t border-border space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label htmlFor="mp-lat" className="text-xs text-muted-foreground">Latitude</Label>
            <Input
              id="mp-lat"
              inputMode="decimal"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="48.83780"
              className="h-8 text-xs tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mp-lng" className="text-xs text-muted-foreground">Longitude</Label>
            <Input
              id="mp-lng"
              inputMode="decimal"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="10.09330"
              className="h-8 text-xs tabular-nums"
            />
          </div>
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={applyCoords}>
            Place
          </Button>
        </div>
        {error ? (
          <div className="text-xs text-rose-600 dark:text-rose-400">{error}</div>
        ) : (
          <div className="text-xs text-muted-foreground tabular-nums">
            {value ? <>📍 {value.lat.toFixed(5)}, {value.lng.toFixed(5)}</> : "Click on the map or enter coordinates to place the sensor"}
          </div>
        )}
      </div>
    </div>
  );
}
