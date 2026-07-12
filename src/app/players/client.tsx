"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPlayer, updatePlayer, deletePlayer } from "@/lib/actions";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Player = {
  id: string;
  name: string;
  avatarColor: string;
  notes: string | null;
};

const AVATAR_COLORS = [
  "#6366f1", "#3b82f6", "#22c55e", "#f59e0b",
  "#ef4444", "#8b5cf6", "#06b6d4", "#f97316",
];

const emptyForm = { name: "", avatarColor: AVATAR_COLORS[0], notes: "" };

export function PlayersClient({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Block message when deletePlayer returns HAS_DATA
  const [blockMsg, setBlockMsg] = useState<string | null>(null);

  // Pending delete confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeletePlayer = players.find((p) => p.id === pendingDeleteId);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowFormDialog(true);
  }

  function openEdit(p: Player) {
    setEditingId(p.id);
    setForm({ name: p.name, avatarColor: p.avatarColor, notes: p.notes ?? "" });
    setShowFormDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updatePlayer(editingId, form);
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? { ...p, name: form.name, avatarColor: form.avatarColor, notes: form.notes || null }
              : p
          )
        );
      } else {
        const result = await createPlayer(form);
        setPlayers((prev) => [
          ...prev,
          {
            id: result.player.id,
            name: result.player.name,
            avatarColor: result.player.avatarColor,
            notes: result.player.notes,
          },
        ]);
      }
      setShowFormDialog(false);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    const result = await deletePlayer(id);
    if (result.ok) {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    } else {
      setBlockMsg(result.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground mt-1">
            Manage sub-profiles — track equipment and sessions per player
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Player
        </Button>
      </div>

      {players.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-2">No sub-profiles yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add a player to track a family member&apos;s or training partner&apos;s equipment separately.
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add first player
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {players.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.notes && (
                      <p className="text-xs text-muted-foreground">{p.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setPendingDeleteId(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete player?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{pendingDeletePlayer?.name}</span>?
            This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete blocked dialog — shown when player has data */}
      <Dialog open={!!blockMsg} onOpenChange={(open) => { if (!open) setBlockMsg(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot delete player</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{blockMsg}</p>
          <div className="flex justify-end mt-2">
            <Button variant="outline" onClick={() => setBlockMsg(null)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Player" : "Add Player"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Name</Label>
              <Input
                id="player-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder='e.g. "Arjun"'
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Avatar Colour</Label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      form.avatarColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm({ ...form, avatarColor: color })}
                    aria-label={`Select color ${color}`}
                    aria-pressed={form.avatarColor === color}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-notes">Notes (optional)</Label>
              <Textarea
                id="player-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder='e.g. "U15 training"'
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFormDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update" : "Add Player"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
