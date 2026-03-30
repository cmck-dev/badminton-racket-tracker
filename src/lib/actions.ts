"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

// ─── Racket Actions ─────────────────────────────────────────────

export async function getRackets(includeArchived = false) {
  const user = await requireAuth();
  return prisma.racket.findMany({
    where: {
      userId: user.id,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    include: {
      playSessions: { select: { id: true, durationMinutes: true, date: true } },
      stringings: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
}

export async function getRacket(id: string) {
  const user = await requireAuth();
  return prisma.racket.findFirst({
    where: { id, userId: user.id },
    include: {
      playSessions: { orderBy: { date: "desc" } },
      stringings: { orderBy: { date: "desc" } },
    },
  });
}

export async function createRacket(data: {
  brand: string;
  model: string;
  weightClass: string;
  balancePoint: string;
  stiffness: string;
  gripSize: string;
  purchaseDate?: string;
  purchasePrice?: number;
  notes?: string;
}) {
  const user = await requireAuth();
  const racket = await prisma.racket.create({
    data: {
      ...data,
      userId: user.id,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
    },
  });
  revalidatePath("/rackets");
  revalidatePath("/");
  return racket;
}

export async function updateRacket(
  id: string,
  data: {
    brand?: string;
    model?: string;
    weightClass?: string;
    balancePoint?: string;
    stiffness?: string;
    gripSize?: string;
    purchaseDate?: string | null;
    purchasePrice?: number | null;
    notes?: string;
    isPrimary?: boolean;
    isArchived?: boolean;
  }
) {
  const user = await requireAuth();
  if (data.isPrimary) {
    await prisma.racket.updateMany({
      where: { userId: user.id, isPrimary: true },
      data: { isPrimary: false },
    });
  }
  const racket = await prisma.racket.updateMany({
    where: { id, userId: user.id },
    data: {
      ...data,
      purchaseDate:
        data.purchaseDate === null
          ? null
          : data.purchaseDate
          ? new Date(data.purchaseDate)
          : undefined,
    },
  });
  revalidatePath("/rackets");
  revalidatePath("/");
  return racket;
}

export async function deleteRacket(id: string) {
  const user = await requireAuth();
  await prisma.playSession.deleteMany({ where: { racketId: id, userId: user.id } });
  await prisma.stringingRecord.deleteMany({ where: { racketId: id, userId: user.id } });
  await prisma.racket.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/rackets");
  revalidatePath("/");
}

// ─── Play Session Actions ───────────────────────────────────────

export async function getSessions(limit?: number) {
  const user = await requireAuth();
  return prisma.playSession.findMany({
    where: { userId: user.id },
    include: { racket: true },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createSession(data: {
  date: string;
  sessionType: string;
  durationMinutes: number;
  racketId: string;
  performanceNotes?: string;
  controlRating?: number;
  powerRating?: number;
  comfortRating?: number;
  courtCost?: number;
}) {
  const user = await requireAuth();
  const session = await prisma.playSession.create({
    data: { ...data, userId: user.id, date: new Date(data.date) },
  });
  revalidatePath("/sessions");
  revalidatePath("/rackets");
  revalidatePath("/");
  return session;
}

export async function updateSession(
  id: string,
  data: {
    date?: string;
    sessionType?: string;
    durationMinutes?: number;
    racketId?: string;
    performanceNotes?: string;
    controlRating?: number;
    powerRating?: number;
    comfortRating?: number;
    courtCost?: number | null;
  }
) {
  const user = await requireAuth();
  await prisma.playSession.updateMany({
    where: { id, userId: user.id },
    data: { ...data, date: data.date ? new Date(data.date) : undefined },
  });
  revalidatePath("/sessions");
  revalidatePath("/");
}

export async function deleteSession(id: string) {
  const user = await requireAuth();
  await prisma.playSession.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/sessions");
  revalidatePath("/");
}

export async function getLastSession() {
  const user = await requireAuth();
  return prisma.playSession.findFirst({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    include: { racket: true },
  });
}

// ─── Stringing Actions ──────────────────────────────────────────

export async function getStringings(racketId?: string) {
  const user = await requireAuth();
  return prisma.stringingRecord.findMany({
    where: { userId: user.id, ...(racketId ? { racketId } : {}) },
    include: { racket: true },
    orderBy: { date: "desc" },
  });
}

export async function createStringing(data: {
  date: string;
  racketId: string;
  stringBrand: string;
  stringModel: string;
  tensionMain: number;
  tensionCross: number;
  stringer?: string;
  cost?: number;
  durabilityNotes?: string;
}) {
  const user = await requireAuth();
  await prisma.stringingRecord.updateMany({
    where: { userId: user.id, racketId: data.racketId, isActive: true },
    data: { isActive: false },
  });
  const stringing = await prisma.stringingRecord.create({
    data: { ...data, userId: user.id, date: new Date(data.date), isActive: true },
  });
  revalidatePath("/stringing");
  revalidatePath("/rackets");
  revalidatePath("/");
  return stringing;
}

export async function updateStringing(
  id: string,
  data: {
    date?: string;
    stringBrand?: string;
    stringModel?: string;
    tensionMain?: number;
    tensionCross?: number;
    stringer?: string;
    cost?: number;
    brokeAfter?: number | null;
    durabilityNotes?: string;
    isActive?: boolean;
  }
) {
  const user = await requireAuth();
  await prisma.stringingRecord.updateMany({
    where: { id, userId: user.id },
    data: { ...data, date: data.date ? new Date(data.date) : undefined },
  });
  revalidatePath("/stringing");
  revalidatePath("/");
}

export async function deleteStringing(id: string) {
  const user = await requireAuth();
  await prisma.stringingRecord.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/stringing");
  revalidatePath("/");
}

// ─── Player Profile Actions ────────────────────────────────────

export async function getPlayerProfile() {
  const user = await requireAuth();
  let profile = await prisma.playerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await prisma.playerProfile.create({
      data: { userId: user.id, name: user.name ?? "Player" },
    });
  }
  return profile;
}

export async function updatePlayerProfile(data: {
  name?: string;
  skillLevel?: string;
  playStyle?: string;
  preferredStrings?: string;
  tensionMin?: number;
  tensionMax?: number;
  injuryNotes?: string;
  trainingFrequency?: number;
  currency?: string;
}) {
  const user = await requireAuth();
  const profile = await prisma.playerProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, name: user.name ?? "Player", ...data },
  });
  revalidatePath("/profile");
  revalidatePath("/");
  return profile;
}

// ─── Shuttle Actions ────────────────────────────────────────────

export async function getShuttles() {
  const user = await requireAuth();
  return prisma.shuttle.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createShuttle(data: {
  brand: string;
  model?: string;
  type: string;
  speed?: string;
  quantity?: number;
  price?: number;
  purchaseDate?: string;
  notes?: string;
}) {
  const user = await requireAuth();
  const shuttle = await prisma.shuttle.create({
    data: {
      ...data,
      userId: user.id,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
    },
  });
  revalidatePath("/shuttles");
  revalidatePath("/");
  return shuttle;
}

export async function updateShuttle(
  id: string,
  data: {
    brand?: string;
    model?: string;
    type?: string;
    speed?: string;
    quantity?: number | null;
    price?: number | null;
    purchaseDate?: string | null;
    notes?: string;
  }
) {
  const user = await requireAuth();
  await prisma.shuttle.updateMany({
    where: { id, userId: user.id },
    data: {
      ...data,
      purchaseDate:
        data.purchaseDate === null
          ? null
          : data.purchaseDate
          ? new Date(data.purchaseDate)
          : undefined,
    },
  });
  revalidatePath("/shuttles");
  revalidatePath("/");
}

export async function deleteShuttle(id: string) {
  const user = await requireAuth();
  await prisma.shuttle.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/shuttles");
  revalidatePath("/");
}

// ─── Analytics ─────────────────────────────────────────────────

export async function getAnalyticsData() {
  const user = await requireAuth();

  const [rackets, sessions, stringings, shuttles, profile] = await Promise.all([
    prisma.racket.findMany({
      where: { userId: user.id },
      include: { playSessions: true, stringings: true },
    }),
    prisma.playSession.findMany({
      where: { userId: user.id },
      include: { racket: true },
      orderBy: { date: "asc" },
    }),
    prisma.stringingRecord.findMany({
      where: { userId: user.id },
      include: { racket: true },
      orderBy: { date: "asc" },
    }),
    prisma.shuttle.findMany({ where: { userId: user.id } }),
    getPlayerProfile(),
  ]);

  // Racket usage
  const racketUsage = rackets.map((r) => ({
    id: r.id,
    name: `${r.brand} ${r.model}`,
    sessionCount: r.playSessions.length,
    totalHours:
      Math.round(
        (r.playSessions.reduce((s, x) => s + x.durationMinutes, 0) / 60) * 10
      ) / 10,
  }));
  racketUsage.sort((a, b) => b.sessionCount - a.sessionCount);

  // Cost
  const totalStringingCost = stringings.reduce((s, x) => s + (x.cost ?? 0), 0);
  const costPerSession = sessions.length > 0 ? totalStringingCost / sessions.length : 0;

  // String performance
  const stringPerf: Record<string, { name: string; count: number; totalLife: number; withLife: number }> = {};
  for (const s of stringings) {
    const key = `${s.stringBrand} ${s.stringModel}`;
    if (!stringPerf[key]) stringPerf[key] = { name: key, count: 0, totalLife: 0, withLife: 0 };
    stringPerf[key].count++;
    if (s.brokeAfter) { stringPerf[key].totalLife += s.brokeAfter; stringPerf[key].withLife++; }
  }
  const stringPerformance = Object.values(stringPerf).map((sp) => ({
    ...sp,
    avgLifespan: sp.withLife > 0 ? Math.round(sp.totalLife / sp.withLife) : null,
  }));

  // Monthly usage
  const monthlyUsage: Record<string, { month: string; sessions: number; hours: number }> = {};
  for (const s of sessions) {
    const month = s.date.toISOString().slice(0, 7);
    if (!monthlyUsage[month]) monthlyUsage[month] = { month, sessions: 0, hours: 0 };
    monthlyUsage[month].sessions++;
    monthlyUsage[month].hours += s.durationMinutes / 60;
  }
  const monthlyData = Object.values(monthlyUsage).map((m) => ({
    ...m,
    hours: Math.round(m.hours * 10) / 10,
  }));

  // Monthly cost
  const monthlyCost: Record<string, { month: string; cost: number }> = {};
  for (const s of stringings) {
    const month = s.date.toISOString().slice(0, 7);
    if (!monthlyCost[month]) monthlyCost[month] = { month, cost: 0 };
    monthlyCost[month].cost += s.cost ?? 0;
  }
  const monthlyCostData = Object.values(monthlyCost);

  // Weekly (last 12 weeks)
  const now = new Date();
  const weeklyData: { week: string; sessions: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weeklyData.push({
      week: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sessions: sessions.filter((s) => s.date >= weekStart && s.date < weekEnd).length,
    });
  }

  // Restring recommendations
  const restringRecommendations = rackets
    .filter((r) => !r.isArchived)
    .map((r) => {
      const lastStringing = r.stringings.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      const sessionsSinceStringing = lastStringing
        ? r.playSessions.filter((s) => s.date > lastStringing.date).length
        : r.playSessions.length;
      return {
        racketName: `${r.brand} ${r.model}`,
        sessionsSinceStringing,
        lastStringDate: lastStringing?.date ?? null,
        needsRestring: sessionsSinceStringing >= 15,
      };
    });

  const sessionTypes = {
    Match: sessions.filter((s: { sessionType: string }) => s.sessionType === "Match").length,
    Practice: sessions.filter((s: { sessionType: string }) => s.sessionType === "Practice").length,
    Training: sessions.filter((s: { sessionType: string }) => s.sessionType === "Training").length,
  };

  // Cost breakdown
  const totalRacketCost = rackets.reduce((sum: number, r: { purchasePrice: number | null }) => sum + (r.purchasePrice ?? 0), 0);
  const totalCourtCost = sessions.reduce((sum: number, s: { courtCost: number | null }) => sum + (s.courtCost ?? 0), 0);
  const totalShuttleCost = shuttles.reduce((sum: number, s: { price: number | null; quantity: number | null }) => sum + ((s.price ?? 0) * (s.quantity ?? 1)), 0);
  const grandTotalCost = totalRacketCost + totalStringingCost + totalCourtCost + totalShuttleCost;

  return {
    totalSessions: sessions.length,
    totalHours: Math.round((sessions.reduce((s: { durationMinutes: number }, x: { durationMinutes: number }) => ({ durationMinutes: s.durationMinutes + x.durationMinutes }), { durationMinutes: 0 }).durationMinutes / 60) * 10) / 10,
    totalRackets: rackets.filter((r: { isArchived: boolean }) => !r.isArchived).length,
    totalStringings: stringings.length,
    totalStringingCost: Math.round(totalStringingCost * 100) / 100,
    totalRacketCost: Math.round(totalRacketCost * 100) / 100,
    totalCourtCost: Math.round(totalCourtCost * 100) / 100,
    totalShuttleCost: Math.round(totalShuttleCost * 100) / 100,
    grandTotalCost: Math.round(grandTotalCost * 100) / 100,
    costPerSession: Math.round(costPerSession * 100) / 100,
    racketUsage,
    stringPerformance,
    monthlyData,
    monthlyCostData,
    weeklyData,
    restringRecommendations,
    sessionTypes,
    profile,
  };
}
