import { getRackets, getSessions, getStringings } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Swords,
  CalendarDays,
  Wrench,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default async function DashboardPage() {
  const [rackets, sessions, stringings] = await Promise.all([
    getRackets(),
    getSessions(10),
    getStringings(),
  ]);

  const totalSessions = sessions.length;
  const totalHours = Math.round(
    sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60 * 10
  ) / 10;
  const activeRackets = rackets.filter((r) => !r.isArchived).length;
  const totalCost = stringings.reduce((sum, s) => sum + (s.cost || 0), 0);

  // Find rackets that might need restringing (>15 sessions since last string)
  const needsRestring = rackets.filter((r) => {
    const lastStringing = r.stringings[0];
    if (!lastStringing) return r.playSessions.length > 15;
    const sessionsSince = r.playSessions.filter(
      (s) => new Date(s.date) > new Date(lastStringing.date)
    ).length;
    return sessionsSince >= 15;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your badminton equipment at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rackets</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRackets}</div>
            <p className="text-xs text-muted-foreground">
              {rackets.filter((r) => r.isPrimary).length > 0
                ? `Primary: ${rackets.find((r) => r.isPrimary)?.brand} ${rackets.find((r) => r.isPrimary)?.model}`
                : "No primary set"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Across all rackets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Play Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">Total hours played</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stringing Cost</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              {stringings.length} total stringings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Restring Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Restring Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {needsRestring.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All rackets are in good shape!
              </p>
            ) : (
              <div className="space-y-2">
                {needsRestring.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 rounded-md bg-yellow-50 border border-yellow-200"
                  >
                    <span className="text-sm font-medium">
                      {r.brand} {r.model}
                    </span>
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      Restring needed
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sessions logged yet.{" "}
                <Link href="/sessions" className="text-primary hover:underline">
                  Log your first session
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {s.sessionType}
                      </Badge>
                      <span>
                        {s.racket.brand} {s.racket.model}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {s.durationMinutes}min
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Link
          href="/sessions?new=true"
          className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-sm font-medium"
        >
          <CalendarDays className="h-4 w-4 text-primary" />
          Log Session
        </Link>
        <Link
          href="/rackets?new=true"
          className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-sm font-medium"
        >
          <Swords className="h-4 w-4 text-primary" />
          Add Racket
        </Link>
        <Link
          href="/stringing?new=true"
          className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-sm font-medium"
        >
          <Wrench className="h-4 w-4 text-primary" />
          Log Stringing
        </Link>
        <Link
          href="/analytics"
          className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-sm font-medium"
        >
          <TrendingUp className="h-4 w-4 text-primary" />
          View Analytics
        </Link>
      </div>
    </div>
  );
}
