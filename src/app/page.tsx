import { getRackets, getSessions, getStringings, getShuttles, getRecurringCosts, getActivePlayerId } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Swords,
  CalendarDays,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Feather,
  DollarSign,
  Receipt,
  Bell,
} from "lucide-react";
import { CurrencyAmount } from "@/components/currency-amount";

export default async function DashboardPage() {
  const playerId = await getActivePlayerId();
  const [rackets, sessions, stringings, shuttles, recurringCosts] = await Promise.all([
    getRackets(false, playerId ?? undefined),
    getSessions(10, playerId ?? undefined),
    getStringings(undefined, playerId ?? undefined),
    getShuttles(playerId ?? undefined),
    getRecurringCosts(playerId ?? null),
  ]);

  const now = new Date();
  const totalSessions = sessions.length;
  const totalHours = Math.round(sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60 * 10) / 10;
  const activeRackets = rackets.filter((r) => !r.isArchived).length;
  const totalStringingCost = stringings.reduce((sum, s) => sum + (s.cost || 0), 0);
  const totalCourtCost = sessions.reduce((sum, s) => sum + ((s as { courtCost?: number | null }).courtCost || 0), 0);
  const totalRacketCost = rackets.reduce((sum, r) => sum + ((r as { purchasePrice?: number | null }).purchasePrice || 0), 0);
  const totalShuttleCost = shuttles.reduce((sum, s) => sum + ((s.price ?? 0) * (s.quantity ?? 1)), 0);

  const activeSubscriptions = recurringCosts.filter((c) => {
    const start = new Date(c.startDate);
    const end = c.endDate ? new Date(c.endDate) : null;
    return start <= now && (!end || end >= now);
  });
  const monthlyEquivalent = activeSubscriptions.reduce((sum, c) => {
    if (c.billingCycle === "Monthly")   return sum + c.amount;
    if (c.billingCycle === "Quarterly") return sum + c.amount / 3;
    return sum + c.amount / 12; // Annual
  }, 0);

  // Renewals due within the next 30 days
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const renewalsDue = activeSubscriptions.filter((c) => {
    const start = new Date(c.startDate);
    const cycleMonths = c.billingCycle === "Monthly" ? 1 : c.billingCycle === "Quarterly" ? 3 : 12;
    // Find the next renewal date by advancing from startDate by cycleMonths until it's in the future
    const next = new Date(start);
    while (next <= now) {
      next.setMonth(next.getMonth() + cycleMonths);
    }
    return next <= thirtyDaysFromNow;
  });

  const totalSubscriptionCost = recurringCosts.reduce((sum, c) => {
    const start = new Date(c.startDate);
    const end = c.endDate ? new Date(c.endDate) : now;
    if (start > now) return sum;
    const effectiveEnd = end < now ? end : now;
    // +1: the period that started on startDate counts as 1 payment made
    const months =
      (effectiveEnd.getFullYear() - start.getFullYear()) * 12 +
      (effectiveEnd.getMonth() - start.getMonth()) + 1;
    if (c.billingCycle === "Monthly") {
      return sum + Math.max(1, months) * c.amount;
    } else if (c.billingCycle === "Quarterly") {
      return sum + Math.max(1, Math.ceil(months / 3)) * c.amount;
    } else {
      const years = effectiveEnd.getFullYear() - start.getFullYear() + 1;
      return sum + Math.max(1, years) * c.amount;
    }
  }, 0);
  const grandTotal = totalRacketCost + totalStringingCost + totalCourtCost + totalShuttleCost + totalSubscriptionCost;

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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

        <Link href="/costs">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><CurrencyAmount amount={Math.round(monthlyEquivalent * 100) / 100} /></div>
              <p className="text-xs text-muted-foreground">
                {activeSubscriptions.length} active · per month
              </p>
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
              <span className="text-xs text-muted-foreground">Subscriptions: <CurrencyAmount amount={totalSubscriptionCost} /></span>
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
              <Bell className="h-5 w-5 text-blue-500" />
              Subscription Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renewalsDue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No renewals due in the next 30 days.</p>
            ) : (
              <div className="space-y-2">
                {renewalsDue.map((c) => {
                  const start = new Date(c.startDate);
                  const cycleMonths = c.billingCycle === "Monthly" ? 1 : c.billingCycle === "Quarterly" ? 3 : 12;
                  const next = new Date(start);
                  while (next <= now) next.setMonth(next.getMonth() + cycleMonths);
                  return (
                    <Link key={c.id} href="/costs">
                      <div className="flex items-center justify-between p-2 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
                        <div>
                          <span className="text-sm font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{c.billingCycle}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-blue-700">
                            {next.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                        <span>{s.rackets[0]?.racket.brand} {s.rackets[0]?.racket.model}{s.rackets.length > 1 ? ` +${s.rackets.length - 1}` : ""}</span>
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
