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
import { createShuttle, updateShuttle, deleteShuttle } from "@/lib/actions";
import { Plus, Pencil, Trash2, Feather } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

type Shuttle = {
  id: string;
  brand: string;
  model: string | null;
  type: string;
  speed: string | null;
  quantity: number | null;
  price: number | null;
  purchaseDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const SHUTTLE_BRANDS = ["Yonex", "Victor", "Li-Ning", "RSL", "Mavis", "Carlton", "Other"];
const SHUTTLE_TYPES = ["Feather", "Nylon", "Hybrid"];
const SHUTTLE_SPEEDS = ["75", "76", "77", "78", "Slow", "Medium", "Fast"];

const emptyForm = {
  brand: "Yonex",
  model: "",
  type: "Feather",
  speed: "",
  quantity: "",
  price: "",
  purchaseDate: "",
  notes: "",
};

export function ShuttlesClient({
  initialShuttles,
}: {
  initialShuttles: Shuttle[];
}) {
  const { fmt } = useCurrency();
  const searchParams = useSearchParams();
  const [showDialog, setShowDialog] = useState(searchParams.get("new") === "true");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(s: Shuttle) {
    setEditingId(s.id);
    setForm({
      brand: s.brand,
      model: s.model || "",
      type: s.type,
      speed: s.speed || "",
      quantity: s.quantity != null ? s.quantity.toString() : "",
      price: s.price != null ? s.price.toString() : "",
      purchaseDate: s.purchaseDate
        ? new Date(s.purchaseDate).toISOString().split("T")[0]
        : "",
      notes: s.notes || "",
    });
    setShowDialog(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        brand: form.brand,
        model: form.model || undefined,
        type: form.type,
        speed: form.speed || undefined,
        quantity: form.quantity ? parseInt(form.quantity) : undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        purchaseDate: form.purchaseDate || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await updateShuttle(editingId, data);
      } else {
        await createShuttle(data);
      }
      setShowDialog(false);
      setForm(emptyForm);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this shuttle entry?")) return;
    await deleteShuttle(id);
  }

  const totalSpent = initialShuttles.reduce(
    (sum, s) => sum + ((s.price ?? 0) * (s.quantity ?? 1)),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shuttles</h1>
          <p className="text-muted-foreground mt-1">
            Track your shuttlecock inventory and spend
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Shuttle
        </Button>
      </div>

      {initialShuttles.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{initialShuttles.length} entries</span>
          <span>Total spent: <strong className="text-foreground">{fmt(totalSpent)}</strong></span>
        </div>
      )}

      {initialShuttles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Feather className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No shuttles tracked yet</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first shuttle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initialShuttles.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {s.brand}{s.model ? ` ${s.model}` : ""}
                    </CardTitle>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant="outline">{s.type}</Badge>
                      {s.speed && <Badge variant="secondary">Speed {s.speed}</Badge>}
                    </div>
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
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {s.quantity != null && (
                    <div>
                      <span className="text-muted-foreground">Qty:</span>{" "}
                      {s.quantity}
                    </div>
                  )}
                  {s.price != null && (
                    <div>
                      <span className="text-muted-foreground">Price:</span>{" "}
                      {fmt(s.price)}
                    </div>
                  )}
                  {s.price != null && s.quantity != null && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Total:</span>{" "}
                      {fmt(s.price * s.quantity)}
                    </div>
                  )}
                  {s.purchaseDate && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Bought:</span>{" "}
                      {new Date(s.purchaseDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {s.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {s.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Shuttle" : "Add Shuttle"}</DialogTitle>
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
                  {SHUTTLE_BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model (optional)</Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="e.g. AS-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {SHUTTLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="speed">Speed (optional)</Label>
                <Select
                  id="speed"
                  value={form.speed}
                  onChange={(e) => setForm({ ...form, speed: e.target.value })}
                >
                  <option value="">— select —</option>
                  {SHUTTLE_SPEEDS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (optional)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per tube (optional)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 25"
                />
              </div>
            </div>
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
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Durability, flight quality, conditions..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update" : "Add Shuttle"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
