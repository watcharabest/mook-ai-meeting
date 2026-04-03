"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { AuthGuard } from "@/app/components/AuthGuard";
import { SideNavBar } from "@/app/components/SideNavBar";

const AUTH_PAGES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  return (
    <AuthProvider>
      <AuthGuard>
        {isAuthPage ? (
          /* Auth pages get full-screen layout — no sidebar */
          <>{children}</>
        ) : (
          /* App pages get sidebar layout */
          <div className="min-h-screen bg-background">
            <SideNavBar />
            <div className="lg:ml-64 min-h-screen flex flex-col">
              {children}
            </div>
          </div>
        )}
      </AuthGuard>
    </AuthProvider>
  );
}
