import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CheckCircle2, AlertCircle, Cpu } from "lucide-react";
import { MapPicker } from "./MapPicker";
import { sensors as allSensors } from "./data";
import type { SensorType } from "./data";

const TYPE_LABEL: Record<SensorType, string> = {
  parking: "Parking",
  air: "Air Quality",
  weather: "Weather",
  soil: "Soil",
  traffic: "Traffic",
  water: "Water",
};

export function AddSensorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [location, setLocation] = useState("");
  const [criticality, setCriticality] = useState<"low" | "medium" | "high">("medium");
  const [schema, setSchema] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const sameTypeCount = useMemo(
    () => (type ? allSensors.filter((s) => s.type === type).length : 0),
    [type]
  );

  const errors = {
    name: submitted && !name ? "Sensor name is required" : "",
    type: submitted && !type ? "Select a sensor type" : "",
    deviceId: submitted && !/^[A-Z]{2}-\d{3,}$/.test(deviceId) ? "Format: XX-123 (e.g. SN-101)" : "",
    location: submitted && !location ? "Choose a location" : "",
    coords: submitted && !coords ? "Click on the map to pick coordinates" : "",
    schema: submitted && schema.trim() ? validateJson(schema) : "",
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!name || !type || !location || !coords || !/^[A-Z]{2}-\d{3,}$/.test(deviceId)) return;
    if (schema.trim() && validateJson(schema)) return;
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSubmitted(false);
      setName(""); setType(""); setDeviceId(""); setLocation(""); setCoords(null);
      setCriticality("medium"); setSchema("");
      onOpenChange(false);
    }, 1200);
  }

  const critTone = criticality === "high"
    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
    : criticality === "medium"
    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Sensor</DialogTitle>
          <DialogDescription>Register a new IoT device to the network. It will appear once it sends its first heartbeat.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Sensor Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Park Plaza North" />
            {errors.name && <FieldError msg={errors.name} />}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sensor Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="parking">Parking</SelectItem>
                  <SelectItem value="air">Air Quality</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="soil">Soil</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                </SelectContent>
              </Select>
              {type && (
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mt-1">
                  <Cpu className="size-3" aria-hidden="true" />
                  {TYPE_LABEL[type as SensorType]} sensors: <span className="text-foreground tabular-nums">{sameTypeCount} existing</span>
                </div>
              )}
              {errors.type && <FieldError msg={errors.type} />}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="did">Device ID</Label>
              <Input id="did" value={deviceId} onChange={(e) => setDeviceId(e.target.value.toUpperCase())} placeholder="SN-101" />
              {errors.deviceId && <FieldError msg={errors.deviceId} />}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Criticality Level</Label>
            <div className="inline-flex items-center bg-muted rounded-lg p-0.5 text-xs" role="radiogroup" aria-label="Criticality level">
              {(["low", "medium", "high"] as const).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  role="radio"
                  aria-checked={criticality === lv}
                  onClick={() => setCriticality(lv)}
                  className={`px-3 py-1.5 rounded-md capitalize ${criticality === lv ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  {lv}
                </button>
              ))}
              <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${critTone} capitalize`}>{criticality} priority</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Drives alert sensitivity and on-call routing for this device.
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger><SelectValue placeholder="Pick a location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="downtown">Downtown</SelectItem>
                <SelectItem value="riverside">Riverside Park</SelectItem>
                <SelectItem value="cbd">CBD</SelectItem>
                <SelectItem value="harbor">Harbor</SelectItem>
                <SelectItem value="greenway">Greenway</SelectItem>
                <SelectItem value="westpark">West Park</SelectItem>
              </SelectContent>
            </Select>
            {errors.location && <FieldError msg={errors.location} />}
          </div>

          <div className="space-y-1.5">
            <Label>Pick exact location</Label>
            <MapPicker value={coords} onChange={setCoords} />
            {errors.coords && <FieldError msg={errors.coords} />}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="schema">
              Custom Schema <span className="text-xs text-muted-foreground font-normal">(optional · JSON)</span>
            </Label>
            <Textarea
              id="schema"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              placeholder={`{\n  "fields": ["temperatureC", "humidityPct"],\n  "unit": "°C"\n}`}
              className="font-mono text-xs min-h-24"
            />
            <div className="text-xs text-muted-foreground">
              Override the default payload schema for non-standard devices. Leave blank to use the default for this sensor type.
            </div>
            {errors.schema && <FieldError msg={errors.schema} />}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="min-w-[120px]">
              {success ? (<span className="flex items-center gap-1.5"><CheckCircle2 className="size-4" /> Added</span>) : "Register Sensor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function validateJson(s: string): string {
  try { JSON.parse(s); return ""; } catch { return "Schema must be valid JSON"; }
}

function FieldError({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
      <AlertCircle className="size-3" /> {msg}
    </div>
  );
}
