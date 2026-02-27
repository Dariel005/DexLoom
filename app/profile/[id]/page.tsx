import type { Metadata } from "next";
import { ProfilePublicClient } from "@/components/profile/ProfilePublicClient";

interface ProfilePublicPageProps {
  params: {
    id: string;
  };
}

export function generateMetadata({ params }: ProfilePublicPageProps): Metadata {
  return {
    title: `Trainer ${params.id} Profile`,
    description: "Public trainer profile with optional cross-module favorites showcase."
  };
}

export default function ProfilePublicPage({ params }: ProfilePublicPageProps) {
  return <ProfilePublicClient profileId={params.id} />;
}
