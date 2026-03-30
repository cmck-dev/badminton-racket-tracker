"use client";

import { useState } from "react";
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
  createStringing,
  updateStringing,
  deleteStringing,
} from "@/lib/actions";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

type StringingWithRacket = {
  id: string;
  date: Date;
  racketId: string;
  racket: { id: string; brand: string; model: string };
  stringBrand: string;
  stringModel: string;
  tensionMain: number;
  tensionCross: number;
  stringer: string | null;
  cost: number | null;
  brokeAfter: number | null;
  durabilityNotes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Racket = {
  id: string;
  brand: string;
  model: string;
  isPrimary: boolean;
  isArchived: boolean;
  playSessions: { id: string; durationMinutes: number }[];
  stringings: { id: string; date: Date }[];
};

const STRING_BRANDS = [
  "Yonex",
  "Victor",
  "Li-Ning",
  "Ashaway",
  "Gosen",
  "Kizuna",
  "Other",
];

const POPULAR_STRINGS: Record<string, string[]> = {
  Yonex: ["BG65", "BG65 Ti", "BG66 Ultimax", "BG80", "BG80 Power", "Aerobite", "Aerobite Boost", "Nanogy 98", "Nanogy 99", "Exbolt 63", "Exbolt 65"],
  Victor: ["VBS-66N", "VBS-68P", "VBS-70"],
  "Li-Ning": ["No.1", "No.5", "No.7"],
  Ashaway: ["ZyMax 62 Fire", "ZyMax 66 Fire", "ZyMax 69 Fire", "Rally 21"],
  Gosen: ["G-Tone 5", "G-Tone 9"],
  Kizuna: ["Z58", "Z63", "Z68"],
  Other: [],
};

export function StringingClient({
  initialStringings,
  rackets,
}: {
  initialStringings: StringingWithRacket[];
  rackets: Racket[];
}) {
  const { fmt } = useCurrency();
  const searchParams = useSearchParams();
  const [showDialog, setShowDialog] = useState(
    searchParams.get("new") === "true"
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [racketFilter, setRacketFilter] = useState("all");

  const lastStringing = initialStringings[0];
  const emptyForm = {
    date: new Date().toISOString().split("T")[0],
    racketId:
      rackets.find((r) => r.isPrimary)?.id || rackets[0]?.id || "",
    stringBrand: lastStringing?.stringBrand || "Yonex",
    stringModel: lastStringing?.stringModel || "BG65",
    tensionMain: lastStringing?.tensionMain?.toString() || "25",
    tensionCross: lastStringing?.tensionCross?.toString() || "25",
    stringer: lastStringing?.stringer || "",
    cost: lastStringing?.cost?.toString() || "",
    durabilityNotes: "",
    brokeAfter: "",
  };

  const [form, setForm] = useState(emptyForm);

  const filteredStringings =
    racketFilter === "all"
      ? initialStringings
      : initialStringings.filter((s) => s.racketId === racketFilter);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(s: StringingWithRacket) {
    setEditingId(s.id);
    setForm({
      date: new Date(s.date).toISOString().split("T")[0],
      racketId: s.racketId,
      stringBrand: s.stringBrand,
      stringModel: s.stringModel,
      tensionMain: s.tensionMain.toString(),
      tensionCross: s.tensionCross.toString(),
      stringer: s.stringer || "",
      cost: s.cost?.toString() || "",
      durabilityNotes: s.durabilityNotes || "",
      brokeAfter: s.brokeAfter?.toString() || "",
    });
    setShowDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateStringing(editingId, {
          date: form.date,
          stringBrand: form.stringBrand,
          stringModel: form.stringModel,
          tensionMain: parseFloat(form.tensionMain),
          tensionCross: parseFloat(form.tensionCross),
          stringer: form.stringer || undefined,
          cost: form.cost ? parseFloat(form.cost) : undefined,
          durabilityNotes: form.durabilityNotes || undefined,
          brokeAfter: form.brokeAfter ? parseInt(form.brokeAfter) : null,
        });
      } else {
        await createStringing({
          date: form.date,
          racketId: form.racketId,
          stringBrand: form.stringBrand,
          stringModel: form.stringModel,
          tensionMain: parseFloat(form.tensionMain),
          tensionCross: parseFloat(form.tensionCross),
          stringer: form.stringer || undefined,
          cost: form.cost ? parseFloat(form.cost) : undefined,
          durabilityNotes: form.durabilityNotes || undefined,
        });
      }
      setShowDialog(false);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this stringing record?")) return;
    await deleteStringing(id);
  }

  const availableModels = POPULAR_STRINGS[form.stringBrand] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stringing</h1>
          <p className="text-muted-foreground mt-1">
            Track your stringing history and costs
          </p>
        </div>
        <Button onClick={openCreate} disabled={rackets.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Log Stringing
        </Button>
      </div>

      {rackets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Add a racket first before logging stringing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filter by racket */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={racketFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRacketFilter("all")}
            >
              All Rackets
            </Button>
            {rackets.map((r) => (
              <Button
                key={r.id}
                variant={racketFilter === r.id ? "default" : "outline"}
                size="sm"
                onClick={() => setRacketFilter(r.id)}
              >
                {r.brand} {r.model}
              </Button>
            ))}
          </div>

          {/* Summary cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{filteredStringings.length}</div>
                <p className="text-xs text-muted-foreground">Total Stringings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {fmt(filteredStringings.reduce((s, x) => s + (x.cost || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {filteredStringings.filter((s) => s.brokeAfter).length > 0
                    ? Math.round(
                        filteredStringings
                          .filter((s) => s.brokeAfter)
                          .reduce((s, x) => s + (x.brokeAfter || 0), 0) /
                          filteredStringings.filter((s) => s.brokeAfter).length
                      )
                    : "—"}
                </div>
                <p className="text-xs text-muted-foreground">Avg Lifespan (sessions)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {filteredStringings.filter((s) => s.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">Currently Active</p>
              </CardContent>
            </Card>
          </div>

          {/* Stringing list */}
          {filteredStringings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No stringing records yet
                </p>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log your first stringing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredStringings.map((s) => (
                <Card key={s.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        {s.isActive && (
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            Active
                          </Badge>
                        )}
                        <span className="font-medium">
                          {s.stringBrand} {s.stringModel}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {s.tensionMain}/{s.tensionCross} lbs
                        </span>
                        <span className="text-sm text-muted-foreground">
                          on {s.racket.brand} {s.racket.model}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(s.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.cost && (
                          <span className="text-sm font-medium">
                            {fmt(s.cost)}
                          </span>
                        )}
                        {s.brokeAfter && (
                          <Badge variant="outline">
                            Broke @ {s.brokeAfter} sessions
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {s.durabilityNotes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.durabilityNotes}
                      </p>
                    )}
                    {s.stringer && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Strung by: {s.stringer}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Stringing" : "Log Stringing"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-date">Date</Label>
                <Input
                  id="s-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              {!editingId && (
                <div className="space-y-2">
                  <Label htmlFor="s-racket">Racket</Label>
                  <Select
                    id="s-racket"
                    value={form.racketId}
                    onChange={(e) =>
                      setForm({ ...form, racketId: e.target.value })
                    }
                  >
                    {rackets.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.brand} {r.model}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-brand">String Brand</Label>
                <Select
                  id="s-brand"
                  value={form.stringBrand}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stringBrand: e.target.value,
                      stringModel:
                        POPULAR_STRINGS[e.target.value]?.[0] || "",
                    })
                  }
                >
                  {STRING_BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-model">String Model</Label>
                {availableModels.length > 0 ? (
                  <Select
                    id="s-model"
                    value={form.stringModel}
                    onChange={(e) =>
                      setForm({ ...form, stringModel: e.target.value })
                    }
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id="s-model"
                    value={form.stringModel}
                    onChange={(e) =>
                      setForm({ ...form, stringModel: e.target.value })
                    }
                    placeholder="String model name"
                    required
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-main">Main Tension (lbs)</Label>
                <Input
                  id="s-main"
                  type="number"
                  step="0.5"
                  min="15"
                  max="40"
                  value={form.tensionMain}
                  onChange={(e) =>
                    setForm({ ...form, tensionMain: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-cross">Cross Tension (lbs)</Label>
                <Input
                  id="s-cross"
                  type="number"
                  step="0.5"
                  min="15"
                  max="40"
                  value={form.tensionCross}
                  onChange={(e) =>
                    setForm({ ...form, tensionCross: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-stringer">Stringer (optional)</Label>
                <Input
                  id="s-stringer"
                  value={form.stringer}
                  onChange={(e) =>
                    setForm({ ...form, stringer: e.target.value })
                  }
                  placeholder="Shop / person name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-cost">Cost (optional)</Label>
                <Input
                  id="s-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="$"
                />
              </div>
            </div>
            {editingId && (
              <div className="space-y-2">
                <Label htmlFor="s-broke">
                  Broke after (sessions, leave empty if still active)
                </Label>
                <Input
                  id="s-broke"
                  type="number"
                  min="1"
                  value={form.brokeAfter}
                  onChange={(e) =>
                    setForm({ ...form, brokeAfter: e.target.value })
                  }
                  placeholder="Number of sessions"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="s-notes">Notes (optional)</Label>
              <Textarea
                id="s-notes"
                value={form.durabilityNotes}
                onChange={(e) =>
                  setForm({ ...form, durabilityNotes: e.target.value })
                }
                placeholder='e.g. "felt too tight", "lost tension quickly"'
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
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update"
                  : "Log Stringing"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
