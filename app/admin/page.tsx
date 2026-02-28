import type { Metadata } from "next";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Control",
  description: "Enterprise-grade DexLoom backoffice with live analytics and user governance."
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
