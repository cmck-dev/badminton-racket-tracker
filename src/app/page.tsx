import { getRackets, getSessions, getStringings, getShuttles } from "@/lib/actions";
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
  Feather,
  DollarSign,
} from "lucide-react";
import { CurrencyAmount } from "@/components/currency-amount";

export default async function DashboardPage() {
  const [rackets, sessions, stringings, shuttles] = await Promise.all([
    getRackets(),
    getSessions(10),
    getStringings(),
    getShuttles(),
  ]);

  const totalSessions = sessions.length;
  const totalHours = Math.round(sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60 * 10) / 10;
  const activeRackets = rackets.filter((r) => !r.isArchived).length;
  const totalStringingCost = stringings.reduce((sum, s) => sum + (s.cost || 0), 0);
  const totalCourtCost = sessions.reduce((sum, s) => sum + ((s as { courtCost?: number | null }).courtCost || 0), 0);
  const totalRacketCost = rackets.reduce((sum, r) => sum + ((r as { purchasePrice?: number | null }).purchasePrice || 0), 0);
  const totalShuttleCost = shuttles.reduce((sum, s) => sum + ((s.price ?? 0) * (s.quantity ?? 1)), 0);
  const grandTotal = totalRacketCost + totalStringingCost + totalCourtCost + totalShuttleCost;

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
        <p className="text-muted-foreground mt-1">Your badminton equipment at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/rackets">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rackets</CardTitle>
              <Swords className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRackets}</div>
              <p className="text-xs text-muted-foreground">
                {rackets.find((r) => r.role === "Primary")
                  ? `Primary: ${rackets.find((r) => r.role === "Primary")?.brand} ${rackets.find((r) => r.role === "Primary")?.model}`
                  : "No primary set"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sessions">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">{totalHours}h total play time</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/stringing">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stringing Cost</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><CurrencyAmount amount={totalStringingCost} /></div>
              <p className="text-xs text-muted-foreground">{stringings.length} total stringings</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/shuttles">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shuttles</CardTitle>
              <Feather className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shuttles.length}</div>
              <p className="text-xs text-muted-foreground"><CurrencyAmount amount={totalShuttleCost} /> spent</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Total Investment */}
      <Link href="/analytics">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total Investment
            </CardTitle>
            <span className="text-xs text-muted-foreground">View breakdown →</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyAmount amount={grandTotal} /></div>
            <div className="flex gap-4 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">Rackets: <CurrencyAmount amount={totalRacketCost} /></span>
              <span className="text-xs text-muted-foreground">Stringing: <CurrencyAmount amount={totalStringingCost} /></span>
              <span className="text-xs text-muted-foreground">Court: <CurrencyAmount amount={totalCourtCost} /></span>
              <span className="text-xs text-muted-foreground">Shuttles: <CurrencyAmount amount={totalShuttleCost} /></span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Alerts & Recent */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Restring Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {needsRestring.length === 0 ? (
              <p className="text-sm text-muted-foreground">All rackets are in good shape!</p>
            ) : (
              <div className="space-y-2">
                {needsRestring.map((r) => (
                  <Link key={r.id} href="/stringing?new=true">
                    <div className="flex items-center justify-between p-2 rounded-md bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors">
                      <span className="text-sm font-medium">{r.brand} {r.model}</span>
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300">Restring needed</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                <Link href="/sessions" className="text-primary hover:underline">Log your first session</Link>
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <Link key={s.id} href="/sessions">
                    <div className="flex items-center justify-between text-sm py-1 hover:bg-accent rounded px-1 transition-colors">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{s.sessionType}</Badge>
                        <span>{s.racket.brand} {s.racket.model}</span>
                      </div>
                      <span className="text-muted-foreground">{s.durationMinutes}min</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Link href="/sessions?new=true" className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-sm font-medium">
          <CalendarDays className="h-4 w-4 text-primary" />Log Session
        </Link>
        <Link href="/rackets?new=true" className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-sm font-medium">
          <Swords className="h-4 w-4 text-primary" />Add Racket
        </Link>
        <Link href="/stringing?new=true" className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-sm font-medium">
          <Wrench className="h-4 w-4 text-primary" />Log Stringing
        </Link>
        <Link href="/shuttles?new=true" className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-sm font-medium">
          <Feather className="h-4 w-4 text-primary" />Add Shuttle
        </Link>
      </div>
    </div>
  );
}
