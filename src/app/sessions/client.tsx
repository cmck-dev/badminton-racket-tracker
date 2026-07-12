"use client";

import { useState, useMemo } from "react";
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
  createSession,
  updateSession,
  deleteSession,
  getRecurringGroupCount,
  createRecurringSessions,
} from "@/lib/actions";
import { Plus, Pencil, Trash2, Star, RefreshCw } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { cn } from "@/lib/utils";

type RacketLink = {
  racket: { id: string; brand: string; model: string };
};

type SessionWithRackets = {
  id: string;
  date: Date;
  sessionType: string;
  durationMinutes: number;
  rackets: RacketLink[];
  performanceNotes: string | null;
  controlRating: number | null;
  powerRating: number | null;
  comfortRating: number | null;
  courtCost: number | null;
  recurringGroupId: string | null;
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

const SESSION_TYPES = ["Match", "Practice", "Training", "Coaching"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
          <button key={n} type="button" onClick={() => onChange(n)} className="p-1">
            <Star
              className={`h-4 w-4 ${
                n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function countRecurringDates(daysOfWeek: number[], rangeStart: Date, rangeEnd: Date): number {
  if (!daysOfWeek.length) return 0;
  let count = 0;
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  while (cursor < rangeEnd) {
    if (daysOfWeek.includes(cursor.getDay())) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function SessionsClient({
  initialSessions,
  rackets,
  lastSession,
}: {
  initialSessions: SessionWithRackets[];
  rackets: Racket[];
  lastSession: SessionWithRackets | null;
}) {
  const { fmt } = useCurrency();
  const searchParams = useSearchParams();
  const now = new Date();

  const defaultRacketIds =
    lastSession?.rackets.map((r) => r.racket.id) ??
    (rackets.find((r) => r.role === "Primary")?.id
      ? [rackets.find((r) => r.role === "Primary")!.id]
      : rackets[0]?.id
      ? [rackets[0].id]
      : []);

  const emptyForm = {
    date: now.toISOString().slice(0, 16),
    sessionType: lastSession?.sessionType || "Practice",
    durationMinutes: lastSession?.durationMinutes?.toString() || "60",
    racketIds: defaultRacketIds,
    performanceNotes: "",
    controlRating: 3,
    powerRating: 3,
    comfortRating: 3,
    courtCost: "",
  };

  const emptyRecurrence = {
    enabled: false,
    daysOfWeek: [] as number[],
    period: "month" as "month" | "year" | "custom",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    endDate: "",
  };

  const [showDialog, setShowDialog] = useState(searchParams.get("new") === "true");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [recurrence, setRecurrence] = useState(emptyRecurrence);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const [deleteTarget, setDeleteTarget] = useState<SessionWithRackets | null>(null);
  const [deleteGroupCount, setDeleteGroupCount] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredSessions =
    filter === "all"
      ? initialSessions
      : initialSessions.filter((s) => s.sessionType === filter);

  const previewCount = useMemo(() => {
    if (!recurrence.enabled || !recurrence.daysOfWeek.length) return 0;
    const year = recurrence.year ?? now.getFullYear();
    let start: Date, end: Date;
    if (recurrence.period === "month") {
      const month = (recurrence.month ?? now.getMonth() + 1) - 1;
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 1);
    } else if (recurrence.period === "year") {
      start = new Date(year, 0, 1);
      end = new Date(year + 1, 0, 1);
    } else {
      start = new Date(); start.setHours(0, 0, 0, 0);
      end = recurrence.endDate ? new Date(recurrence.endDate) : start;
      end.setHours(23, 59, 59, 999);
    }
    return countRecurringDates(recurrence.daysOfWeek, start, end);
  }, [recurrence, now]);

  function toggleDay(day: number) {
    setRecurrence((r) => ({
      ...r,
      daysOfWeek: r.daysOfWeek.includes(day)
        ? r.daysOfWeek.filter((d) => d !== day)
        : [...r.daysOfWeek, day],
    }));
  }

  function toggleRacket(id: string) {
    setForm((f) => ({
      ...f,
      racketIds: f.racketIds.includes(id)
        ? f.racketIds.filter((r) => r !== id)
        : [...f.racketIds, id],
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setRecurrence(emptyRecurrence);
    setShowDialog(true);
  }

  function openEdit(s: SessionWithRackets) {
    setEditingId(s.id);
    setForm({
      date: new Date(s.date).toISOString().slice(0, 16),
      sessionType: s.sessionType,
      durationMinutes: s.durationMinutes.toString(),
      racketIds: s.rackets.map((r) => r.racket.id),
      performanceNotes: s.performanceNotes || "",
      controlRating: s.controlRating || 3,
      powerRating: s.powerRating || 3,
      comfortRating: s.comfortRating || 3,
      courtCost: s.courtCost != null ? s.courtCost.toString() : "",
    });
    setRecurrence(emptyRecurrence);
    setShowDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.racketIds.length) {
      alert("Select at least one racket.");
      return;
    }
    setLoading(true);
    try {
      const baseData = {
        sessionType: form.sessionType,
        durationMinutes: parseInt(form.durationMinutes),
        racketIds: form.racketIds,
        performanceNotes: form.performanceNotes || undefined,
        controlRating: form.controlRating,
        powerRating: form.powerRating,
        comfortRating: form.comfortRating,
        courtCost: form.courtCost ? parseFloat(form.courtCost) : undefined,
      };

      if (editingId) {
        await updateSession(editingId, { ...baseData, date: form.date });
      } else if (recurrence.enabled) {
        if (!recurrence.daysOfWeek.length) { alert("Select at least one day."); return; }
        if (previewCount > 365) { alert(`Too many sessions (${previewCount}). Max 365.`); return; }
        const startTime = form.date.includes("T") ? form.date.split("T")[1].slice(0, 5) : "09:00";
        await createRecurringSessions(
          { ...baseData, startTime },
          {
            daysOfWeek: recurrence.daysOfWeek,
            period: recurrence.period,
            month: recurrence.period === "month" ? recurrence.month : undefined,
            year: recurrence.year,
            endDate: recurrence.period === "custom" ? recurrence.endDate : undefined,
          }
        );
      } else {
        await createSession({ ...baseData, date: form.date });
      }
      setShowDialog(false);
      setForm(emptyForm);
      setRecurrence(emptyRecurrence);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClick(s: SessionWithRackets) {
    if (s.recurringGroupId) {
      setDeleteTarget(s);
      setDeleteGroupCount(null);
      getRecurringGroupCount(s.recurringGroupId).then((n) => setDeleteGroupCount(n));
    } else {
      if (!confirm("Delete this session?")) return;
      await deleteSession(s.id);
    }
  }

  async function handleConfirmDelete(deleteGroup: boolean) {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteSession(deleteTarget.id, deleteGroup);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-1">Log and review your play sessions</p>
        </div>
        <Button onClick={openCreate} disabled={rackets.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Log Session
        </Button>
      </div>

      {rackets.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Add a racket first before logging sessions.</p>
          </CardContent>
        </Card>
      )}

      {rackets.length > 0 && (
        <>
          <div className="flex gap-2">
            {["all", ...SESSION_TYPES].map((t) => (
              <Button key={t} variant={filter === t ? "default" : "outline"} size="sm" onClick={() => setFilter(t)}>
                {t === "all" ? "All" : t}
              </Button>
            ))}
          </div>

          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No sessions logged yet</p>
                <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Log your first session</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((s) => (
                <Card key={s.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant={s.sessionType === "Match" ? "default" : s.sessionType === "Training" ? "secondary" : "outline"}>
                          {s.sessionType}
                        </Badge>
                        {s.recurringGroupId && (
                          <span title="Recurring session" className="text-muted-foreground">
                            <RefreshCw className="h-3 w-3 inline" />
                          </span>
                        )}
                        <span className="font-medium">
                          {s.rackets.map((r) => `${r.racket.brand} ${r.racket.model}`).join(", ")}
                        </span>
                        <span className="text-sm text-muted-foreground">{s.durationMinutes} min</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        {s.courtCost != null && s.courtCost > 0 && (
                          <span className="text-sm text-muted-foreground">Court: {fmt(s.courtCost)}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteClick(s)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {(s.controlRating || s.powerRating || s.comfortRating) && (
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {s.controlRating && <span>Control: {"★".repeat(s.controlRating)}{"☆".repeat(5 - s.controlRating)}</span>}
                        {s.powerRating && <span>Power: {"★".repeat(s.powerRating)}{"☆".repeat(5 - s.powerRating)}</span>}
                        {s.comfortRating && <span>Comfort: {"★".repeat(s.comfortRating)}{"☆".repeat(5 - s.comfortRating)}</span>}
                      </div>
                    )}
                    {s.performanceNotes && (
                      <p className="text-sm text-muted-foreground mt-1">{s.performanceNotes}</p>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Session" : "Log Session"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <Input id="date" type="datetime-local" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select id="type" value={form.sessionType}
                  onChange={(e) => setForm({ ...form, sessionType: e.target.value })}>
                  {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
            </div>

            {/* Racket multi-select */}
            <div className="space-y-2">
              <Label>Rackets <span className="text-muted-foreground text-xs">(select one or more)</span></Label>
              <div className="flex flex-wrap gap-2">
                {rackets.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRacket(r.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-md border text-sm font-medium transition-colors",
                      form.racketIds.includes(r.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input hover:bg-accent"
                    )}
                  >
                    {r.brand} {r.model}
                    {r.role === "Primary" && <span className="ml-1 text-xs opacity-60">(P)</span>}
                  </button>
                ))}
              </div>
              {form.racketIds.length === 0 && (
                <p className="text-xs text-destructive">Select at least one racket.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input id="duration" type="number" min="1" max="480" value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} required />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <RatingInput label="Control" value={form.controlRating} onChange={(v) => setForm({ ...form, controlRating: v })} />
              <RatingInput label="Power" value={form.powerRating} onChange={(v) => setForm({ ...form, powerRating: v })} />
              <RatingInput label="Comfort" value={form.comfortRating} onChange={(v) => setForm({ ...form, comfortRating: v })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={form.performanceNotes}
                onChange={(e) => setForm({ ...form, performanceNotes: e.target.value })}
                placeholder="How did it feel? Any observations..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courtCost">Court Cost (optional)</Label>
              <Input id="courtCost" type="number" min="0" step="0.01" value={form.courtCost}
                onChange={(e) => setForm({ ...form, courtCost: e.target.value })} placeholder="e.g. 10" />
            </div>

            {/* Recurrence — hidden when editing */}
            {!editingId && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <input id="repeat" type="checkbox" checked={recurrence.enabled}
                    onChange={(e) => setRecurrence((r) => ({ ...r, enabled: e.target.checked }))}
                    className="h-4 w-4" />
                  <Label htmlFor="repeat" className="cursor-pointer font-medium">Repeat this session</Label>
                </div>
                {recurrence.enabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Days of week</Label>
                      <div className="flex gap-1">
                        {DAYS.map((label, idx) => (
                          <button key={idx} type="button" onClick={() => toggleDay(idx)}
                            className={cn(
                              "w-9 h-9 rounded-md text-xs font-medium transition-colors",
                              recurrence.daysOfWeek.includes(idx)
                                ? "bg-primary text-primary-foreground"
                                : "border border-input bg-background hover:bg-accent"
                            )}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Period</Label>
                      <div className="flex gap-1">
                        {(["month", "year", "custom"] as const).map((p) => (
                          <button key={p} type="button"
                            onClick={() => setRecurrence((r) => ({ ...r, period: p }))}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                              recurrence.period === p
                                ? "bg-primary text-primary-foreground"
                                : "border border-input bg-background hover:bg-accent"
                            )}>
                            {p === "month" ? "This month" : p === "year" ? "This year" : "Custom"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {recurrence.period === "month" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Month</Label>
                          <Select value={recurrence.month.toString()}
                            onChange={(e) => setRecurrence((r) => ({ ...r, month: parseInt(e.target.value) }))}>
                            {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                              <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Year</Label>
                          <Input type="number" min={now.getFullYear()} max={now.getFullYear() + 5}
                            value={recurrence.year}
                            onChange={(e) => setRecurrence((r) => ({ ...r, year: parseInt(e.target.value) }))} />
                        </div>
                      </div>
                    )}
                    {recurrence.period === "year" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Year</Label>
                        <Input type="number" min={now.getFullYear()} max={now.getFullYear() + 5}
                          value={recurrence.year} className="w-32"
                          onChange={(e) => setRecurrence((r) => ({ ...r, year: parseInt(e.target.value) }))} />
                      </div>
                    )}
                    {recurrence.period === "custom" && (
                      <div className="space-y-1">
                        <Label className="text-xs">End date (inclusive)</Label>
                        <Input type="date" value={recurrence.endDate}
                          min={now.toISOString().slice(0, 10)}
                          onChange={(e) => setRecurrence((r) => ({ ...r, endDate: e.target.value }))}
                          required={recurrence.period === "custom"} />
                      </div>
                    )}
                    {previewCount > 0 && previewCount <= 365 && (
                      <p className="text-xs text-muted-foreground">
                        Will create <span className="font-semibold text-foreground">{previewCount}</span> sessions
                      </p>
                    )}
                    {previewCount > 365 && (
                      <p className="text-xs text-destructive">Too many sessions ({previewCount}). Maximum is 365.</p>
                    )}
                    {recurrence.daysOfWeek.length === 0 && (
                      <p className="text-xs text-muted-foreground">Select at least one day above.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit"
                disabled={loading || form.racketIds.length === 0 || (recurrence.enabled && (previewCount === 0 || previewCount > 365))}>
                {loading ? "Saving..." : editingId ? "Update" : recurrence.enabled ? `Create ${previewCount > 0 ? previewCount + " " : ""}Sessions` : "Log Session"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Series-delete dialog */}
      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete session</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">This session is part of a recurring series.</p>
            <div className="flex flex-col gap-2 mt-2">
              <Button variant="outline" onClick={() => handleConfirmDelete(false)} disabled={deleteLoading}>
                Delete this session only
              </Button>
              <Button variant="destructive" onClick={() => handleConfirmDelete(true)} disabled={deleteLoading}>
                Delete all {deleteGroupCount !== null ? `${deleteGroupCount} ` : ""}sessions in this series
              </Button>
            </div>
            <div className="flex justify-end mt-2">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
