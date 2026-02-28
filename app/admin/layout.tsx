import { Inter } from "next/font/google";
import { notFound, redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/auth-session";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (!user.permissions.accessAdmin) {
    notFound();
  }

  return <div className={inter.className}>{children}</div>;
}
