"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerPicker } from "@/components/player-picker";
import { batchReassign } from "@/lib/actions";
import { ArrowRight, CheckSquare, Square } from "lucide-react";

type Player = { id: string; name: string; avatarColor: string };

type RecordType = "rackets" | "sessions" | "stringing" | "shuttles" | "costs";

const RECORD_TYPES: { key: RecordType; label: string; hasDateFilter: boolean }[] = [
  { key: "rackets",  label: "Rackets",         hasDateFilter: false },
  { key: "sessions", label: "Sessions",        hasDateFilter: true  },
  { key: "stringing",label: "Stringing",       hasDateFilter: true  },
  { key: "shuttles", label: "Shuttles",        hasDateFilter: false },
  { key: "costs",    label: "Recurring Costs", hasDateFilter: false },
];

export function ReassignClient({ players }: { players: Player[] }) {
  const [fromPlayerId, setFromPlayerId] = useState<string | null>(null);
  const [toPlayerId, setToPlayerId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<RecordType[]>(
    RECORD_TYPES.map((t) => t.key)
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ counts: Record<string, number> } | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const showDateFilter = selectedTypes.includes("sessions") || selectedTypes.includes("stringing");
  const samePlayer     = fromPlayerId === toPlayerId;
  const noTypes        = selectedTypes.length === 0;

  function toggleType(key: RecordType) {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  }

  function toggleAll() {
    setSelectedTypes((prev) =>
      prev.length === RECORD_TYPES.length ? [] : RECORD_TYPES.map((t) => t.key)
    );
  }

  function playerLabel(id: string | null) {
    if (!id) return "Me (owner)";
    return players.find((p) => p.id === id)?.name ?? "Unknown";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (samePlayer || noTypes) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await batchReassign({
        fromPlayerId,
        toPlayerId,
        types: selectedTypes,
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo   || undefined,
      });
      if (res.ok) {
        setResult({ counts: res.counts });
      } else {
        setError(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  const totalMoved = result
    ? Object.values(result.counts).reduce((s, n) => s + n, 0)
    : 0;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reassign Records</h1>
        <p className="text-muted-foreground mt-1">
          Move records in bulk from one player to another.
        </p>
      </div>

      {players.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No sub-profiles yet. Add players first from the{" "}
            <a href="/players" className="text-primary hover:underline">Players</a> page.
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From / To */}
          <Card>
            <CardHeader><CardTitle className="text-base">Move from → to</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <div className="space-y-2">
                  <Label>From</Label>
                  <PlayerPicker
                    value={fromPlayerId}
                    onChange={setFromPlayerId}
                    players={players}
                    label=""
                  />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground mb-2.5" />
                <div className="space-y-2">
                  <Label>To</Label>
                  <PlayerPicker
                    value={toPlayerId}
                    onChange={setToPlayerId}
                    players={players}
                    label=""
                  />
                </div>
              </div>
              {samePlayer && (
                <p className="text-sm text-destructive">Source and target must be different.</p>
              )}
            </CardContent>
          </Card>

          {/* Record types */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Record types</CardTitle>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {selectedTypes.length === RECORD_TYPES.length
                    ? <><CheckSquare className="h-3.5 w-3.5" /> Deselect all</>
                    : <><Square className="h-3.5 w-3.5" /> Select all</>
                  }
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {RECORD_TYPES.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(key)}
                    onChange={() => toggleType(key)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
              {noTypes && (
                <p className="text-sm text-destructive pt-1">Select at least one record type.</p>
              )}
            </CardContent>
          </Card>

          {/* Date range — only when sessions or stringing selected */}
          {showDateFilter && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Date range (optional)</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Filters sessions and stringing records. Leave empty to move all.
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">To date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  ✓ Moved {totalMoved} record{totalMoved !== 1 ? "s" : ""} from{" "}
                  <strong>{playerLabel(fromPlayerId)}</strong> →{" "}
                  <strong>{playerLabel(toPlayerId)}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.counts).map(([type, count]) =>
                    count > 0 ? (
                      <Badge key={type} variant="secondary">
                        {count} {type}
                      </Badge>
                    ) : null
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || samePlayer || noTypes}
            className="w-full"
          >
            {loading ? "Reassigning…" : "Reassign Records"}
          </Button>
        </form>
      )}
    </div>
  );
}
