import { useState } from "react";
import { MapPin, Plus, Cpu, Wifi, Trash2 } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { CityMap } from "../CityMap";
import { SensorDetailSheet } from "../SensorDetailSheet";
import { locations as initialLocations } from "../data";
import type { Location, Sensor } from "../data";

const DISTRICTS = ["Aalen-Mitte", "Nord", "Süd-Ost", "West", "Ost"];

type NavFn = (p: "dashboard" | "sensors" | "locations" | "alerts", opts?: { sensorStatus?: string; sensorDistrict?: string }) => void;

export function LocationsPage({ onNavigate }: { onNavigate?: NavFn } = {}) {
  const [list, setList] = useState<Location[]>(initialLocations);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ name: string; district: string; capacity: string }>({ name: "", district: "", capacity: "10" });
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Location | null>(null);
  const [viewing, setViewing] = useState<Sensor | null>(null);

  function reset() {
    setDraft({ name: "", district: "", capacity: "10" });
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.district) {
      setError("Zone name and district are required.");
      return;
    }
    const cap = Math.max(1, Number(draft.capacity) || 1);
    const id = `L${list.length + 1}`;
    setList((l) => [...l, { id, name: draft.name.trim(), district: draft.district, sensors: 0, online: 0, capacity: cap }]);
    setOpen(false);
    reset();
  }

  function confirmRemove() {
    if (!deleting) return;
    setList((l) => l.filter((x) => x.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <div className="p-8 space-y-6">
      <Card className="p-5 gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-foreground">Coverage Map</div>
            <div className="text-xs text-muted-foreground">Sensor density across districts</div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Create New Location Zone
          </Button>
        </div>
        <CityMap
          onSelectSensor={setViewing}
          onSelectZone={(z) => onNavigate?.("sensors", { sensorDistrict: z.name })}
        />
      </Card>

      <SensorDetailSheet sensor={viewing} onClose={() => setViewing(null)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((l) => {
          const pct = l.sensors > 0 ? Math.round((l.online / l.sensors) * 100) : 0;
          return (
            <Card
              key={l.id}
              className="p-5 gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate?.("sensors", { sensorDistrict: l.district })}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate?.("sensors", { sensorDistrict: l.district }); } }}
              aria-label={`View sensors in ${l.name} (${l.district} district)`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-500/15 dark:to-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <div className="text-foreground">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.district} District</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pct >= 90 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : pct >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"}`}>{pct}%</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDeleting(l); }}
                    aria-label={`Delete ${l.name} zone`}
                    className="size-7 rounded-md hover:bg-rose-100 dark:hover:bg-rose-500/15 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-300 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Cpu className="size-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="tabular-nums">{l.sensors}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="size-3.5 text-emerald-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Online</div>
                    <div className="tabular-nums">{l.online}</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Create New Location Zone</DialogTitle>
            <DialogDescription>Define a logical zone for grouping sensors. You can deploy devices into it afterwards.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="zone-name">Zone Name</Label>
              <Input id="zone-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Hirschbach Promenade" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>District</Label>
                <Select value={draft.district} onValueChange={(v) => setDraft((d) => ({ ...d, district: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zone-cap">Planned capacity</Label>
                <Input id="zone-cap" type="number" min={1} value={draft.capacity} onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))} />
              </div>
            </div>
            {error && <div className="text-xs text-rose-600 dark:text-rose-400">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Create Zone</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location zone?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <>
                  This will permanently remove the <span className="text-foreground">{deleting.name}</span> zone in {deleting.district}.
                  Sensors deployed there will become unassigned. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-rose-600 text-white hover:bg-rose-700">
              Delete zone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
