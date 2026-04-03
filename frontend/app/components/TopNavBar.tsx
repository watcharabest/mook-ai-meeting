"use client";

import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface TopNavBarProps {
  title?: string;
}

export function TopNavBar({ title = "Curator AI" }: TopNavBarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm border-b border-slate-100">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-6 font-[var(--font-manrope)] text-sm font-medium">
            <Link
              href="/"
              className="text-slate-500 hover:text-slate-800 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="text-slate-500 hover:text-slate-800 transition-colors"
            >
              Upload
            </Link>
            <Link
              href="/archive"
              className="text-slate-500 hover:text-slate-800 transition-colors"
            >
              Archive
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="bg-surface-container-high border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 w-64 outline-none"
              placeholder="Search archive..."
              type="text"
            />
          </div>
          <button className="p-2 text-slate-700 hover:bg-slate-100/50 rounded-lg transition-all cursor-pointer">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          {user && (
            <div className="relative group">
              <button className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center border border-slate-200 cursor-pointer">
                <span className="material-symbols-outlined text-primary text-lg">person</span>
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <p className="px-4 py-2 text-xs text-on-surface-variant truncate border-b border-slate-100">
                  {user.email}
                </p>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-error hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
