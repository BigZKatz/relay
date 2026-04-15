import { auth } from "@/auth";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session?.user} />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0" style={{ WebkitOverflowScrolling: "touch" }}>{children}</main>
    </div>
  );
}
