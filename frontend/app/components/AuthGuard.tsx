"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

const PUBLIC_PATHS = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicPath) {
      router.push("/login");
    }

    if (user && isPublicPath) {
      router.push("/");
    }
  }, [user, loading, isPublicPath, router]);

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #446464, #385858)" }}>
            <span className="material-symbols-outlined text-white animate-spin">progress_activity</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium tracking-widest uppercase"
            style={{ fontFamily: "var(--font-manrope)" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!user && !isPublicPath) {
    return null;
  }

  // Don't render login/signup if authenticated
  if (user && isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
