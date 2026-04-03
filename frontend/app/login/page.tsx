"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/app/lib/supabase";

const BackgroundLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-background">
    <div className="absolute inset-0 silk-gradient"></div>
    <div className="absolute inset-0 line-pattern opacity-50"></div>
    <div className="absolute inset-0 grain-texture"></div>
    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-container/10 blur-[150px] rounded-full"></div>
    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary-container/10 blur-[150px] rounded-full"></div>

    <main className="w-full max-w-[480px] relative z-10 p-6">
      {children}
      <div className="mt-8 text-center">
        <p className="text-[10px] font-label uppercase tracking-[0.25em] text-on-surface-variant/40">
          Mook AI © 2026
        </p>
      </div>
    </main>

  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <BackgroundLayout>
      <div className="bg-surface-container-lowest editorial-shadow overflow-hidden border border-white/40 backdrop-blur-sm rounded-[24px]">
        <div className="pt-12 pb-8 px-8 md:px-12 text-center">
          <div className="mb-4">
            <span className="text-primary font-headline font-bold tracking-tighter text-2xl">The Curator</span>
          </div>
          <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight mb-2">Sign In</h2>
          <p className="text-on-surface-variant text-sm font-body max-w-xs mx-auto">Access your sanctuary of focused editorial intelligence.</p>
        </div>

        <div className="px-8 md:px-12 pb-12">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-error-container/20 border border-error/20 text-error text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant mb-2 ml-1" htmlFor="email">Email Address</label>
              <input
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3.5 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all duration-200 outline-none"
                id="email"
                name="email"
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant" htmlFor="password">Password</label>
                <button type="button" className="text-[10px] font-label uppercase tracking-[0.2em] text-primary font-bold hover:text-primary-dim transition-colors">Forgot?</button>
              </div>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3.5 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all duration-200 outline-none"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 px-1">
              <input
                className="w-4 h-4 rounded-md border-outline-variant/30 text-primary focus:ring-primary/20 bg-surface-container-low text-primary"
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="text-xs text-on-surface-variant font-body cursor-pointer select-none" htmlFor="remember">Remember this device</label>
            </div>

            <button
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-primary text-on-primary py-4 rounded-xl font-headline font-bold text-base hover:shadow-lg hover:bg-primary-dim transition-all duration-300 transform active:scale-[0.99] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
            <button
              type="button"
              className="w-full py-3.5 rounded-xl border-2 border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-low text-on-surface font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer"
              onClick={async () => {
                await supabase.auth.signInWithOAuth({ provider: "google" });
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </BackgroundLayout>
  );
}