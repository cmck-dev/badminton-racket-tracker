"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteUser, updateFeedbackStatus, deleteFeedback } from "@/lib/actions";
import {
  Users, Swords, CalendarDays, Wrench, MessageSquarePlus, Trash2,
  ShieldCheck, Bug, Lightbulb, MessageSquare, Circle, Clock, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  _count: { rackets: number; playSessions: number; stringings: number; feedbacks: number };
};

type FeedbackItem = {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  user?: { name: string | null; email: string | null } | null;
};

const TYPE_ICONS = { Bug, Feature: Lightbulb, General: MessageSquare } as const;
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
const STATUS_STYLES: Record<string, string> = {
  Open: "text-muted-foreground",
  "In Progress": "text-blue-600",
  Done: "text-green-600",
};
const STATUS_ICONS = { Open: Circle, "In Progress": Clock, Done: CheckCircle2 };
const STATUSES = ["Open", "In Progress", "Done"] as const;

type Panel = "users" | "feedback" | null;

export function AdminClient({
  users: initialUsers,
  feedbacks: initialFeedbacks,
  adminEmail,
}: {
  users: AdminUser[];
  feedbacks: FeedbackItem[];
  adminEmail: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [activePanel, setActivePanel] = useState<Panel>("users");

  const totalRackets = users.reduce((s, u) => s + u._count.rackets, 0);
  const totalSessions = users.reduce((s, u) => s + u._count.playSessions, 0);

  function togglePanel(panel: Panel) {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

  async function handleDeleteUser(id: string, name: string | null) {
    if (!confirm(`Delete user "${name ?? id}" and ALL their data? This cannot be undone.`)) return;
    await deleteUser(id);
    setUsers(users.filter((u) => u.id !== id));
  }

  async function handleStatusChange(id: string, status: string) {
    await updateFeedbackStatus(id, status);
    setFeedbacks(feedbacks.map((f) => (f.id === id ? { ...f, status } : f)));
  }

  async function handleDeleteFeedback(id: string) {
    if (!confirm("Delete this feedback item?")) return;
    await deleteFeedback(id);
    setFeedbacks(feedbacks.filter((f) => f.id !== id));
  }

  const tiles = [
    {
      panel: "users" as Panel,
      icon: Users,
      count: users.length,
      label: "Total Users",
      color: "text-muted-foreground",
    },
    {
      panel: null,
      icon: Swords,
      count: totalRackets,
      label: "Total Rackets",
      color: "text-muted-foreground",
      href: "/rackets",
    },
    {
      panel: null,
      icon: CalendarDays,
      count: totalSessions,
      label: "Total Sessions",
      color: "text-muted-foreground",
      href: "/sessions",
    },
    {
      panel: "feedback" as Panel,
      icon: MessageSquarePlus,
      count: feedbacks.length,
      label: "Total Feedback",
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p className="text-muted-foreground mt-0.5">Manage users and app-wide data</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const isActive = tile.panel && activePanel === tile.panel;
          const clickable = !!tile.panel;
          return (
            <Card
              key={tile.label}
              onClick={() => tile.panel && togglePanel(tile.panel)}
              className={cn(
                "transition-colors",
                clickable && "cursor-pointer hover:bg-accent",
                isActive && "ring-2 ring-primary bg-primary/5"
              )}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-2xl font-bold">{tile.count}</span>
                </div>
                <p className={cn("text-xs mt-1", isActive ? "text-primary font-medium" : "text-muted-foreground")}>
                  {tile.label}
                  {clickable && (
                    <span className="ml-1 opacity-60">{isActive ? "▲" : "▼"}</span>
                  )}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users panel */}
      {activePanel === "users" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">No users found.</p>
            ) : (
              <div className="divide-y">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-4 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt={u.name ?? ""} className="w-9 h-9 rounded-full shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-medium">
                          {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1" title="Rackets">
                          <Swords className="h-3 w-3" />{u._count.rackets}
                        </span>
                        <span className="flex items-center gap-1" title="Sessions">
                          <CalendarDays className="h-3 w-3" />{u._count.playSessions}
                        </span>
                        <span className="flex items-center gap-1" title="Stringings">
                          <Wrench className="h-3 w-3" />{u._count.stringings}
                        </span>
                        <span className="flex items-center gap-1" title="Feedback">
                          <MessageSquarePlus className="h-3 w-3" />{u._count.feedbacks}
                        </span>
                      </div>
                      {u.email === adminEmail ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
                          Admin
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feedback panel */}
      {activePanel === "feedback" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5" />
              All Feedback ({feedbacks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {feedbacks.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">No feedback submitted yet.</p>
            ) : (
              <div className="divide-y">
                {feedbacks.map((f) => {
                  const TypeIcon = TYPE_ICONS[f.type as keyof typeof TYPE_ICONS] ?? MessageSquare;
                  const StatusIcon = STATUS_ICONS[f.status as keyof typeof STATUS_ICONS] ?? Circle;
                  return (
                    <div key={f.id} className="px-6 py-4">
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
                            <p className="text-sm text-muted-foreground mt-1">{f.description}</p>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              {new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              {f.user && (
                                <span className="ml-2 text-muted-foreground/70">
                                  · {f.user.name ?? f.user.email ?? "Unknown"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="relative">
                            <select
                              value={f.status}
                              onChange={(e) => handleStatusChange(f.id, e.target.value)}
                              className={cn(
                                "text-xs rounded border bg-background px-2 py-1 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary",
                                STATUS_STYLES[f.status]
                              )}
                            >
                              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <StatusIcon className={cn("h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none", STATUS_STYLES[f.status])} />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteFeedback(f.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
