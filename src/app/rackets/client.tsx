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
  Star,
  Archive,
  ArchiveRestore,
  Pencil,
  Trash2,
} from "lucide-react";

type RacketWithRelations = {
  id: string;
  brand: string;
  model: string;
  weightClass: string;
  balancePoint: string;
  stiffness: string;
  gripSize: string;
  purchaseDate: Date | null;
  photoUrl: string | null;
  notes: string | null;
  isPrimary: boolean;
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

const emptyForm = {
  brand: "Yonex",
  model: "",
  weightClass: "4U (80-84g)",
  balancePoint: "Head-heavy",
  stiffness: "Stiff",
  gripSize: "G5 (3.25\")",
  purchaseDate: "",
  notes: "",
};

export function RacketsClient({
  initialRackets,
}: {
  initialRackets: RacketWithRelations[];
}) {
  const searchParams = useSearchParams();
  const [showDialog, setShowDialog] = useState(searchParams.get("new") === "true");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);

  const rackets = initialRackets.filter(
    (r) => showArchived || !r.isArchived
  );

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
      notes: r.notes || "",
    });
    setShowDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateRacket(editingId, form);
      } else {
        await createRacket(form);
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

  async function togglePrimary(id: string, current: boolean) {
    await updateRacket(id, { isPrimary: !current });
  }

  async function toggleArchive(id: string, current: boolean) {
    await updateRacket(id, { isArchived: !current });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rackets</h1>
          <p className="text-muted-foreground mt-1">
            Manage your racket collection
          </p>
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
            <Card
              key={r.id}
              className={r.isArchived ? "opacity-60" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {r.brand} {r.model}
                    </CardTitle>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {r.isPrimary && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Primary
                        </Badge>
                      )}
                      {r.isArchived && (
                        <Badge variant="secondary">Archived</Badge>
                      )}
                      <Badge variant="outline">{r.weightClass}</Badge>
                      <Badge variant="outline">{r.stiffness}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => togglePrimary(r.id, r.isPrimary)}
                      title={r.isPrimary ? "Remove primary" : "Set as primary"}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          r.isPrimary ? "fill-yellow-400 text-yellow-400" : ""
                        }`}
                      />
                    </Button>
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
                      r.playSessions.reduce((s, x) => s + x.durationMinutes, 0) /
                        60 *
                        10
                    ) / 10}
                  </div>
                </div>
                {r.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {r.notes}
                  </p>
                )}
                <div className="flex gap-1 mt-3 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleArchive(r.id, r.isArchived)}
                  >
                    {r.isArchived ? (
                      <>
                        <ArchiveRestore className="h-3 w-3 mr-1" />
                        Restore
                      </>
                    ) : (
                      <>
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </>
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
            <DialogTitle>
              {editingId ? "Edit Racket" : "Add New Racket"}
            </DialogTitle>
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
                  onChange={(e) =>
                    setForm({ ...form, weightClass: e.target.value })
                  }
                >
                  {WEIGHTS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <Select
                  id="balance"
                  value={form.balancePoint}
                  onChange={(e) =>
                    setForm({ ...form, balancePoint: e.target.value })
                  }
                >
                  {BALANCE.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stiffness">Stiffness</Label>
                <Select
                  id="stiffness"
                  value={form.stiffness}
                  onChange={(e) =>
                    setForm({ ...form, stiffness: e.target.value })
                  }
                >
                  {STIFFNESS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grip">Grip Size</Label>
                <Select
                  id="grip"
                  value={form.gripSize}
                  onChange={(e) =>
                    setForm({ ...form, gripSize: e.target.value })
                  }
                >
                  {GRIPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date (optional)</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm({ ...form, purchaseDate: e.target.value })
                }
              />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
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
