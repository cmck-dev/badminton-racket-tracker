"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Player = { id: string; name: string; avatarColor: string };

export function PlayerPicker({
  value,
  onChange,
  players,
  label = "For which player?",
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  players: Player[];
  label?: string;
}) {
  if (players.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      >
        <option value="">Me (owner)</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
