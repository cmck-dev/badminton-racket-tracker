"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/lib/actions";
import {
  Plus,
  Archive,
  ArchiveRestore,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { cn } from "@/lib/utils";

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
  createdAt: Date;
  updatedAt: Date;
  playSessions: { id: string; durationMinutes: number; date: Date }[];
  stringings: { id: string; date: Date }[];
};

const BRANDS = ["Yonex", "Victor", "Li-Ning", "Apacs", "Babolat", "Carlton", "Ashaway", "Other"];
const WEIGHTS = ["2U (90-94g)", "3U (85-89g)", "4U (80-84g)", "5U (75-79g)", "6U (70-74g)", "F (73g)"];
const BALANCE = ["Head-heavy", "Even", "Head-light"];
const STIFFNESS = ["Flexible", "Medium", "Stiff", "Extra Stiff"];
const GRIPS = ["G4 (3.5\")", "G5 (3.25\")", "G6 (3.0\")"];

export const ROLES = ["Primary", "Secondary", "Backup 1", "Backup 2"] as const;
export type RacketRole = typeof ROLES[number];

const ROLE_STYLES: Record<RacketRole, string> = {
  "Primary":  "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Secondary": "bg-blue-100 text-blue-800 border-blue-300",
  "Backup 1": "bg-green-100 text-green-800 border-green-300",
  "Backup 2": "bg-gray-100 text-gray-700 border-gray-300",
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
};

function RolePicker({ racket }: { racket: RacketWithRelations }) {
  const [open, setOpen] = useState(false);

  async function setRole(role: RacketRole | null) {
    setOpen(false);
    await updateRacket(racket.id, { role });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
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
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 w-36 rounded-md border bg-popover shadow-md py-1">
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
                <span
                  className={cn(
                    "inline-block w-2 h-2 rounded-full border",
                    ROLE_STYLES[r]
                  )}
                />
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

export function RacketsClient({
  initialRackets,
}: {
  initialRackets: RacketWithRelations[];
}) {
  const searchParams = useSearchParams();
  const { fmt } = useCurrency();
  const [showDialog, setShowDialog] = useState(searchParams.get("new") === "true");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);

  const rackets = initialRackets.filter((r) => showArchived || !r.isArchived);

  // Role summary bar
  const assigned = ROLES.map((role) => ({
    role,
    racket: initialRackets.find((r) => r.role === role),
  }));

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
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
      purchaseDate: r.purchaseDate
        ? new Date(r.purchaseDate).toISOString().split("T")[0]
        : "",
      purchasePrice: r.purchasePrice != null ? r.purchasePrice.toString() : "",
      notes: r.notes || "",
    });
    setShowDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
      };
      if (editingId) {
        await updateRacket(editingId, data);
      } else {
        await createRacket(data);
      }
      setShowDialog(false);
      setForm(emptyForm);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this racket and all its sessions/stringing records?")) return;
    await deleteRacket(id);
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
          <div
            key={role}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              ROLE_STYLES[role]
            )}
          >
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
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first racket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rackets.map((r) => (
            <Card key={r.id} className={r.isArchived ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <CardTitle className="text-lg truncate">
                      {r.brand} {r.model}
                    </CardTitle>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
                      <RolePicker racket={r} />
                      {r.isArchived && <Badge variant="secondary">Archived</Badge>}
                      <Badge variant="outline">{r.weightClass}</Badge>
                      <Badge variant="outline">{r.stiffness}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(r)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Balance:</span>{" "}
                    {r.balancePoint}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grip:</span>{" "}
                    {r.gripSize}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sessions:</span>{" "}
                    {r.playSessions.length}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hours:</span>{" "}
                    {Math.round(
                      r.playSessions.reduce((s, x) => s + x.durationMinutes, 0) / 60 * 10
                    ) / 10}
                  </div>
                  {r.purchasePrice != null && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Purchased:</span>{" "}
                      {fmt(r.purchasePrice)}
                    </div>
                  )}
                </div>
                {r.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.notes}</p>
                )}
                <div className="flex gap-1 mt-3 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleArchive(r.id, r.isArchived)}
                  >
                    {r.isArchived ? (
                      <><ArchiveRestore className="h-3 w-3 mr-1" />Restore</>
                    ) : (
                      <><Archive className="h-3 w-3 mr-1" />Archive</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Racket" : "Add New Racket"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                >
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="e.g. Astrox 100ZZ"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Select
                  id="weight"
                  value={form.weightClass}
                  onChange={(e) => setForm({ ...form, weightClass: e.target.value })}
                >
                  {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <Select
                  id="balance"
                  value={form.balancePoint}
                  onChange={(e) => setForm({ ...form, balancePoint: e.target.value })}
                >
                  {BALANCE.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stiffness">Stiffness</Label>
                <Select
                  id="stiffness"
                  value={form.stiffness}
                  onChange={(e) => setForm({ ...form, stiffness: e.target.value })}
                >
                  {STIFFNESS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grip">Grip Size</Label>
                <Select
                  id="grip"
                  value={form.gripSize}
                  onChange={(e) => setForm({ ...form, gripSize: e.target.value })}
                >
                  {GRIPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date (optional)</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price (optional)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                  placeholder="e.g. 150"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Custom observations..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update" : "Add Racket"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
