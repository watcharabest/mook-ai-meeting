"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { TopNavBar } from "@/app/components/TopNavBar";
import { Footer } from "@/app/components/Footer";
import { useAuth } from "@/app/contexts/AuthContext";
import { listJobs, type Job } from "@/app/lib/api";

function getStatusStyle(status: string) {
  switch (status) {
    case "completed":
      return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
    case "transcribing":
    case "summarizing":
    case "queued":
      return "bg-primary-fixed text-on-primary-fixed-variant";
    case "failed":
      return "bg-error-container text-on-error-container";
    default:
      return "bg-surface-container-high text-on-surface-variant";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Summary Ready";
    case "transcribing":
      return "Transcribing";
    case "summarizing":
      return "Summarizing";
    case "queued":
      return "Queued";
    case "uploading":
      return "Uploading";
    case "uploaded":
      return "Uploaded";
    case "created":
      return "Created";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return "check_circle";
    case "transcribing":
    case "summarizing":
      return "progress_activity";
    case "queued":
      return "schedule";
    case "failed":
      return "error";
    default:
      return "mic";
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, getAccessToken } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const data = await listJobs(token);
      setJobs(data.jobs);
      setTotalJobs(data.total);
      setError(null);
    } catch (err) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError("Cannot connect to the server. This may be a CORS or network issue.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      }
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const completedJobs = jobs.filter((j) => j.status === "completed");
  const totalHours = jobs.reduce(
    (sum, j) => sum + (j.audio_duration_seconds || 0),
    0
  ) / 3600;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar />
      <div className="p-8 md:p-12 lg:p-20 max-w-screen-2xl mx-auto w-full">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold font-[var(--font-manrope)] text-on-background tracking-tight mb-4">
                {greeting}, Mook.
              </h2>
              <p className="text-on-surface-variant text-lg max-w-xl">
                {totalJobs > 0
                  ? `Your intelligence engine has processed ${completedJobs.length} of ${totalJobs} meetings. Here is your editorial digest.`
                  : "Upload your first meeting recording to get started with AI-powered transcription and summarization."}
              </p>
            </div>
            <button
              onClick={() => router.push("/upload")}
              className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 ambient-shadow hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined">cloud_upload</span>
              Upload New Recording
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-8 rounded-xl ambient-shadow border border-slate-100/50">
              <p className="font-[var(--font-label)] text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                Total Recorded Hours
              </p>
              <p className="text-4xl font-extrabold font-[var(--font-manrope)] text-primary">
                {totalHours.toFixed(1)}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                <span className="material-symbols-outlined text-sm">
                  trending_up
                </span>
                <span>{totalJobs} recordings total</span>
              </div>
            </div>
            <div className="bg-tertiary-container p-8 rounded-xl ambient-shadow">
              <p className="font-[var(--font-label)] text-xs uppercase tracking-widest text-on-tertiary-container mb-2">
                Summaries Completed
              </p>
              <p className="text-4xl font-extrabold font-[var(--font-manrope)] text-on-tertiary-container">
                {completedJobs.length}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-on-tertiary-container opacity-70">
                <span className="material-symbols-outlined text-sm">
                  check_circle
                </span>
                <span>All tasks synchronized</span>
              </div>
            </div>
            <div className="bg-secondary-container p-8 rounded-xl ambient-shadow">
              <p className="font-[var(--font-label)] text-xs uppercase tracking-widest text-on-secondary-container mb-2">
                Active Jobs
              </p>
              <p className="text-4xl font-extrabold font-[var(--font-manrope)] text-on-secondary-container">
                {jobs.filter((j) => !["completed", "failed"].includes(j.status)).length}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-on-secondary-container opacity-70">
                <span className="material-symbols-outlined text-sm">bolt</span>
                <span>Processing in progress</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Recordings */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold font-[var(--font-manrope)] text-on-background">
              Recent Recordings
            </h3>
            {totalJobs > 5 && (
              <Link
                href="/archive"
                className="text-sm font-semibold text-primary hover:underline"
              >
                View All Archive
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">
                  progress_activity
                </span>
                <p className="text-on-surface-variant text-sm">Loading your recordings...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-error-container/10 border border-error/20 rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-error text-3xl mb-2">cloud_off</span>
              <p className="text-error font-medium">{error}</p>
              <p className="text-on-surface-variant text-sm mt-1">
                Make sure the backend server is running at {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
              </p>
              <button
                onClick={() => { setLoading(true); setError(null); fetchJobs(); }}
                className="mt-4 bg-primary text-white px-5 py-2 rounded-xl font-semibold inline-flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer text-sm"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Retry
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-surface-container-low rounded-xl p-12 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200/50 mb-6 mx-auto">
                <span className="material-symbols-outlined text-4xl text-primary">
                  audio_file
                </span>
              </div>
              <h4 className="text-xl font-bold text-on-surface mb-2">No Recordings Yet</h4>
              <p className="text-on-surface-variant mb-6">
                Upload your first meeting audio to begin the editorial distillation.
              </p>
              <button
                onClick={() => router.push("/upload")}
                className="bg-primary text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">add</span>
                Upload First Recording
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  onClick={() =>
                    job.status === "completed"
                      ? router.push(`/summary/${job.id}`)
                      : router.push(`/jobs/${job.id}`)
                  }
                  className="group bg-surface-container-low hover:bg-surface-container-lowest transition-colors p-6 rounded-xl flex flex-col md:flex-row md:items-center gap-6 cursor-pointer border border-transparent hover:border-slate-100"
                >
                  <div className="h-14 w-14 rounded-lg bg-white flex items-center justify-center text-primary ambient-shadow group-hover:scale-110 transition-transform">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {getStatusIcon(job.status)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold font-[var(--font-manrope)] group-hover:text-primary transition-colors">
                      {job.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          calendar_today
                        </span>{" "}
                        {formatDate(job.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          schedule
                        </span>{" "}
                        {formatDuration(job.audio_duration_seconds)}
                      </span>
                      {job.language && job.language !== "auto" && (
                        <span className="flex items-center gap-1 uppercase text-xs font-semibold">
                          {job.detected_language || job.language}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`${getStatusStyle(job.status)} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider`}
                    >
                      {getStatusLabel(job.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}
