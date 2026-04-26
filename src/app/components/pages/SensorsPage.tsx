import { useState, useMemo, useEffect } from "react";
import { Plus, Search, MoreHorizontal, Filter, ChevronLeft, ChevronRight, Clock, BatteryCharging, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown, Table as TableIcon, Map as MapIcon } from "lucide-react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { sensors as initialSensors, daysUntilLowBattery, estimateLifetime } from "../data";
import type { Sensor, SensorType } from "../data";

type SortKey = "name" | "func" | "model" | "status" | "battery" | "forecast" | "location";

const STATUS_ORDER: Record<Sensor["status"], number> = { online: 0, unstable: 1, warning: 1, offline: 2 };

function compareSensors(a: Sensor, b: Sensor, key: SortKey): number {
  switch (key) {
    case "name": return a.name.localeCompare(b.name);
    case "func": return a.func.localeCompare(b.func);
    case "model": return a.model.localeCompare(b.model);
    case "location": return a.location.localeCompare(b.location);
    case "status": return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case "battery": return a.battery - b.battery;
    case "forecast": {
      const da = daysUntilLowBattery(a);
      const db = daysUntilLowBattery(b);
      const av = da === null ? Number.POSITIVE_INFINITY : da;
      const bv = db === null ? Number.POSITIVE_INFINITY : db;
      return av - bv;
    }
  }
}
import { SensorIcon, sensorTypeLabel } from "../SensorIcon";
import { StatusBadge, BatteryBar } from "../StatusBadge";
import { AddSensorDialog } from "../AddSensorDialog";
import { SensorDetailSheet } from "../SensorDetailSheet";
import { CityMap } from "../CityMap";

export function SensorsPage({ initialStatus = "all", initialDistrict = "all", onConsumeStatus, onConsumeDistrict }: { initialStatus?: string; initialDistrict?: string; onConsumeStatus?: () => void; onConsumeDistrict?: () => void } = {}) {
  const [list, setList] = useState<Sensor[]>(initialSensors);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [location, setLocation] = useState("all");
  const [district, setDistrict] = useState(initialDistrict);
  const [status, setStatus] = useState(initialStatus);
  useEffect(() => {
    if (initialStatus && initialStatus !== "all") {
      setStatus(initialStatus);
      setPage(1);
      onConsumeStatus?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus]);
  useEffect(() => {
    if (initialDistrict && initialDistrict !== "all") {
      setDistrict(initialDistrict);
      setPage(1);
      onConsumeDistrict?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDistrict]);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Sensor | null>(null);
  const [deleting, setDeleting] = useState<Sensor | null>(null);
  const [viewing, setViewing] = useState<Sensor | null>(null);
  const [view, setView] = useState<"table" | "map">("table");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 8;

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
    setPage(1);
  }

  const locationOptions = useMemo(
    () => Array.from(new Set(list.map((s) => s.location).filter((loc) => !!loc))).sort(),
    [list]
  );

  const districtOptions = useMemo(
    () => Array.from(new Set(list.map((s) => s.district).filter((d) => !!d))).sort(),
    [list]
  );

  const filtered = useMemo(() => {
    return list.filter((s) => {
      if (type !== "all" && s.type !== type) return false;
      if (location !== "all" && s.location !== location) return false;
      if (district !== "all" && s.district !== district) return false;
      if (status !== "all" && s.status !== status) return false;
      if (q && !`${s.name} ${s.model} ${s.func} ${s.communication} ${s.location} ${s.district} ${s.id}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [list, q, type, location, district, status]);

  function handleSaveEdit(updated: Sensor) {
    setList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditing(null);
  }

  function handleDelete() {
    if (!deleting) return;
    setList((prev) => prev.filter((s) => s.id !== deleting.id));
    setDeleting(null);
  }

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const cmp = compareSensors(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(sorted.length, safePage * pageSize);

  return (
    <div className="p-8 space-y-5">
      <Card className="p-4 gap-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, ID, or location…" className="pl-9" />
          </div>
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Sensor filters">
            <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <SelectTrigger aria-label="Filter by type" className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="parking">Parking</SelectItem>
                <SelectItem value="air">Air Quality</SelectItem>
                <SelectItem value="weather">Weather</SelectItem>
                <SelectItem value="soil">Soil</SelectItem>
                <SelectItem value="traffic">Traffic</SelectItem>
                <SelectItem value="water">Water</SelectItem>
              </SelectContent>
            </Select>
            <Select value={location} onValueChange={(v) => { setLocation(v); setPage(1); }}>
              <SelectTrigger aria-label="Filter by location" className="w-[180px]"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locationOptions.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={district} onValueChange={(v) => { setDistrict(v); setPage(1); }}>
              <SelectTrigger aria-label="Filter by district" className="w-[160px]"><SelectValue placeholder="District" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districtOptions.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger aria-label="Filter by status" className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="unstable">Unstable</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <div className="inline-flex items-center bg-muted rounded-lg p-0.5 text-xs" role="tablist" aria-label="View mode">
              <button
                type="button"
                role="tab"
                aria-selected={view === "table"}
                onClick={() => setView("table")}
                className={`px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5 ${view === "table" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <TableIcon className="size-3.5" /> Table
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "map"}
                onClick={() => setView("map")}
                className={`px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5 ${view === "map" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <MapIcon className="size-3.5" /> Map
              </button>
            </div>
            <Button onClick={() => setOpen(true)} className="gap-1.5">
              <Plus className="size-4" /> Add Sensor
            </Button>
          </div>
        </div>
      </Card>

      {view === "map" && (
        <Card className="p-5 gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-foreground">Sensor Map</div>
              <div className="text-xs text-muted-foreground">{sorted.length} sensors shown · click a marker to view details</div>
            </div>
          </div>
          <CityMap sensors={sorted} onSelectSensor={setViewing} />
        </Card>
      )}

      {view === "table" && <Card className="overflow-hidden gap-0 p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">
              Sensors. Showing {rangeStart} to {rangeEnd} of {sorted.length}. Sorted by {sortKey}, {sortDir === "asc" ? "ascending" : "descending"}.
            </caption>
            <thead className="bg-muted/40">
              <tr className="text-left text-xs text-muted-foreground">
                <SortableTh label="Sensor" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortableTh label="Type / Function" k="func" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortableTh label="Model" k="model" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortableTh label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortableTh label="Battery Health" k="battery" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortableTh
                  label={<span className="inline-flex items-center gap-1.5"><BatteryCharging className="size-3.5" aria-hidden="true" /> Est. Lifetime</span>}
                  k="forecast"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onClick={toggleSort}
                />
                <SortableTh label="Location" k="location" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s) => {
                const days = daysUntilLowBattery(s);
                const lifetime = estimateLifetime(s);
                const forecastTone =
                  days === null ? "text-muted-foreground"
                  : !isFinite(days) ? "text-emerald-600 dark:text-emerald-400"
                  : days <= 30 ? "text-rose-600 dark:text-rose-400"
                  : days <= 180 ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400";
                return (
                  <tr key={s.id} className="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setViewing(s)}>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setViewing(s); }}
                        className="flex items-center gap-3 text-left hover:text-foreground"
                        aria-label={`Open details for ${s.name}`}
                      >
                        <SensorIcon type={s.type} />
                        <div>
                          <div className="text-sm">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.id}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <div className="text-foreground">{s.func}</div>
                      <div className="text-xs text-muted-foreground">{sensorTypeLabel(s.type)}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <div className="text-foreground">{s.model}</div>
                      <div className="text-xs text-muted-foreground">{s.communication} · {s.lastSeen}</div>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={s.status} delayMin={s.delayMin} missed={s.missedTransmissions} /></td>
                    <td className="px-5 py-3.5"><BatteryBar value={s.battery} /></td>
                    <td className="px-5 py-3.5">
                      <div className={`inline-flex items-center gap-1.5 text-sm ${forecastTone}`}>
                        <Clock className="size-3.5" />
                        {lifetime}
                      </div>
                      {days !== null && isFinite(days) && days > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {s.dischargePerDay.toFixed(2)}%/day drain
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{s.location}</td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="size-8 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground"
                            aria-label={`Actions for ${s.name}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onSelect={() => setEditing(s)}>
                            <Pencil className="size-3.5" /> Edit Sensor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleting(s)}
                          >
                            <Trash2 className="size-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No sensors match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground gap-3 flex-wrap">
          <span>
            Showing <span className="text-foreground tabular-nums">{rangeStart}–{rangeEnd}</span> of{" "}
            <span className="text-foreground tabular-nums">{filtered.length}</span> sensors
            {filtered.length !== list.length && <> (filtered from {list.length})</>}
          </span>
          <nav aria-label="Sensors table pagination" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="size-7 rounded-md hover:bg-accent flex items-center justify-center disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </button>
            {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
              const n = i + 1;
              const current = safePage === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-label={`Page ${n}`}
                  aria-current={current ? "page" : undefined}
                  className={`min-w-7 h-7 px-2 rounded-md tabular-nums ${current ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  {n}
                </button>
              );
            })}
            {totalPages > 5 && <span className="px-1" aria-hidden="true">…</span>}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="size-7 rounded-md hover:bg-accent flex items-center justify-center disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Next page"
            >
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </Card>}

      <AddSensorDialog open={open} onOpenChange={setOpen} />

      <SensorDetailSheet sensor={viewing} onClose={() => setViewing(null)} />

      <EditSensorDialog
        sensor={editing}
        locations={locationOptions}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sensor?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <>
                  This will permanently remove <span className="text-foreground">{deleting.name}</span> ({deleting.id}) from the network.
                  Historical data will be retained but the device will stop reporting. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete sensor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortableTh({
  label,
  k,
  sortKey,
  sortDir,
  onClick,
}: {
  label: React.ReactNode;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onClick: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  const ariaSort: "ascending" | "descending" | "none" = active ? (sortDir === "asc" ? "ascending" : "descending") : "none";
  return (
    <th scope="col" className="px-5 py-3" aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1.5 hover:text-foreground transition-colors ${active ? "text-foreground" : ""}`}
      >
        {label}
        <Icon className={`size-3 ${active ? "opacity-100" : "opacity-50"}`} aria-hidden="true" />
      </button>
    </th>
  );
}

function EditSensorDialog({
  sensor,
  locations,
  onClose,
  onSave,
}: {
  sensor: Sensor | null;
  locations: string[];
  onClose: () => void;
  onSave: (s: Sensor) => void;
}) {
  const [draft, setDraft] = useState<Sensor | null>(null);

  useEffect(() => {
    setDraft(sensor ? { ...sensor } : null);
  }, [sensor]);

  if (!sensor || !draft) return null;

  function update<K extends keyof Sensor>(key: K, value: Sensor[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (draft) onSave(draft);
  }

  return (
    <Dialog open={!!sensor} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Sensor</DialogTitle>
          <DialogDescription>Update device metadata. Live readings come from the device itself.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Sensor Name</Label>
            <Input id="edit-name" value={draft.name} onChange={(e) => update("name", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={draft.type} onValueChange={(v) => update("type", v as SensorType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="parking">Parking</SelectItem>
                  <SelectItem value="air">Air Quality</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="soil">Soil</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-model">Model</Label>
              <Input id="edit-model" value={draft.model} onChange={(e) => update("model", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => update("status", v as Sensor["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="unstable">Unstable</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Select value={draft.location} onValueChange={(v) => update("location", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-battery">Battery (%)</Label>
              <Input
                id="edit-battery"
                type="number"
                min={0}
                max={100}
                value={draft.battery}
                onChange={(e) => update("battery", Math.max(0, Math.min(100, Number(e.target.value))))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-drain">Drain (%/day)</Label>
              <Input
                id="edit-drain"
                type="number"
                step="0.05"
                min={0}
                value={draft.dischargePerDay}
                onChange={(e) => update("dischargePerDay", Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
