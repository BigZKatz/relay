"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  PenSquare,
  MessageSquare,
  Users,
  ClipboardList,
  Settings,
  Radio,
  Menu,
  X,
  Megaphone,
  UserSearch,
  CalendarCheck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type SidebarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function UserWidget({ user }: { user?: SidebarUser }) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="flex items-center gap-2.5">
      {user?.image ? (
        <img
          src={user.image}
          alt={user.name ?? "User"}
          className="w-7 h-7 rounded-full flex-shrink-0"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-200 truncate">{user?.name ?? "User"}</p>
        <p className="text-xs text-slate-500 truncate">{user?.email ?? ""}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="p-1 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        title="Sign out"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compose", label: "Compose", icon: PenSquare },
  { href: "/messages", label: "Threads", icon: MessageSquare },
  { href: "/blasts", label: "Blasts", icon: Megaphone },
  { href: "/prospects", label: "Prospects", icon: UserSearch },
  { href: "/applicants", label: "Applicants", icon: ClipboardList },
  { href: "/future-residents", label: "Future Residents", icon: CalendarCheck },
  { href: "/residents", label: "Residents", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <>
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

export default function Sidebar({ user }: { user?: SidebarUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white text-base">Relay</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 py-6 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-white tracking-wide text-lg leading-none">
                Relay
              </span>
              <p className="text-slate-400 text-xs mt-0.5">Property Messaging</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="px-4 py-4 border-t border-slate-700/50">
          <UserWidget user={user} />
        </div>
      </div>

      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-slate-900 text-slate-100 min-h-screen">
        <div className="px-5 py-6 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-white tracking-wide text-lg leading-none">
                Relay
              </span>
              <p className="text-slate-400 text-xs mt-0.5">Property Messaging</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="px-4 py-4 border-t border-slate-700/50">
          <UserWidget user={user} />
        </div>
      </aside>
    </>
  );
}
