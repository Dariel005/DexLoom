import type { Metadata } from "next";
import { SocialHubClient } from "@/components/social/SocialHubClient";

export const metadata: Metadata = {
  title: "Trainer Social",
  description: "Friend requests and social network hub for trainer profiles."
};

export default function SocialPage() {
  return <SocialHubClient />;
}