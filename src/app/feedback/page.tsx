import { getFeedback } from "@/lib/actions";
import { requireAuth } from "@/lib/session";
import { FeedbackClient } from "./client";

export default async function FeedbackPage() {
  const user = await requireAuth();
  const feedbacks = await getFeedback();
  return <FeedbackClient initialFeedbacks={feedbacks} isAdmin={user.isAdmin} />;
}
