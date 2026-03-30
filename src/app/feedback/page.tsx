import { getFeedback } from "@/lib/actions";
import { FeedbackClient } from "./client";

export default async function FeedbackPage() {
  const feedbacks = await getFeedback();
  return <FeedbackClient initialFeedbacks={feedbacks} />;
}
