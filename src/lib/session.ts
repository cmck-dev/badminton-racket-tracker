import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const cookieStore = cookies();
  const headersList = headers();

  const token = await getToken({
    req: {
      headers: Object.fromEntries(headersList.entries()),
      cookies: Object.fromEntries(
        cookieStore.getAll().map((c) => [c.name, c.value])
      ),
    } as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET!,
  });

  if (!token) {
    redirect("/auth/signin");
  }

  const userId = (token.id ?? token.sub) as string;

  if (!userId) {
    redirect("/auth/signin");
  }

  return {
    id: userId,
    name: (token.name as string | null) ?? null,
    email: (token.email as string | null) ?? null,
    image: (token.picture as string | null) ?? null,
  };
}
