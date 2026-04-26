import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { ShieldCheck, CheckCircle2, AlertCircle, Lock } from "lucide-react";

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [policy, setPolicy] = useState({ minLength: 12, requireUpper: true, requireNumber: true, requireSymbol: false });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function meetsPolicy(p: string): string | null {
    if (p.length < policy.minLength) return `Password must be at least ${policy.minLength} characters`;
    if (policy.requireUpper && !/[A-Z]/.test(p)) return "Password must include an uppercase letter";
    if (policy.requireNumber && !/\d/.test(p)) return "Password must include a number";
    if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(p)) return "Password must include a symbol";
    return null;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!current) { setError("Enter your current password"); return; }
    if (next !== confirm) { setError("New passwords do not match"); return; }
    const policyErr = meetsPolicy(next);
    if (policyErr) { setError(policyErr); return; }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setCurrent(""); setNext(""); setConfirm("");
      onOpenChange(false);
    }, 1200);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage account security and password policy.</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5 mt-2">
          <ShieldCheck className="size-3.5" aria-hidden="true" /> Secure access enabled · TLS 1.3 + role-based access
        </div>

        <form onSubmit={submit} className="space-y-4 mt-4">
          <div>
            <div className="text-sm mb-2 inline-flex items-center gap-1.5"><Lock className="size-3.5" /> Change password</div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cur-pw">Current password</Label>
                <Input id="cur-pw" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">New password</Label>
                  <Input id="new-pw" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">Confirm</Label>
                  <Input id="confirm-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="text-sm">Password policy</div>
            <div className="flex items-center gap-2 text-sm">
              <Label htmlFor="minlen" className="text-xs text-muted-foreground">Minimum length</Label>
              <Input id="minlen" type="number" min={6} max={64} className="w-20 h-8" value={policy.minLength} onChange={(e) => setPolicy((p) => ({ ...p, minLength: Math.max(6, Math.min(64, Number(e.target.value) || 6)) }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={policy.requireUpper} onCheckedChange={(v) => setPolicy((p) => ({ ...p, requireUpper: !!v }))} />
              Require uppercase letter
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={policy.requireNumber} onCheckedChange={(v) => setPolicy((p) => ({ ...p, requireNumber: !!v }))} />
              Require number
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={policy.requireSymbol} onCheckedChange={(v) => setPolicy((p) => ({ ...p, requireSymbol: !!v }))} />
              Require symbol
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="size-3" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
            <Button type="submit" className="min-w-[140px]">
              {saved ? (<span className="flex items-center gap-1.5"><CheckCircle2 className="size-4" /> Saved</span>) : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
