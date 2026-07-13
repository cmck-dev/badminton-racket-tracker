"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createRacket,
  updateRacket,
  deleteRacket,
  upsertRacketStringPreference,
  deleteRacketStringPreference,
} from "@/lib/actions";
import {
  Plus,
  Archive,
  ArchiveRestore,
  Pencil,
  Trash2,
  ChevronDown,
  X,
} from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { usePlayer } from "@/contexts/player-context";
import { PlayerPicker } from "@/components/player-picker";
import { cn } from "@/lib/utils";

type StringPreference = {
  id: string;
  priority: number;
  stringBrand: string;
  stringModel: string;
  tension: number | null;
  reason: string | null;
};

type RacketWithRelations = {
  id: string;
  brand: string;
  model: string;
  weightClass: string;
  balancePoint: string;
  stiffness: string;
  gripSize: string;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  photoUrl: string | null;
  notes: string | null;
  role: string | null;
  isArchived: boolean;
  playerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  playSessions: { id: string; durationMinutes: number; date: Date }[];
  stringings: { id: string; date: Date }[];
  stringPreferences: StringPreference[];
};

const BRANDS = ["Yonex", "Victor", "Li-Ning", "Apacs", "Babolat", "Carlton", "Ashaway", "Other"];
const WEIGHTS = ["2U (90-94g)", "3U (85-89g)", "4U (80-84g)", "5U (75-79g)", "6U (70-74g)", "F (73g)"];
const BALANCE = ["Head-heavy", "Even", "Head-light"];
const STIFFNESS = ["Flexible", "Medium", "Stiff", "Extra Stiff"];
const GRIPS = ["G4 (3.5\")", "G5 (3.25\")", "G6 (3.0\")"];

export const ROLES = ["Primary", "Secondary", "Backup 1", "Backup 2"] as const;
export type RacketRole = typeof ROLES[number];

const ROLE_STYLES: Record<RacketRole, string> = {
  "Primary":   "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Secondary": "bg-blue-100 text-blue-800 border-blue-300",
  "Backup 1":  "bg-green-100 text-green-800 border-green-300",
  "Backup 2":  "bg-gray-100 text-gray-700 border-gray-300",
};

const emptyForm = {
  brand: "Yonex",
  model: "",
  weightClass: "4U (80-84g)",
  balancePoint: "Head-heavy",
  stiffness: "Stiff",
  gripSize: "G5 (3.25\")",
  purchaseDate: "",
  purchasePrice: "",
  notes: "",
  playerId: "",
};

function lbsToKg(lbs: number): string {
  return (lbs * 0.453592).toFixed(1);
}

function RolePicker({ racket }: { racket: RacketWithRelations }) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  function handleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Dropdown is ~160px tall; open upward if less than 180px to bottom of viewport
      setOpenUpward(rect.bottom + 180 > window.innerHeight);
    }
    setOpen((o) => !o);
  }

  async function setRole(role: RacketRole | null) {
    setOpen(false);
    await updateRacket(racket.id, { role });
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors",
          racket.role
            ? ROLE_STYLES[racket.role as RacketRole]
            : "bg-background text-muted-foreground border-input hover:bg-accent"
        )}
      >
        {racket.role ?? "Set role"}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={cn(
            "absolute left-0 z-20 w-36 rounded-md border bg-popover shadow-md py-1",
            openUpward ? "bottom-7" : "top-7"
          )}>
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-2",
                  racket.role === r && "font-semibold"
                )}
              >
                <span className={cn("inline-block w-2 h-2 rounded-full border", ROLE_STYLES[r])} />
                {r}
              </button>
            ))}
            <div className="border-t my-1" />
            <button
              type="button"
              onClick={() => setRole(null)}
              className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
            >
              Remove role
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// One row per string preference priority. Renders two <tr> elements as a fragment.
function RacketRows({
  racket: r,
  fmt,
  onEdit,
  onDelete,
  onToggleArchive,
}: {
  racket: RacketWithRelations;
  fmt: (n: number) => string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleArchive: () => void;
}) {
  type PrefRow = { brand: string; model: string; tension: string; reason: string };

  const [rows, setRows] = useState<[PrefRow, PrefRow]>([
    {
      brand:   r.stringPreferences.find((p) => p.priority === 1)?.stringBrand ?? "",
      model:   r.stringPreferences.find((p) => p.priority === 1)?.stringModel ?? "",
      tension: r.stringPreferences.find((p) => p.priority === 1)?.tension?.toString() ?? "",
      reason:  r.stringPreferences.find((p) => p.priority === 1)?.reason ?? "",
    },
    {
      brand:   r.stringPreferences.find((p) => p.priority === 2)?.stringBrand ?? "",
      model:   r.stringPreferences.find((p) => p.priority === 2)?.stringModel ?? "",
      tension: r.stringPreferences.find((p) => p.priority === 2)?.tension?.toString() ?? "",
      reason:  r.stringPreferences.find((p) => p.priority === 2)?.reason ?? "",
    },
  ]);

  function update(priority: 1 | 2, field: keyof PrefRow, value: string) {
    setRows((prev) => {
      const next: [PrefRow, PrefRow] = [{ ...prev[0] }, { ...prev[1] }];
      next[priority - 1] = { ...next[priority - 1], [field]: value };
      return next;
    });
  }

  async function saveRow(priority: 1 | 2) {
    const row = rows[priority - 1];
    if (!row.brand.trim() && !row.model.trim()) {
      await deleteRacketStringPreference(r.id, priority);
      return;
    }
    const tensionNum = row.tension ? parseFloat(row.tension) : undefined;
    await upsertRacketStringPreference(r.id, priority, {
      stringBrand: row.brand.trim(),
      stringModel: row.model.trim(),
      tension: tensionNum && !isNaN(tensionNum) ? tensionNum : undefined,
      reason: row.reason.trim() || undefined,
    });
  }

  async function clearRow(priority: 1 | 2) {
    setRows((prev) => {
      const next: [PrefRow, PrefRow] = [{ ...prev[0] }, { ...prev[1] }];
      next[priority - 1] = { brand: "", model: "", tension: "", reason: "" };
      return next;
    });
    await deleteRacketStringPreference(r.id, priority);
  }

  function prefTds(priority: 1 | 2) {
    const row = rows[priority - 1];
    const tensionLbs = row.tension ? parseFloat(row.tension) : null;
    const tensionKg = tensionLbs && !isNaN(tensionLbs) ? lbsToKg(tensionLbs) : null;
    const hasData = row.brand || row.model;

    return (
      <>
        <td className="px-3 py-1.5 text-xs text-muted-foreground border-l whitespace-nowrap">
          {priority === 1 ? "1st" : "2nd"}
        </td>
        <td className="px-2 py-1.5">
          <input
            className="w-full min-w-[80px] bg-transparent border-b border-transparent hover:border-input focus:border-primary outline-none py-0.5 text-xs"
            value={row.brand}
            placeholder="Brand…"
            onChange={(e) => update(priority, "brand", e.target.value)}
            onBlur={() => saveRow(priority)}
          />
        </td>
        <td className="px-2 py-1.5">
          <input
            className="w-full min-w-[80px] bg-transparent border-b border-transparent hover:border-input focus:border-primary outline-none py-0.5 text-xs"
            value={row.model}
            placeholder="Model…"
            onChange={(e) => update(priority, "model", e.target.value)}
            onBlur={() => saveRow(priority)}
          />
        </td>
        <td className="px-2 py-1.5">
          <input
            type="number"
            className="w-16 bg-transparent border-b border-transparent hover:border-input focus:border-primary outline-none py-0.5 text-xs"
            value={row.tension}
            placeholder="e.g. 26"
            onChange={(e) => update(priority, "tension", e.target.value)}
            onBlur={() => saveRow(priority)}
          />
        </td>
        <td className="px-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
          {tensionKg ? `${tensionKg} kg` : "—"}
        </td>
        <td className="px-2 py-1.5">
          <input
            className="w-full min-w-[100px] bg-transparent border-b border-transparent hover:border-input focus:border-primary outline-none py-0.5 text-xs"
            value={row.reason}
            placeholder="Reason…"
            onChange={(e) => update(priority, "reason", e.target.value)}
            onBlur={() => saveRow(priority)}
          />
        </td>
        <td className="px-2 py-1.5 w-5">
          {hasData && (
            <button
              type="button"
              onClick={() => clearRow(priority)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </td>
      </>
    );
  }

  const rowClass = cn("border-b border-border/40", r.isArchived && "opacity-50");

  return (
    <>
      {/* Row 1 — racket cells span 2 rows */}
      <tr className={rowClass}>
        <td className="px-4 py-2 font-medium align-middle" rowSpan={2}>
          <div>{r.brand} {r.model}</div>
          {r.isArchived && <Badge variant="secondary" className="text-xs mt-1">Archived</Badge>}
          {r.purchasePrice != null && (
            <div className="text-xs text-muted-foreground mt-0.5">{fmt(r.purchasePrice)}</div>
          )}
        </td>
        <td className="px-3 py-2 align-middle" rowSpan={2}>
          <RolePicker racket={r} />
        </td>
        <td className="px-3 py-2 text-xs text-muted-foreground align-middle whitespace-nowrap" rowSpan={2}>{r.weightClass}</td>
        <td className="px-3 py-2 text-xs text-muted-foreground align-middle whitespace-nowrap" rowSpan={2}>{r.balancePoint}</td>
        <td className="px-3 py-2 text-xs text-muted-foreground align-middle whitespace-nowrap" rowSpan={2}>{r.stiffness}</td>
        <td className="px-3 py-2 text-xs text-muted-foreground align-middle" rowSpan={2}>{r.playSessions.length}</td>
        {prefTds(1)}
        {/* Sticky actions column */}
        <td
          className="px-3 py-2 align-middle sticky right-0 bg-card border-l"
          rowSpan={2}
        >
          <div className="flex gap-0.5 items-center">
            <button
              onClick={onEdit}
              title="Edit"
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onToggleArchive}
              title={r.isArchived ? "Restore" : "Archive"}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              {r.isArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onDelete}
              title="Delete"
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {/* Row 2 — only string pref cells (racket cells covered by rowSpan) */}
      <tr className={cn(rowClass, "border-b-2")}>
        {prefTds(2)}
      </tr>
    </>
  );
}

export function RacketsClient({
  initialRackets,
}: {
  initialRackets: RacketWithRelations[];
}) {
  const searchParams = useSearchParams();
  const { fmt } = useCurrency();
  const { activePlayerId, players } = usePlayer();
  const activePlayer = activePlayerId ? players.find((p) => p.id === activePlayerId) ?? null : null;
  const [showDialog, setShowDialog] = useState(searchParams.get("new") === "true");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyBlockMsg, setHistoryBlockMsg] = useState<string | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  const rackets = initialRackets.filter((r) => showArchived || !r.isArchived);

  const assigned = ROLES.map((role) => ({
    role,
    racket: initialRackets.find((r) => r.role === role),
  }));

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, playerId: activePlayerId ?? "" });
    setShowDialog(true);
  }

  function openEdit(r: RacketWithRelations) {
    setEditingId(r.id);
    setForm({
      brand: r.brand,
      model: r.model,
      weightClass: r.weightClass,
      balancePoint: r.balancePoint,
      stiffness: r.stiffness,
      gripSize: r.gripSize,
      purchaseDate: r.purchaseDate ? new Date(r.purchaseDate).toISOString().split("T")[0] : "",
      purchasePrice: r.purchasePrice != null ? r.purchasePrice.toString() : "",
      notes: r.notes || "",
      playerId: r.playerId ?? "",
    });
    setShowDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const playerIdValue = form.playerId === "" ? null : form.playerId;
      const data = { ...form, purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined };
      if (editingId) {
        await updateRacket(editingId, { ...data, playerId: playerIdValue });
      } else {
        await createRacket({ ...data, playerId: playerIdValue ?? undefined });
      }
      setShowDialog(false);
      setForm(emptyForm);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this racket? This cannot be undone.")) return;
    const result = await deleteRacket(id);
    if (!result.ok) {
      setPendingArchiveId(id);
      setHistoryBlockMsg(result.message);
    }
  }

  async function toggleArchive(id: string, current: boolean) {
    await updateRacket(id, { isArchived: !current });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rackets</h1>
          <p className="text-muted-foreground mt-1">Manage your racket collection</p>
          {activePlayer && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: activePlayer.avatarColor }} />
              Showing data for <strong>{activePlayer.name}</strong>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Racket
          </Button>
        </div>
      </div>

      {/* Role summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {assigned.map(({ role, racket: r }) => (
          <div key={role} className={cn("rounded-lg border px-3 py-2 text-sm", ROLE_STYLES[role])}>
            <p className="font-semibold text-xs uppercase tracking-wide opacity-70">{role}</p>
            <p className="mt-0.5 font-medium truncate">
              {r ? `${r.brand} ${r.model}` : <span className="italic opacity-50">Unassigned</span>}
            </p>
          </div>
        ))}
      </div>

      {rackets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No rackets yet</p>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add your first racket</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3 font-medium">Racket</th>
                <th className="text-left px-3 py-3 font-medium">Role</th>
                <th className="text-left px-3 py-3 font-medium">Weight</th>
                <th className="text-left px-3 py-3 font-medium">Balance</th>
                <th className="text-left px-3 py-3 font-medium">Stiffness</th>
                <th className="text-left px-3 py-3 font-medium">Sessions</th>
                <th className="text-left px-3 py-3 font-medium border-l">Pref</th>
                <th className="text-left px-3 py-3 font-medium">Brand</th>
                <th className="text-left px-3 py-3 font-medium">Model</th>
                <th className="text-left px-3 py-3 font-medium">lbs</th>
                <th className="text-left px-3 py-3 font-medium">kg</th>
                <th className="text-left px-3 py-3 font-medium">Reason</th>
                <th className="px-3 py-3 w-5" />
                <th className="px-3 py-3 sticky right-0 bg-muted/40" />
              </tr>
            </thead>
            <tbody>
              {rackets.map((r) => (
                <RacketRows
                  key={r.id}
                  racket={r}
                  fmt={fmt}
                  onEdit={() => openEdit(r)}
                  onDelete={() => handleDelete(r.id)}
                  onToggleArchive={() => toggleArchive(r.id, r.isArchived)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Racket" : "Add New Racket"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PlayerPicker
              value={form.playerId === "" ? null : form.playerId}
              onChange={(id) => setForm({ ...form, playerId: id ?? "" })}
              players={players}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select id="brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
                  {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. Astrox 100ZZ" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Select id="weight" value={form.weightClass} onChange={(e) => setForm({ ...form, weightClass: e.target.value })}>
                  {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <Select id="balance" value={form.balancePoint} onChange={(e) => setForm({ ...form, balancePoint: e.target.value })}>
                  {BALANCE.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stiffness">Stiffness</Label>
                <Select id="stiffness" value={form.stiffness} onChange={(e) => setForm({ ...form, stiffness: e.target.value })}>
                  {STIFFNESS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grip">Grip Size</Label>
                <Select id="grip" value={form.gripSize} onChange={(e) => setForm({ ...form, gripSize: e.target.value })}>
                  {GRIPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date (optional)</Label>
                <Input id="purchaseDate" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price (optional)</Label>
                <Input id="purchasePrice" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="e.g. 150" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Custom observations..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : editingId ? "Update" : "Add Racket"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Blocked-delete dialog — shown when racket has history */}
      {historyBlockMsg && (
        <Dialog open={!!historyBlockMsg} onOpenChange={() => { setHistoryBlockMsg(null); setPendingArchiveId(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cannot delete — racket has history</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{historyBlockMsg}</p>
            <div className="flex flex-col gap-2 mt-3">
              <Button
                onClick={async () => {
                  if (pendingArchiveId) await updateRacket(pendingArchiveId, { isArchived: true });
                  setHistoryBlockMsg(null);
                  setPendingArchiveId(null);
                }}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive this racket instead
              </Button>
              <Button variant="outline" onClick={() => { setHistoryBlockMsg(null); setPendingArchiveId(null); }}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
