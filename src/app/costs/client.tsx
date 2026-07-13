"use client";

import { useState } from "react";
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
import { createRecurringCost, updateRecurringCost, deleteRecurringCost } from "@/lib/actions";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { PlayerPicker } from "@/components/player-picker";

type RecurringCost = {
  id: string;
  type: string;
  name: string;
  billingCycle: string;
  amount: number;
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
  playerId: string | null;
};

const TYPE_OPTIONS = ["Club", "Coaching", "Shuttles", "Other"];
const CYCLE_OPTIONS = ["Monthly", "Quarterly", "Annual"];

const TYPE_STYLES: Record<string, string> = {
  Club:     "bg-blue-100 text-blue-800 border-blue-300",
  Coaching: "bg-purple-100 text-purple-800 border-purple-300",
  Shuttles: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Other:    "bg-gray-100 text-gray-700 border-gray-300",
};

function isActive(cost: RecurringCost): boolean {
  const now = new Date();
  return new Date(cost.startDate) <= now && (!cost.endDate || new Date(cost.endDate) >= now);
}

export function CostsClient({
  initialCosts,
  players = [],
  initialPlayerId = null,
}: {
  initialCosts: RecurringCost[];
  players?: { id: string; name: string; avatarColor: string }[];
  initialPlayerId?: string | null;
}) {
  const { fmt } = useCurrency();
  const activePlayer = initialPlayerId ? players.find((p) => p.id === initialPlayerId) ?? null : null;
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emptyForm = {
    type: "Club",
    name: "",
    billingCycle: "Monthly",
    amount: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
    playerId: "",
  };
  const [form, setForm] = useState(emptyForm);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, playerId: initialPlayerId ?? "" });
    setShowDialog(true);
  }

  function openEdit(c: RecurringCost) {
    setEditingId(c.id);
    setForm({
      type: c.type,
      name: c.name,
      billingCycle: c.billingCycle,
      amount: c.amount.toString(),
      startDate: new Date(c.startDate).toISOString().split("T")[0],
      endDate: c.endDate ? new Date(c.endDate).toISOString().split("T")[0] : "",
      notes: c.notes || "",
      playerId: c.playerId ?? "",
    });
    setShowDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);
    try {
      const playerIdValue = form.playerId === "" ? null : form.playerId;
      const data = {
        type: form.type,
        name: form.name,
        billingCycle: form.billingCycle,
        amount: parseFloat(form.amount),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await updateRecurringCost(editingId, { ...data, playerId: playerIdValue });
      } else {
        const result = await createRecurringCost({ ...data, playerId: playerIdValue ?? undefined });
        if (!result.ok) {
          setSubmitError(result.error);
          return;
        }
      }
      setShowDialog(false);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this recurring cost?")) return;
    await deleteRecurringCost(id);
  }

  const activeCosts = initialCosts.filter(isActive);
  const monthlyTotal = activeCosts.reduce((sum, c) => {
    if (c.billingCycle === "Monthly")   return sum + c.amount;
    if (c.billingCycle === "Quarterly") return sum + c.amount / 3;
    return sum + c.amount / 12; // Annual
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Costs</h1>
          <p className="text-muted-foreground mt-1">Club memberships and coaching subscriptions</p>
          {activePlayer && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: activePlayer.avatarColor }} />
              Showing data for <strong>{activePlayer.name}</strong>
            </p>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Cost
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeCosts.length}</div>
            <p className="text-xs text-muted-foreground">Active Subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{fmt(Math.round(monthlyTotal * 100) / 100)}</div>
            <p className="text-xs text-muted-foreground">Monthly Equivalent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{fmt(Math.round(monthlyTotal * 12 * 100) / 100)}</div>
            <p className="text-xs text-muted-foreground">Annual Equivalent</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {initialCosts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No recurring costs yet</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first cost
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {initialCosts.map((c) => (
            <Card key={c.id} className={!isActive(c) ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={TYPE_STYLES[c.type] ?? TYPE_STYLES.Other}>
                      {c.type}
                    </Badge>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {fmt(c.amount)} / {c.billingCycle.toLowerCase()}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(c.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      {c.endDate && ` → ${new Date(c.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                    </span>
                    {!isActive(c) && <Badge variant="secondary">Ended</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Recurring Cost" : "Add Recurring Cost"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PlayerPicker
              value={form.playerId === "" ? null : form.playerId}
              onChange={(id) => setForm({ ...form, playerId: id ?? "" })}
              players={players}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
                  {CYCLE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name / Description</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder='e.g. "Badminton Club ABC" or "Coaching with Ravi"'
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="e.g. 50"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any details..."
              />
            </div>
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update" : "Add Cost"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
