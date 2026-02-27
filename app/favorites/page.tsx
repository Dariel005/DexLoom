import type { Metadata } from "next";
import { FavoritesHubClient } from "@/components/favorites/FavoritesHubClient";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "Dedicated favorites dashboard outside profile settings."
};

export default function FavoritesPage() {
  return <FavoritesHubClient />;
}