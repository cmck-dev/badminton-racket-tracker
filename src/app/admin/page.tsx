import { requireAdmin } from "@/lib/session";
import { getAllUsers, getFeedback } from "@/lib/actions";
import { AdminClient } from "./client";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [users, feedbacks] = await Promise.all([getAllUsers(), getFeedback()]);
  return <AdminClient users={users} feedbacks={feedbacks} adminEmail={admin.email ?? ""} />;
}
