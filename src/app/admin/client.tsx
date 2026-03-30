"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteUser } from "@/lib/actions";
import { Users, Swords, CalendarDays, Wrench, MessageSquarePlus, Trash2, ShieldCheck } from "lucide-react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  _count: {
    rackets: number;
    playSessions: number;
    stringings: number;
    feedbacks: number;
  };
};

export function AdminClient({ users, adminEmail }: { users: AdminUser[]; adminEmail: string }) {
  const [list, setList] = useState(users);

  async function handleDelete(id: string, name: string | null) {
    if (!confirm(`Delete user "${name ?? id}" and ALL their data? This cannot be undone.`)) return;
    await deleteUser(id);
    setList(list.filter((u) => u.id !== id));
  }

  const totalRackets = list.reduce((s, u) => s + u._count.rackets, 0);
  const totalSessions = list.reduce((s, u) => s + u._count.playSessions, 0);
  const totalStringings = list.reduce((s, u) => s + u._count.stringings, 0);
  const totalFeedbacks = list.reduce((s, u) => s + u._count.feedbacks, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p className="text-muted-foreground mt-0.5">Manage users and app-wide data</p>
        </div>
      </div>

      {/* App-wide stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{list.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalRackets}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Rackets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalSessions}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalFeedbacks}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Feedback</p>
          </CardContent>
        </Card>
      </div>

      {/* User list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({list.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">No users found.</p>
          ) : (
            <div className="divide-y">
              {list.map((u) => (
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
                    <div className="hidden sm:flex gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Swords className="h-3 w-3" />{u._count.rackets}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />{u._count.playSessions}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" />{u._count.stringings}
                      </span>
                      <span className="flex items-center gap-1">
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
                        onClick={() => handleDelete(u.id, u.name)}
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
    </div>
  );
}
