"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Wrench, DollarSign, BarChart3, Clock, Feather, Swords } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type AnalyticsData = {
  totalSessions: number;
  totalHours: number;
  totalRackets: number;
  totalStringings: number;
  totalStringingCost: number;
  totalRacketCost: number;
  totalCourtCost: number;
  totalShuttleCost: number;
  grandTotalCost: number;
  costPerSession: number;
  racketUsage: { id: string; name: string; sessionCount: number; totalHours: number }[];
  stringPerformance: { name: string; count: number; avgLifespan: number | null }[];
  monthlyData: { month: string; sessions: number; hours: number }[];
  monthlyCostData: { month: string; cost: number }[];
  weeklyData: { week: string; sessions: number }[];
  restringRecommendations: {
    racketName: string;
    sessionsSinceStringing: number;
    lastStringDate: Date | null;
    needsRestring: boolean;
  }[];
  sessionTypes: { Match: number; Practice: number; Training: number };
  profile: { skillLevel: string; playStyle: string; tensionMin: number; tensionMax: number };
};

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const { fmt } = useCurrency();
  const sessionTypeData = [
    { name: "Match", value: data.sessionTypes.Match },
    { name: "Practice", value: data.sessionTypes.Practice },
    { name: "Training", value: data.sessionTypes.Training },
  ].filter((d) => d.value > 0);

  const hasData = data.totalSessions > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Insights into your equipment and performance
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalHours}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stringing Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.totalStringingCost)}</div>
            <p className="text-xs text-muted-foreground">
              {fmt(data.costPerSession)} / session
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stringings</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStringings}</div>
            <p className="text-xs text-muted-foreground">across all rackets</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Total Investment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-4">{fmt(data.grandTotalCost)}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Rackets</p>
                <p className="text-sm font-medium">{fmt(data.totalRacketCost)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Stringing</p>
                <p className="text-sm font-medium">{fmt(data.totalStringingCost)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Court</p>
                <p className="text-sm font-medium">{fmt(data.totalCourtCost)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Feather className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Shuttles</p>
                <p className="text-sm font-medium">{fmt(data.totalShuttleCost)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasData && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              Log sessions to start seeing analytics here.
            </p>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* Restring Recommendations */}
          {data.restringRecommendations.some((r) => r.needsRestring) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Restring Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.restringRecommendations
                    .filter((r) => r.needsRestring)
                    .map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-white border border-yellow-200">
                        <span className="text-sm font-medium">{r.racketName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {r.sessionsSinceStringing} sessions since last stringing
                          </span>
                          <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                            Restring soon
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity (Last 12 Weeks)</CardTitle>
              <CardDescription>Sessions per week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} interval={2} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Overview */}
          {data.monthlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
                <CardDescription>Sessions and hours per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sessions"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      name="Sessions"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="hours"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Hours"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Racket Usage & Session Types */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Racket Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Racket Usage</CardTitle>
                <CardDescription>Sessions per racket</CardDescription>
              </CardHeader>
              <CardContent>
                {data.racketUsage.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={data.racketUsage}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                      <Tooltip />
                      <Bar dataKey="sessionCount" fill="#22c55e" radius={[0, 3, 3, 0]} name="Sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Session Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Session Types</CardTitle>
                <CardDescription>Match / Practice / Training split</CardDescription>
              </CardHeader>
              <CardContent>
                {sessionTypeData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="60%" height={180}>
                      <PieChart>
                        <Pie
                          data={sessionTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          dataKey="value"
                        >
                          {sessionTypeData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {sessionTypeData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[i] }}
                          />
                          <span className="text-sm">{entry.name}</span>
                          <span className="text-sm font-medium">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Stringing Cost */}
          {data.monthlyCostData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Stringing Cost</CardTitle>
                <CardDescription>Spend on stringing per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.monthlyCostData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => fmt(v as number)} />
                    <Tooltip formatter={(v) => [fmt(v as number), "Cost"]} />
                    <Bar dataKey="cost" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* String Performance */}
          {data.stringPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>String Performance</CardTitle>
                <CardDescription>Average lifespan by string type (in sessions)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.stringPerformance
                    .sort((a, b) => (b.avgLifespan || 0) - (a.avgLifespan || 0))
                    .map((s) => (
                      <div key={s.name} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{s.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({s.count} {s.count === 1 ? "stringing" : "stringings"})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.avgLifespan ? (
                            <Badge variant="secondary">
                              Avg {s.avgLifespan} sessions
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              No lifespan data
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Racket Hours Table */}
          {data.racketUsage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Racket Summary</CardTitle>
                <CardDescription>Sessions and hours per racket</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Racket</th>
                        <th className="text-right py-2 font-medium">Sessions</th>
                        <th className="text-right py-2 font-medium">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.racketUsage.map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="py-2">{r.name}</td>
                          <td className="text-right py-2">{r.sessionCount}</td>
                          <td className="text-right py-2">{r.totalHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tension Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-md bg-muted text-sm">
                <strong>Tension range:</strong> Based on your profile ({data.profile.skillLevel},{" "}
                {data.profile.playStyle}), your preferred tension range is{" "}
                {data.profile.tensionMin}–{data.profile.tensionMax} lbs.
                {data.profile.playStyle === "Attacking"
                  ? " Higher tensions give you better control for attacking play."
                  : data.profile.playStyle === "Defensive"
                  ? " Lower tensions give more repulsion for defensive clears."
                  : " A mid-range tension suits your all-round style."}
              </div>
              {data.restringRecommendations.filter((r) => !r.needsRestring && r.sessionsSinceStringing > 10).map((r, i) => (
                <div key={i} className="p-3 rounded-md bg-muted text-sm">
                  <strong>{r.racketName}</strong> — {r.sessionsSinceStringing} sessions since last
                  stringing. Consider restringing soon.
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
