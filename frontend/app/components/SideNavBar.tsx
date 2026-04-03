"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

const navItems = [
  { path: "/", icon: "dashboard", label: "Dashboard" },
  { path: "/upload", icon: "cloud_upload", label: "Upload" },
  { path: "/archive", icon: "inventory_2", label: "Archive" },
];

export function SideNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 hidden lg:flex flex-col py-8 pl-4 pr-0 z-50 border-r border-slate-100">
      <div className="mb-10 pl-4">
        <h1 className="text-lg font-black text-slate-900 font-[var(--font-manrope)] tracking-wide uppercase">
          The Curator
        </h1>
        <p className="text-[10px] font-[var(--font-manrope)] tracking-widest text-slate-500 uppercase mt-1">
          Editorial Intelligence
        </p>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.label}
              href={item.path}
              className={`flex items-center gap-3 py-3 px-4 transition-all duration-200 rounded-l-full ${
                isActive
                  ? "text-slate-900 font-semibold bg-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:translate-x-1"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span className="font-[var(--font-manrope)]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="mt-auto pr-4 space-y-4">
        {user && (
          <div className="pl-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-lg">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">
                {user.email}
              </p>
              <button
                onClick={handleSignOut}
                className="text-[10px] text-error font-semibold uppercase tracking-wider hover:underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => router.push("/upload")}
          className="w-full bg-primary text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ambient-shadow hover:brightness-110 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          New Transcription
        </button>
      </div>
    </aside>
  );
}
