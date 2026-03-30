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
import { createSession, updateSession, deleteSession } from "@/lib/actions";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

type SessionWithRacket = {
  id: string;
  date: Date;
  sessionType: string;
  durationMinutes: number;
  racketId: string;
  racket: { id: string; brand: string; model: string };
  performanceNotes: string | null;
  controlRating: number | null;
  powerRating: number | null;
  comfortRating: number | null;
  courtCost: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type Racket = {
  id: string;
  brand: string;
  model: string;
  role: string | null;
  isArchived: boolean;
  playSessions: { id: string; durationMinutes: number }[];
  stringings: { id: string; date: Date }[];
};

const SESSION_TYPES = ["Match", "Practice", "Training"];

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1"
          >
            <Star
              className={`h-4 w-4 ${
                n <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SessionsClient({
  initialSessions,
  rackets,
  lastSession,
}: {
  initialSessions: SessionWithRacket[];
  rackets: Racket[];
  lastSession: SessionWithRacket | null;
}) {
  const { fmt } = useCurrency();
  const searchParams = useSearchParams();
  const now = new Date();
  const defaultRacket =
    lastSession?.racketId ||
    rackets.find((r) => r.role === "Primary")?.id ||
    rackets[0]?.id ||
    "";

  const emptyForm = {
    date: now.toISOString().slice(0, 16),
    sessionType: lastSession?.sessionType || "Practice",
    durationMinutes: lastSession?.durationMinutes?.toString() || "60",
    racketId: defaultRacket,
    performanceNotes: "",
    controlRating: 3,
    powerRating: 3,
    comfortRating: 3,
    courtCost: "",
  };

  const [showDialog, setShowDialog] = useState(
    searchParams.get("new") === "true"
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const filteredSessions =
    filter === "all"
      ? initialSessions
      : initialSessions.filter((s) => s.sessionType === filter);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(s: SessionWithRacket) {
    setEditingId(s.id);
    setForm({
      date: new Date(s.date).toISOString().slice(0, 16),
      sessionType: s.sessionType,
      durationMinutes: s.durationMinutes.toString(),
      racketId: s.racketId,
      performanceNotes: s.performanceNotes || "",
      controlRating: s.controlRating || 3,
      powerRating: s.powerRating || 3,
      comfortRating: s.comfortRating || 3,
      courtCost: s.courtCost != null ? s.courtCost.toString() : "",
    });
    setShowDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        date: form.date,
        sessionType: form.sessionType,
        durationMinutes: parseInt(form.durationMinutes),
        racketId: form.racketId,
        performanceNotes: form.performanceNotes || undefined,
        controlRating: form.controlRating,
        powerRating: form.powerRating,
        comfortRating: form.comfortRating,
        courtCost: form.courtCost ? parseFloat(form.courtCost) : undefined,
      };
      if (editingId) {
        await updateSession(editingId, data);
      } else {
        await createSession(data);
      }
      setShowDialog(false);
      setForm(emptyForm);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session?")) return;
    await deleteSession(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Log and review your play sessions
          </p>
        </div>
        <Button onClick={openCreate} disabled={rackets.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Log Session
        </Button>
      </div>

      {rackets.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Add a racket first before logging sessions.
            </p>
          </CardContent>
        </Card>
      )}

      {rackets.length > 0 && (
        <>
          {/* Filter */}
          <div className="flex gap-2">
            {["all", ...SESSION_TYPES].map((t) => (
              <Button
                key={t}
                variant={filter === t ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(t)}
              >
                {t === "all" ? "All" : t}
              </Button>
            ))}
          </div>

          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No sessions logged yet</p>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log your first session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((s) => (
                <Card key={s.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge
                          variant={
                            s.sessionType === "Match"
                              ? "default"
                              : s.sessionType === "Training"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {s.sessionType}
                        </Badge>
                        <span className="font-medium">
                          {s.racket.brand} {s.racket.model}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {s.durationMinutes} min
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(s.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {s.courtCost != null && s.courtCost > 0 && (
                          <span className="text-sm text-muted-foreground">
                            Court: {fmt(s.courtCost)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
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
                    {(s.controlRating || s.powerRating || s.comfortRating) && (
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {s.controlRating && (
                          <span>Control: {"★".repeat(s.controlRating)}{"☆".repeat(5 - s.controlRating)}</span>
                        )}
                        {s.powerRating && (
                          <span>Power: {"★".repeat(s.powerRating)}{"☆".repeat(5 - s.powerRating)}</span>
                        )}
                        {s.comfortRating && (
                          <span>Comfort: {"★".repeat(s.comfortRating)}{"☆".repeat(5 - s.comfortRating)}</span>
                        )}
                      </div>
                    )}
                    {s.performanceNotes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.performanceNotes}
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
              {editingId ? "Edit Session" : "Log Session"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  id="type"
                  value={form.sessionType}
                  onChange={(e) =>
                    setForm({ ...form, sessionType: e.target.value })
                  }
                >
                  {SESSION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="480"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="racket">Racket</Label>
                <Select
                  id="racket"
                  value={form.racketId}
                  onChange={(e) =>
                    setForm({ ...form, racketId: e.target.value })
                  }
                >
                  {rackets.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.brand} {r.model} {r.role === "Primary" ? "(Primary)" : ""}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <RatingInput
                label="Control"
                value={form.controlRating}
                onChange={(v) => setForm({ ...form, controlRating: v })}
              />
              <RatingInput
                label="Power"
                value={form.powerRating}
                onChange={(v) => setForm({ ...form, powerRating: v })}
              />
              <RatingInput
                label="Comfort"
                value={form.comfortRating}
                onChange={(v) => setForm({ ...form, comfortRating: v })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.performanceNotes}
                onChange={(e) =>
                  setForm({ ...form, performanceNotes: e.target.value })
                }
                placeholder="How did it feel? Any observations..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courtCost">Court Cost (optional)</Label>
              <Input
                id="courtCost"
                type="number"
                min="0"
                step="0.01"
                value={form.courtCost}
                onChange={(e) => setForm({ ...form, courtCost: e.target.value })}
                placeholder="e.g. 10"
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
                  : "Log Session"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
