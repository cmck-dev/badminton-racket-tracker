import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function requireAuth() {
  const cookieStore = cookies();

  // Database sessions store a UUID token in the cookie (not a JWT)
  const sessionToken =
    cookieStore.get("__Secure-next-auth.session-token")?.value ??
    cookieStore.get("next-auth.session-token")?.value;

  if (!sessionToken) {
    redirect("/auth/signin");
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) {
    redirect("/auth/signin");
  }

  const isAdmin =
    !!process.env.ADMIN_EMAIL &&
    session.user.email === process.env.ADMIN_EMAIL;

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    isAdmin,
  };
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!user.isAdmin) {
    redirect("/");
  }
  return user;
}
