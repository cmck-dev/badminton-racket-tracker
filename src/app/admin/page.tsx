import { requireAdmin } from "@/lib/session";
import { getAllUsers } from "@/lib/actions";
import { AdminClient } from "./client";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const users = await getAllUsers();
  return <AdminClient users={users} adminEmail={admin.email ?? ""} />;
}
