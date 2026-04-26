import { useMemo, useState } from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Clock, X, UserCircle2, Wrench, Network, ListTree, Rows3, Inbox, BellRing, HardHat } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";
import { alerts as initial, ISSUE_CATEGORY_META, URGENCY_META, WORKFLOW_META } from "../data";
import type { Alert, IssueCategory, Urgency, WorkflowStatus } from "../data";

const sevConfig = {
  critical: { icon: AlertCircle, label: "Critical", text: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-500/15", border: "border-l-rose-500" },
  warning: { icon: AlertTriangle, label: "Warning", text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-500/15", border: "border-l-amber-500" },
  info: { icon: Info, label: "Info", text: "text-sky-700 dark:text-sky-300", bg: "bg-sky-100 dark:bg-sky-500/15", border: "border-l-sky-500" },
};

type CardFilter = "total" | "unresolved" | "critical" | "resolved";

export function AlertsPage() {
  const [filter, setFilter] = useState<CardFilter>("unresolved");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | Urgency>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | IssueCategory>("all");
  const [list, setList] = useState<Alert[]>(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"detailed" | "compact">("detailed");
  const [active, setActive] = useState<Alert | null>(null);
  const [draft, setDraft] = useState<{ assignee: string; workflow: WorkflowStatus } | null>(null);

  const visible = list.filter((a) => {
    if (filter === "resolved" && !a.resolved) return false;
    if (filter === "unresolved" && a.resolved) return false;
    if (filter === "critical" && (a.severity !== "critical" || a.resolved)) return false;
    if (urgencyFilter !== "all" && a.urgency !== urgencyFilter) return false;
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
    return true;
  });

  const counts = {
    total: list.length,
    unresolved: list.filter((a) => !a.resolved).length,
    resolved: list.filter((a) => a.resolved).length,
    critical: list.filter((a) => a.severity === "critical" && !a.resolved).length,
  };

  const selectableIds = useMemo(() => visible.filter((a) => !a.resolved).map((a) => a.id), [visible]);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  function bulkResolve() {
    setList((l) => l.map((x) => selected.has(x.id) ? { ...x, resolved: true, workflow: "resolved" as WorkflowStatus } : x));
    setSelected(new Set());
  }

  function openAlert(a: Alert) {
    setActive(a);
    setDraft({ assignee: a.assignee ?? "", workflow: a.workflow });
  }

  function closeAlert() {
    setActive(null);
    setDraft(null);
  }

  function submitDraft() {
    if (!active || !draft) return;
    const prev = active;
    const next: Alert = {
      ...active,
      assignee: draft.assignee || undefined,
      workflow: draft.workflow,
      resolved: draft.workflow === "resolved",
    };
    setList((l) => l.map((x) => (x.id === active.id ? next : x)));
    if (draft.assignee && draft.assignee !== prev.assignee) {
      toast.success(`Notified ${draft.assignee}`, {
        description: `Assigned to alert: ${prev.sensor} — ${prev.message}`,
      });
    }
    if (draft.workflow !== prev.workflow) {
      toast.success(`Status updated to ${WORKFLOW_META[draft.workflow].label}`, {
        description: `${prev.sensor} — ${prev.message}`,
      });
    }
    closeAlert();
  }

  function acceptMission() {
    if (!active || !active.assignee) return;
    const acceptedAt = new Date().toISOString();
    const next: Alert = {
      ...active,
      missionAccepted: true,
      missionAcceptedAt: acceptedAt,
      workflow: "in_progress",
      resolved: false,
    };
    setList((l) => l.map((x) => (x.id === active.id ? next : x)));
    setActive(next);
    setDraft({ assignee: next.assignee ?? "", workflow: next.workflow });
    toast.success(`Mission accepted by ${next.assignee}`, {
      description: `${next.sensor} — status: In Progress`,
    });
  }

  const technicians = ["T. Becker", "M. Schultz", "Network Ops", "Air Quality Ops", "OTA service"];

  const filterCards: { key: CardFilter; label: string; value: number; tone: string; iconTone: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "total",      label: "Total Alerts", value: counts.total,      tone: "text-foreground",                   iconTone: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300", icon: Inbox },
    { key: "unresolved", label: "Unresolved",   value: counts.unresolved, tone: "text-amber-600 dark:text-amber-400", iconTone: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300", icon: AlertTriangle },
    { key: "critical",   label: "Critical",     value: counts.critical,   tone: "text-rose-600 dark:text-rose-400",   iconTone: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",     icon: AlertCircle },
    { key: "resolved",   label: "Resolved",     value: counts.resolved,   tone: "text-emerald-600 dark:text-emerald-400", iconTone: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300", icon: CheckCircle2 },
  ];

  return (
    <div className="p-8 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filterCards.map((c) => {
          const Icon = c.icon;
          const active = filter === c.key;
          return (
            <Card
              key={c.key}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              onClick={() => { setFilter(c.key); setSelected(new Set()); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFilter(c.key); setSelected(new Set()); } }}
              className={`p-4 gap-1 cursor-pointer transition-all ${active ? "ring-2 ring-primary shadow-sm" : "hover:shadow-md hover:-translate-y-0.5"}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className={`size-7 rounded-lg flex items-center justify-center ${c.iconTone}`}>
                  <Icon className="size-3.5" />
                </div>
              </div>
              <div className={`tabular-nums tracking-tight ${c.tone}`} style={{ fontSize: "1.6rem", lineHeight: 1.1 }}>{c.value}</div>
            </Card>
          );
        })}
      </div>

      <Card className="p-0 gap-0">
        <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          {selectableIds.length > 0 && (
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={toggleAll}
              aria-label="Select all visible unresolved alerts"
            />
          )}
          <span className="text-sm text-muted-foreground">
            Showing <span className="text-foreground tabular-nums">{visible.length}</span> alert{visible.length === 1 ? "" : "s"}
            <span className="ml-1 capitalize">· {filter}</span>
          </span>

          <Select value={urgencyFilter} onValueChange={(v) => setUrgencyFilter(v as "all" | Urgency)}>
            <SelectTrigger className="w-[140px] h-8" aria-label="Filter by urgency"><SelectValue placeholder="Urgency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All urgencies</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as "all" | IssueCategory)}>
            <SelectTrigger className="w-[160px] h-8" aria-label="Filter by category"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="battery">Battery</SelectItem>
              <SelectItem value="connectivity">Connectivity</SelectItem>
              <SelectItem value="gateway">Gateway</SelectItem>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="software">Software</SelectItem>
            </SelectContent>
          </Select>

          <div className="inline-flex items-center bg-muted rounded-lg p-0.5 text-xs ml-auto" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={view === "detailed"}
              onClick={() => setView("detailed")}
              className={`px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5 ${view === "detailed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <ListTree className="size-3.5" /> Detailed
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "compact"}
              onClick={() => setView("compact")}
              className={`px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5 ${view === "compact" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <Rows3 className="size-3.5" /> Compact
            </button>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 bg-accent/60 rounded-lg pl-3 pr-1 py-1" role="region" aria-label="Bulk actions">
              <span className="text-xs" aria-live="polite">{selected.size} selected</span>
              <Button size="sm" onClick={bulkResolve} className="gap-1.5 h-7">
                <CheckCircle2 className="size-3.5" /> Bulk Resolve
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                className="size-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground"
                aria-label="Clear selection"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="divide-y divide-border">
          {visible.map((a) => {
            const cfg = sevConfig[a.severity];
            const Icon = cfg.icon;
            const isSelected = selected.has(a.id);

            if (view === "compact") {
              const u = URGENCY_META[a.urgency];
              const c = ISSUE_CATEGORY_META[a.category];
              return (
                <button
                  key={a.id}
                  onClick={() => openAlert(a)}
                  className={`w-full text-left px-5 py-3 border-l-2 ${cfg.border} flex items-center gap-3 hover:bg-muted/30 transition-colors`}
                >
                  <Icon className={`size-4 ${cfg.text}`} />
                  <div className="flex-1 min-w-0 text-sm truncate">{a.message}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.tone}`}>
                    <span aria-hidden="true">{c.icon}</span> {c.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${u.tone}`}>
                    <span className={`size-1.5 rounded-full ${u.dot}`} aria-hidden="true" /> {u.label}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums w-20 text-right shrink-0">{a.time}</span>
                </button>
              );
            }

            return (
              <div
                key={a.id}
                onClick={() => openAlert(a)}
                className={`px-5 py-4 border-l-2 ${cfg.border} flex items-start gap-4 hover:bg-muted/30 transition-colors cursor-pointer ${isSelected ? "bg-accent/40" : ""}`}
              >
                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                  {a.resolved ? (
                    <div className="size-4" />
                  ) : (
                    <Checkbox checked={isSelected} onCheckedChange={() => toggle(a.id)} aria-label={`Select ${a.id}`} />
                  )}
                </div>
                <div className={`size-9 rounded-lg ${cfg.bg} ${cfg.text} flex items-center justify-center shrink-0`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => { const u = URGENCY_META[a.urgency]; return (
                      <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${u.tone}`}>
                        <span className={`size-1.5 rounded-full ${u.dot}`} aria-hidden="true" /> {u.label}
                      </span>
                    ); })()}
                    {(() => { const c = ISSUE_CATEGORY_META[a.category]; return (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.tone}`}>
                        <span aria-hidden="true">{c.icon}</span> {c.label}
                      </span>
                    ); })()}
                    {(() => { const w = WORKFLOW_META[a.workflow]; return (
                      <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${w.tone}`}>
                        {a.workflow === "resolved" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />} {w.label}
                      </span>
                    ); })()}
                    {a.group && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 inline-flex items-center gap-1">
                        <Network className="size-3" /> {a.group.length} sensors
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{a.time}</span>
                  </div>
                  <div className="mt-1.5 text-foreground">{a.sensor}</div>
                  <div className="text-sm text-muted-foreground">{a.message}</div>
                  {a.rootCause && <div className="text-xs text-muted-foreground/80 mt-1 italic">Why: {a.rootCause}</div>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <UserCircle2 className="size-3.5" aria-hidden="true" /> Assigned to
                      <span className="text-foreground ml-1">{a.assignee ?? "—"}</span>
                    </span>
                    {a.recommendedAction && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Wrench className="size-3.5" aria-hidden="true" /> {a.recommendedAction}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {visible.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No alerts in this view</div>
          )}
        </div>
      </Card>

      <Dialog open={!!active} onOpenChange={(v) => !v && closeAlert()}>
        <DialogContent className="sm:max-w-[560px]">
          {active && draft && (() => {
            const cfg = sevConfig[active.severity];
            const Icon = cfg.icon;
            const u = URGENCY_META[active.urgency];
            const c = ISSUE_CATEGORY_META[active.category];
            const w = WORKFLOW_META[active.workflow];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className={`size-8 rounded-lg ${cfg.bg} ${cfg.text} flex items-center justify-center`}>
                      <Icon className="size-4" />
                    </span>
                    {active.sensor}
                  </DialogTitle>
                  <DialogDescription>{active.message}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${u.tone}`}>
                      <span className={`size-1.5 rounded-full ${u.dot}`} aria-hidden="true" /> {u.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.tone}`}>
                      <span aria-hidden="true">{c.icon}</span> {c.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${w.tone}`}>
                      {active.workflow === "resolved" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />} {w.label}
                    </span>
                    {active.group && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 inline-flex items-center gap-1">
                        <Network className="size-3" /> {active.group.length} sensors
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{active.time}</span>
                  </div>

                  {active.rootCause && (
                    <div className="rounded-lg bg-muted/60 border border-border p-3 text-sm">
                      <div className="text-xs text-muted-foreground mb-1">Root cause</div>
                      <div className="text-foreground">{active.rootCause}</div>
                    </div>
                  )}

                  {active.recommendedAction && (
                    <div className="text-sm flex items-start gap-2">
                      <Wrench className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Recommended action</div>
                        <div className="text-foreground">{active.recommendedAction}</div>
                      </div>
                    </div>
                  )}

                  {active.group && (
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground mb-1">Affected sensors</div>
                      <div className="text-foreground tabular-nums">{active.group.join(", ")}</div>
                    </div>
                  )}

                  {active.missionAccepted && active.assignee ? (
                    <div className="rounded-lg border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-3 flex items-start gap-2.5">
                      <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="flex-1 text-sm">
                        <div className="text-emerald-800 dark:text-emerald-200">Mission Accepted</div>
                        <div className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5 inline-flex items-center gap-1.5">
                          <HardHat className="size-3.5" aria-hidden="true" />
                          <span className="text-foreground">{active.assignee}</span>
                          <span aria-hidden="true">·</span>
                          <span>Status: In Progress</span>
                        </div>
                        {active.missionAcceptedAt && (
                          <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                            Accepted {new Date(active.missionAcceptedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : active.assignee && !active.resolved ? (
                    <div className="rounded-lg border border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 p-3 flex items-start gap-2.5">
                      <BellRing className="size-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="flex-1 text-sm">
                        <div className="text-sky-800 dark:text-sky-200">Notification sent to <span className="text-foreground">{active.assignee}</span></div>
                        <div className="text-xs text-sky-700/80 dark:text-sky-300/80 mt-0.5">Awaiting technician acceptance.</div>
                      </div>
                      <Button size="sm" onClick={acceptMission} className="gap-1.5 h-8 shrink-0">
                        <CheckCircle2 className="size-3.5" /> Accept Mission
                      </Button>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <UserCircle2 className="size-3.5" /> Assigned technician
                      </label>
                      <Select value={draft.assignee} onValueChange={(v) => setDraft((d) => d ? { ...d, assignee: v } : d)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                        <SelectContent>
                          {technicians.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="size-3.5" /> Status
                      </label>
                      <Select value={draft.workflow} onValueChange={(v) => setDraft((d) => d ? { ...d, workflow: v as WorkflowStatus } : d)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(() => {
                    const dirty = (draft.assignee || "") !== (active.assignee ?? "") || draft.workflow !== active.workflow;
                    return (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={closeAlert}>Cancel</Button>
                        <Button onClick={submitDraft} disabled={!dirty}>Submit</Button>
                      </div>
                    );
                  })()}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
