import { redirect } from "next/navigation";

interface RegionDetailPageProps {
  params: {
    region: string;
  };
}

export default function RegionDetailPage(_props: RegionDetailPageProps) {
  redirect("/maps");
}
