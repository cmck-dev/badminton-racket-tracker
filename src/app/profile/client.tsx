"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updatePlayerProfile } from "@/lib/actions";
import { Save, User, Target, Gauge } from "lucide-react";

type PlayerProfile = {
  id: string;
  name: string;
  skillLevel: string;
  playStyle: string;
  preferredStrings: string;
  tensionMin: number;
  tensionMax: number;
  injuryNotes: string | null;
  trainingFrequency: number;
};

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Competitive"];
const PLAY_STYLES = ["Attacking", "Defensive", "All-round"];
const ALL_STRINGS = [
  "Yonex BG65",
  "Yonex BG66 Ultimax",
  "Yonex BG80",
  "Yonex BG80 Power",
  "Yonex Aerobite",
  "Yonex Nanogy 98",
  "Yonex Nanogy 99",
  "Yonex Exbolt 63",
  "Yonex Exbolt 65",
  "Victor VBS-66N",
  "Victor VBS-68P",
  "Li-Ning No.1",
  "Ashaway ZyMax 62 Fire",
  "Ashaway ZyMax 66 Fire",
  "Gosen G-Tone 5",
];

export function ProfileClient({
  initialProfile,
}: {
  initialProfile: PlayerProfile;
}) {
  const [form, setForm] = useState({
    name: initialProfile.name,
    skillLevel: initialProfile.skillLevel,
    playStyle: initialProfile.playStyle,
    preferredStrings: JSON.parse(initialProfile.preferredStrings || "[]") as string[],
    tensionMin: initialProfile.tensionMin.toString(),
    tensionMax: initialProfile.tensionMax.toString(),
    injuryNotes: initialProfile.injuryNotes || "",
    trainingFrequency: initialProfile.trainingFrequency.toString(),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleString(s: string) {
    setForm((prev) => ({
      ...prev,
      preferredStrings: prev.preferredStrings.includes(s)
        ? prev.preferredStrings.filter((x) => x !== s)
        : [...prev.preferredStrings, s],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePlayerProfile({
        name: form.name,
        skillLevel: form.skillLevel,
        playStyle: form.playStyle,
        preferredStrings: JSON.stringify(form.preferredStrings),
        tensionMin: parseFloat(form.tensionMin),
        tensionMax: parseFloat(form.tensionMax),
        injuryNotes: form.injuryNotes || undefined,
        trainingFrequency: parseInt(form.trainingFrequency),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Player Profile</h1>
        <p className="text-muted-foreground mt-1">
          Your preferences influence recommendations and analytics
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill">Skill Level</Label>
                <Select
                  id="skill"
                  value={form.skillLevel}
                  onChange={(e) =>
                    setForm({ ...form, skillLevel: e.target.value })
                  }
                >
                  {SKILL_LEVELS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">Play Style</Label>
                <Select
                  id="style"
                  value={form.playStyle}
                  onChange={(e) =>
                    setForm({ ...form, playStyle: e.target.value })
                  }
                >
                  {PLAY_STYLES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="freq">Training Frequency (sessions/week)</Label>
              <Input
                id="freq"
                type="number"
                min="1"
                max="14"
                value={form.trainingFrequency}
                onChange={(e) =>
                  setForm({ ...form, trainingFrequency: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* String Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              String Preferences
            </CardTitle>
            <CardDescription>
              Select your preferred strings (used for recommendations)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {ALL_STRINGS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleString(s)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.preferredStrings.includes(s)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent border-input"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tmin">Tension Min (lbs)</Label>
                <Input
                  id="tmin"
                  type="number"
                  step="0.5"
                  min="15"
                  max="40"
                  value={form.tensionMin}
                  onChange={(e) =>
                    setForm({ ...form, tensionMin: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tmax">Tension Max (lbs)</Label>
                <Input
                  id="tmax"
                  type="number"
                  step="0.5"
                  min="15"
                  max="40"
                  value={form.tensionMax}
                  onChange={(e) =>
                    setForm({ ...form, tensionMax: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Health & Constraints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="injury">Injury History / Constraints (optional)</Label>
              <Textarea
                id="injury"
                value={form.injuryNotes}
                onChange={(e) =>
                  setForm({ ...form, injuryNotes: e.target.value })
                }
                placeholder="e.g. Tennis elbow, shoulder issues..."
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
