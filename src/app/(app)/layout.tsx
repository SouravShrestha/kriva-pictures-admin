import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
