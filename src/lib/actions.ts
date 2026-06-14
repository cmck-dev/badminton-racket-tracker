"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { generateRecurringDates } from "@/lib/recurrence";

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
      stringPreferences: { orderBy: { priority: "asc" } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
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
    role?: string | null;
    isArchived?: boolean;
  }
) {
  const user = await requireAuth();
  // Each role must be unique — clear it from any other racket first
  if (data.role) {
    await prisma.racket.updateMany({
      where: { userId: user.id, role: data.role },
      data: { role: null },
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
  // Sessions where this is the only linked racket are deleted; sessions with other rackets keep those links.
  const soloSessions = await prisma.playSessionRacket.findMany({
    where: { racketId: id, userId: user.id },
    select: { sessionId: true },
  });
  const soloSessionIds = soloSessions.map((r) => r.sessionId);
  for (const sessionId of soloSessionIds) {
    const otherLinks = await prisma.playSessionRacket.count({
      where: { sessionId, NOT: { racketId: id } },
    });
    if (otherLinks === 0) {
      await prisma.playSession.deleteMany({ where: { id: sessionId, userId: user.id } });
    }
  }
  await prisma.stringingRecord.deleteMany({ where: { racketId: id, userId: user.id } });
  await prisma.racket.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/rackets");
  revalidatePath("/");
}

// ─── Racket String Preference Actions ───────────────────────────

export async function upsertRacketStringPreference(
  racketId: string,
  priority: 1 | 2,
  data: { stringBrand: string; stringModel: string; tension?: number; reason?: string }
) {
  const user = await requireAuth();
  // Verify the racket belongs to this user
  const racket = await prisma.racket.findFirst({ where: { id: racketId, userId: user.id } });
  if (!racket) throw new Error("Racket not found.");
  await prisma.racketStringPreference.upsert({
    where: { racketId_priority: { racketId, priority } },
    update: { stringBrand: data.stringBrand, stringModel: data.stringModel, tension: data.tension ?? null, reason: data.reason ?? null },
    create: { racketId, userId: user.id, priority, stringBrand: data.stringBrand, stringModel: data.stringModel, tension: data.tension ?? null, reason: data.reason ?? null },
  });
  revalidatePath("/rackets");
}

export async function deleteRacketStringPreference(racketId: string, priority: 1 | 2) {
  const user = await requireAuth();
  await prisma.racketStringPreference.deleteMany({
    where: { racketId, priority, userId: user.id },
  });
  revalidatePath("/rackets");
}

// ─── Play Session Actions ───────────────────────────────────────

export async function getSessions(limit?: number) {
  const user = await requireAuth();
  return prisma.playSession.findMany({
    where: { userId: user.id },
    include: {
      rackets: { include: { racket: { select: { id: true, brand: true, model: true } } } },
    },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createSession(data: {
  date: string;
  sessionType: string;
  durationMinutes: number;
  racketIds: string[];
  performanceNotes?: string;
  controlRating?: number;
  powerRating?: number;
  comfortRating?: number;
  courtCost?: number;
}) {
  const user = await requireAuth();
  const { racketIds, ...rest } = data;
  const session = await prisma.playSession.create({
    data: { ...rest, userId: user.id, date: new Date(data.date) },
  });
  await prisma.playSessionRacket.createMany({
    data: racketIds.map((racketId) => ({ sessionId: session.id, racketId, userId: user.id })),
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
    racketIds?: string[];
    performanceNotes?: string;
    controlRating?: number;
    powerRating?: number;
    comfortRating?: number;
    courtCost?: number | null;
  }
) {
  const user = await requireAuth();
  const { racketIds, ...rest } = data;
  await prisma.playSession.updateMany({
    where: { id, userId: user.id },
    data: { ...rest, date: rest.date ? new Date(rest.date) : undefined },
  });
  if (racketIds) {
    await prisma.playSessionRacket.deleteMany({ where: { sessionId: id, userId: user.id } });
    await prisma.playSessionRacket.createMany({
      data: racketIds.map((racketId) => ({ sessionId: id, racketId, userId: user.id })),
    });
  }
  revalidatePath("/sessions");
  revalidatePath("/");
}

export async function deleteSession(id: string, deleteGroup = false) {
  const user = await requireAuth();
  if (deleteGroup) {
    const session = await prisma.playSession.findFirst({
      where: { id, userId: user.id },
      select: { recurringGroupId: true },
    });
    if (session?.recurringGroupId) {
      await prisma.playSession.deleteMany({
        where: { recurringGroupId: session.recurringGroupId, userId: user.id },
      });
      revalidatePath("/sessions");
      revalidatePath("/");
      return;
    }
  }
  await prisma.playSession.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/sessions");
  revalidatePath("/");
}

export async function getRecurringGroupCount(groupId: string) {
  const user = await requireAuth();
  return prisma.playSession.count({
    where: { recurringGroupId: groupId, userId: user.id },
  });
}

export async function createRecurringSessions(
  sessionData: {
    sessionType: string;
    durationMinutes: number;
    racketIds: string[];
    performanceNotes?: string;
    controlRating?: number;
    powerRating?: number;
    comfortRating?: number;
    courtCost?: number;
    startTime: string; // HH:mm — applied to every generated date
  },
  recurrence: {
    daysOfWeek: number[]; // 0=Sun … 6=Sat
    period: "month" | "year" | "custom";
    month?: number; // 1-12; defaults to current month when period='month'
    year?: number;  // defaults to current year
    endDate?: string; // ISO date string; used when period='custom'
  }
) {
  if (!recurrence.daysOfWeek.length) {
    throw new Error("At least one day of week is required.");
  }

  const user = await requireAuth();
  const now = new Date();
  const year = recurrence.year ?? now.getFullYear();

  let rangeStart: Date;
  let rangeEnd: Date;

  if (recurrence.period === "month") {
    const month = (recurrence.month ?? now.getMonth() + 1) - 1; // 0-indexed
    rangeStart = new Date(year, month, 1);
    rangeEnd = new Date(year, month + 1, 1);
  } else if (recurrence.period === "year") {
    rangeStart = new Date(year, 0, 1);
    rangeEnd = new Date(year + 1, 0, 1);
  } else {
    // custom
    if (!recurrence.endDate) throw new Error("endDate is required for custom period.");
    rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    const end = new Date(recurrence.endDate);
    end.setHours(23, 59, 59, 999);
    rangeEnd = end;
  }

  const dates = generateRecurringDates(recurrence.daysOfWeek, rangeStart, rangeEnd);

  const MAX_SESSIONS = 365;
  if (dates.length > MAX_SESSIONS) {
    throw new Error(
      `This recurrence would create ${dates.length} sessions. Maximum allowed is ${MAX_SESSIONS}. Narrow the date range or reduce the days selected.`
    );
  }
  if (dates.length === 0) {
    throw new Error("No matching dates found in the selected range.");
  }

  // Apply the user's chosen time to each date
  const [hh, mm] = sessionData.startTime.split(":").map(Number);
  const groupId = crypto.randomUUID();

  const records = dates.map((d) => {
    const date = new Date(d);
    date.setHours(hh, mm, 0, 0);
    return {
      userId: user.id,
      date,
      sessionType: sessionData.sessionType,
      durationMinutes: sessionData.durationMinutes,
      performanceNotes: sessionData.performanceNotes ?? null,
      controlRating: sessionData.controlRating ?? null,
      powerRating: sessionData.powerRating ?? null,
      comfortRating: sessionData.comfortRating ?? null,
      courtCost: sessionData.courtCost ?? null,
      recurringGroupId: groupId,
    };
  });

  // createMany doesn't support nested relations; insert sessions then links separately
  await prisma.playSession.createMany({ data: records });
  const created = await prisma.playSession.findMany({
    where: { recurringGroupId: groupId, userId: user.id },
    select: { id: true },
  });
  const links = created.flatMap((s) =>
    sessionData.racketIds.map((racketId) => ({ sessionId: s.id, racketId, userId: user.id }))
  );
  if (links.length > 0) {
    await prisma.playSessionRacket.createMany({ data: links, skipDuplicates: true });
  }
  revalidatePath("/sessions");
  revalidatePath("/rackets");
  revalidatePath("/");
  return { count: records.length, groupId };
}

export async function getLastSession() {
  const user = await requireAuth();
  return prisma.playSession.findFirst({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    include: {
      rackets: { include: { racket: { select: { id: true, brand: true, model: true } } } },
    },
  });
}

// One-shot backfill: copies existing racketId values into PlaySessionRacket.
// Safe to run multiple times (skipDuplicates). Call once after deployment.
export async function backfillSessionRackets() {
  await requireAdmin();
  const sessions = await prisma.playSession.findMany({
    where: { racketId: { not: null } },
    select: { id: true, racketId: true, userId: true },
  });
  const rows = sessions
    .filter((s) => s.racketId !== null)
    .map((s) => ({ sessionId: s.id, racketId: s.racketId!, userId: s.userId }));
  const result = await prisma.playSessionRacket.createMany({ data: rows, skipDuplicates: true });
  return { migrated: result.count };
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

// ─── Feedback Actions ───────────────────────────────────────────

export async function getFeedback() {
  const user = await requireAuth();
  return prisma.feedback.findMany({
    where: user.isAdmin ? undefined : { userId: user.id },
    include: { user: { select: { name: true, email: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createFeedback(data: {
  type: string;
  priority: string;
  title: string;
  description: string;
}) {
  const user = await requireAuth();
  const feedback = await prisma.feedback.create({
    data: { ...data, userId: user.id },
  });
  revalidatePath("/feedback");
  return feedback;
}

export async function updateFeedbackStatus(id: string, status: string) {
  const user = await requireAuth();
  await prisma.feedback.updateMany({
    where: user.isAdmin ? { id } : { id, userId: user.id },
    data: { status },
  });
  revalidatePath("/feedback");
}

export async function deleteFeedback(id: string) {
  const user = await requireAuth();
  await prisma.feedback.deleteMany({
    where: user.isAdmin ? { id } : { id, userId: user.id },
  });
  revalidatePath("/feedback");
}

// ─── Admin Actions ──────────────────────────────────────────────

export async function getAllUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          rackets: true,
          playSessions: true,
          stringings: true,
          feedbacks: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  // Cascade deletes handle related records
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
}

export async function getAnalyticsData() {
  const user = await requireAuth();

  const [rackets, sessions, stringings, shuttles, profile] = await Promise.all([
    prisma.racket.findMany({
      where: { userId: user.id },
      include: {
        sessionLinks: { include: { session: { select: { durationMinutes: true, date: true } } } },
        stringings: true,
      },
    }),
    prisma.playSession.findMany({
      where: { userId: user.id },
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

  // Racket usage — via join table
  const racketUsage = rackets.map((r) => ({
    id: r.id,
    name: `${r.brand} ${r.model}`,
    sessionCount: r.sessionLinks.length,
    totalHours:
      Math.round(
        (r.sessionLinks.reduce((s, x) => s + x.session.durationMinutes, 0) / 60) * 10
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

  // Restring recommendations — via join table
  const restringRecommendations = rackets
    .filter((r) => !r.isArchived)
    .map((r) => {
      const lastStringing = r.stringings.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      const sessionsSinceStringing = lastStringing
        ? r.sessionLinks.filter((l) => l.session.date > lastStringing.date).length
        : r.sessionLinks.length;
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
