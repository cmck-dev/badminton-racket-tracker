"use client";

import { useState } from "react";
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
  createFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} from "@/lib/actions";
import { Plus, Trash2, Bug, Lightbulb, MessageSquare, CheckCircle2, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackItem = {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

const TYPES = ["Bug", "Feature", "General"] as const;
const PRIORITIES = ["Low", "Medium", "High"] as const;
const STATUSES = ["Open", "In Progress", "Done"] as const;

const TYPE_ICONS = {
  Bug: Bug,
  Feature: Lightbulb,
  General: MessageSquare,
};

const TYPE_STYLES: Record<string, string> = {
  Bug: "bg-red-100 text-red-800 border-red-300",
  Feature: "bg-blue-100 text-blue-800 border-blue-300",
  General: "bg-gray-100 text-gray-700 border-gray-300",
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-green-100 text-green-700 border-green-300",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  High: "bg-red-100 text-red-700 border-red-300",
};

const STATUS_ICONS = {
  Open: Circle,
  "In Progress": Clock,
  Done: CheckCircle2,
};

const STATUS_STYLES: Record<string, string> = {
  Open: "text-muted-foreground",
  "In Progress": "text-blue-600",
  Done: "text-green-600",
};

const emptyForm = {
  type: "Bug" as string,
  priority: "Medium" as string,
  title: "",
  description: "",
};

export function FeedbackClient({
  initialFeedbacks,
}: {
  initialFeedbacks: FeedbackItem[];
}) {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = feedbacks.filter((f) => {
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    if (filterType !== "all" && f.type !== filterType) return false;
    return true;
  });

  const openCount = feedbacks.filter((f) => f.status === "Open").length;
  const inProgressCount = feedbacks.filter((f) => f.status === "In Progress").length;
  const doneCount = feedbacks.filter((f) => f.status === "Done").length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await createFeedback(form);
      setFeedbacks([created as FeedbackItem, ...feedbacks]);
      setShowDialog(false);
      setForm(emptyForm);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await updateFeedbackStatus(id, status);
    setFeedbacks(feedbacks.map((f) => (f.id === id ? { ...f, status } : f)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this feedback item?")) return;
    await deleteFeedback(id);
    setFeedbacks(feedbacks.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
          <p className="text-muted-foreground mt-1">
            Track bugs, feature requests, and ideas for future versions
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Feedback
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-3">
        <Card
          className={cn("cursor-pointer transition-colors", filterStatus === "Open" ? "ring-2 ring-primary" : "hover:bg-accent")}
          onClick={() => setFilterStatus(filterStatus === "Open" ? "all" : "Open")}
        >
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{openCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Open</p>
          </CardContent>
        </Card>
        <Card
          className={cn("cursor-pointer transition-colors", filterStatus === "In Progress" ? "ring-2 ring-primary" : "hover:bg-accent")}
          onClick={() => setFilterStatus(filterStatus === "In Progress" ? "all" : "In Progress")}
        >
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{inProgressCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">In Progress</p>
          </CardContent>
        </Card>
        <Card
          className={cn("cursor-pointer transition-colors", filterStatus === "Done" ? "ring-2 ring-primary" : "hover:bg-accent")}
          onClick={() => setFilterStatus(filterStatus === "Done" ? "all" : "Done")}
        >
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{doneCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Done</p>
          </CardContent>
        </Card>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("all")}
        >
          All Types
        </Button>
        {TYPES.map((t) => {
          const Icon = TYPE_ICONS[t];
          return (
            <Button
              key={t}
              variant={filterType === t ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(t)}
            >
              <Icon className="h-3 w-3 mr-1.5" />
              {t}
            </Button>
          );
        })}
      </div>

      {/* Feedback list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {feedbacks.length === 0
                ? "No feedback yet. Submit your first bug report or feature request!"
                : "No items match the current filter."}
            </p>
            {feedbacks.length === 0 && (
              <Button onClick={() => { setForm(emptyForm); setShowDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feedback
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const TypeIcon = TYPE_ICONS[f.type as keyof typeof TYPE_ICONS] ?? MessageSquare;
            const StatusIcon = STATUS_ICONS[f.status as keyof typeof STATUS_ICONS] ?? Circle;
            return (
              <Card key={f.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <TypeIcon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{f.title}</span>
                          <Badge variant="outline" className={cn("text-xs", TYPE_STYLES[f.type])}>
                            {f.type}
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", PRIORITY_STYLES[f.priority])}>
                            {f.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {f.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {new Date(f.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status selector */}
                      <div className="relative">
                        <select
                          value={f.status}
                          onChange={(e) => handleStatusChange(f.id, e.target.value)}
                          className={cn(
                            "text-xs rounded border bg-background px-2 py-1 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary",
                            STATUS_STYLES[f.status]
                          )}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <StatusIcon className={cn("h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none", STATUS_STYLES[f.status])} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(f.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fb-type">Type</Label>
                <Select
                  id="fb-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb-priority">Priority</Label>
                <Select
                  id="fb-priority"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-title">Title</Label>
              <Input
                id="fb-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={
                  form.type === "Bug"
                    ? "e.g. Sessions page crashes on mobile"
                    : form.type === "Feature"
                    ? "e.g. Export data to CSV"
                    : "e.g. General suggestion..."
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-desc">Description</Label>
              <Textarea
                id="fb-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={
                  form.type === "Bug"
                    ? "Steps to reproduce, what you expected vs what happened..."
                    : "Describe your idea or feedback in detail..."
                }
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
