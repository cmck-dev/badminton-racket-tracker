import { getPlayerProfile } from "@/lib/actions";
import { ProfileClient } from "./client";

export default async function ProfilePage() {
  const profile = await getPlayerProfile();
  return <ProfileClient initialProfile={profile} />;
}
