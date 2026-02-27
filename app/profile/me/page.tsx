import type { Metadata } from "next";
import { ProfileMeClient } from "@/components/profile/ProfileMeClient";

export const metadata: Metadata = {
  title: "My Profile",
  description:
    "Trainer profile editor with avatar upload, privacy controls, and public profile settings."
};

export default function ProfileMePage() {
  return <ProfileMeClient />;
}
