"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { TopNavBar } from "@/app/components/TopNavBar";
import { Footer } from "@/app/components/Footer";
import { useAuth } from "@/app/contexts/AuthContext";
import { listJobs, deleteJob, type Job } from "@/app/lib/api";

const ITEMS_PER_PAGE = 9;

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

function getIconForJob(index: number) {
  const icons = ["groups", "person", "auto_awesome", "description", "record_voice_over", "mic", "headphones", "campaign"];
  return icons[index % icons.length];
}

function getColorForJob(index: number) {
  const colors = [
    "bg-secondary-container text-on-secondary-container",
    "bg-tertiary-container text-on-tertiary-container",
    "bg-primary-container text-on-primary-container",
    "bg-surface-container text-on-surface-variant",
  ];
  return colors[index % colors.length];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return `${m}m`;
}

export default function ArchivePage() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalJobs / ITEMS_PER_PAGE));

  const fetchJobs = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAccessToken();
        if (!token) return;
        const offset = (page - 1) * ITEMS_PER_PAGE;
        const data = await listJobs(token, ITEMS_PER_PAGE, offset);
        setJobs(data.jobs);
        setTotalJobs(data.total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch recordings"
        );
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken]
  );

  useEffect(() => {
    fetchJobs(currentPage);
  }, [fetchJobs, currentPage]);

  const handleDelete = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this recording?")) return;
    setDeleting(jobId);
    try {
      const token = await getAccessToken();
      if (!token) return;
      await deleteJob(jobId, token);
      // Refetch current page
      fetchJobs(currentPage);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to delete recording"
      );
    } finally {
      setDeleting(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Find the most recent completed job for "featured" treatment
  const featuredJob = jobs.find((j) => j.status === "completed");
  const regularJobs = jobs.filter((j) => j !== featuredJob);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar title="Meeting Archive" />
      <div className="px-8 py-12 max-w-screen-2xl mx-auto w-full flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold font-[var(--font-manrope)] tracking-tight text-on-background mb-2">
              Meeting Archive
            </h1>
            <p className="text-on-surface-variant max-w-lg">
              Access and manage your library of intelligence. Every
              conversation, distilled and indexed for your convenience.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-container rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-background"
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{
                    fontVariationSettings:
                      viewMode === "grid" ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  grid_view
                </span>
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                  viewMode === "list"
                    ? "bg-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-background"
                }`}
              >
                <span className="material-symbols-outlined text-lg">list</span>
                List
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">
                progress_activity
              </span>
              <p className="text-on-surface-variant">
                Loading your archive...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-error-container/10 border border-error/20 rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-error text-4xl mb-3 block">
              cloud_off
            </span>
            <p className="text-error font-medium text-lg">{error}</p>
            <p className="text-on-surface-variant text-sm mt-2">
              Make sure the backend server is running at{" "}
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
            </p>
            <button
              onClick={() => fetchJobs(currentPage)}
              className="mt-6 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold inline-flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">refresh</span>
              Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-surface-container-low rounded-xl p-16 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200/50 mb-8 mx-auto">
              <span className="material-symbols-outlined text-5xl text-primary">
                folder_open
              </span>
            </div>
            <h4 className="text-2xl font-bold text-on-surface mb-3">
              No Recordings Yet
            </h4>
            <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
              Your meeting archive is empty. Upload your first recording to
              begin building your intelligence library.
            </p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-primary text-white px-8 py-3.5 rounded-xl font-semibold inline-flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer text-lg"
            >
              <span className="material-symbols-outlined">cloud_upload</span>
              Upload First Recording
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* ── Grid View ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Featured Card (first completed job) */}
            {featuredJob && currentPage === 1 && (
              <div
                className="group relative bg-primary text-on-primary p-8 rounded-3xl transition-all duration-300 hover:shadow-[0_12px_40px_rgba(68,100,100,0.2)] overflow-hidden cursor-pointer"
                onClick={() => router.push(`/summary/${featuredJob.id}`)}
              >
                <div className="absolute -right-10 -top-10 opacity-10">
                  <span className="material-symbols-outlined text-[160px]">
                    auto_awesome
                  </span>
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="bg-on-primary/20 text-white text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full">
                      Latest Summary
                    </span>
                    <span
                      className={`${getStatusStyle(featuredJob.status)} px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider`}
                    >
                      {getStatusLabel(featuredJob.status)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black font-[var(--font-manrope)] mb-4 leading-tight">
                    {featuredJob.title}
                  </h3>
                  {featuredJob.summary?.overview && (
                    <p className="text-white/70 text-sm mb-auto line-clamp-3">
                      {featuredJob.summary.overview}
                    </p>
                  )}
                  <div className="pt-8 flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {formatShortDate(featuredJob.created_at)}
                    </span>
                    {featuredJob.audio_duration_seconds && (
                      <>
                        <div className="h-1 w-1 rounded-full bg-on-primary/40" />
                        <span className="text-sm font-medium">
                          {formatDuration(featuredJob.audio_duration_seconds)}
                        </span>
                      </>
                    )}
                    <button
                      className="ml-auto w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/summary/${featuredJob.id}`);
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Cards */}
            {regularJobs.map((job, index) => (
              <div
                key={job.id}
                className={`group relative bg-surface-container-lowest p-8 rounded-3xl transition-all duration-300 hover:shadow-[0_12px_40px_rgba(43,52,55,0.05)] border border-transparent hover:border-outline-variant/10 cursor-pointer ${
                  deleting === job.id ? "opacity-50 pointer-events-none" : ""
                }`}
                onClick={() =>
                  job.status === "completed"
                    ? router.push(`/summary/${job.id}`)
                    : router.push(`/jobs/${job.id}`)
                }
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`h-12 w-12 ${getColorForJob(index).split(" ")[0]} rounded-2xl flex items-center justify-center`}
                  >
                    <span
                      className={`material-symbols-outlined ${getColorForJob(index).split(" ")[1]}`}
                    >
                      {getIconForJob(index)}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDelete(e, job.id)}
                      className="p-2 hover:bg-error-container/20 rounded-full text-error transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {deleting === job.id ? "progress_activity" : "delete"}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold font-[var(--font-manrope)] mb-2 line-clamp-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs">
                      calendar_today
                    </span>
                    {formatDate(job.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span
                    className={`${getStatusStyle(job.status)} text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full`}
                  >
                    {getStatusLabel(job.status)}
                  </span>
                  {job.audio_duration_seconds && (
                    <span className="bg-surface-container-high text-on-surface-variant text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
                      {formatDuration(job.audio_duration_seconds)}
                    </span>
                  )}
                  {job.detected_language && (
                    <span className="bg-surface-container-high text-on-surface-variant text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
                      {job.detected_language}
                    </span>
                  )}
                </div>
                <div className="pt-6 border-t border-outline-variant/10">
                  <div className="flex items-center justify-between group/link">
                    <span className="font-semibold text-primary">
                      {job.status === "completed"
                        ? "View Summary"
                        : "View Status"}
                    </span>
                    <span className="material-symbols-outlined group-hover/link:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Upload prompt card */}
            <div
              onClick={() => router.push("/upload")}
              className="group relative border-2 border-dashed border-outline-variant/30 p-8 rounded-3xl flex flex-col items-center justify-center text-center hover:bg-surface-container/30 transition-colors cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                  add
                </span>
              </div>
              <h4 className="font-bold text-on-surface-variant mb-1">
                Upload New Recording
              </h4>
              <p className="text-xs text-on-surface-variant/60 px-8">
                Add another meeting recording for AI-powered transcription and
                summarization.
              </p>
            </div>
          </div>
        ) : (
          /* ── List View ── */
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`group bg-surface-container-lowest hover:bg-surface-container-low transition-colors p-6 rounded-xl flex flex-col md:flex-row md:items-center gap-4 cursor-pointer border border-transparent hover:border-outline-variant/10 ${
                  deleting === job.id ? "opacity-50 pointer-events-none" : ""
                }`}
                onClick={() =>
                  job.status === "completed"
                    ? router.push(`/summary/${job.id}`)
                    : router.push(`/jobs/${job.id}`)
                }
              >
                <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-primary ambient-shadow group-hover:scale-105 transition-transform shrink-0">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {job.status === "completed"
                      ? "check_circle"
                      : job.status === "failed"
                        ? "error"
                        : "mic"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold font-[var(--font-manrope)] group-hover:text-primary transition-colors truncate">
                    {job.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        calendar_today
                      </span>
                      {formatDate(job.created_at)}
                    </span>
                    {job.audio_duration_seconds && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          schedule
                        </span>
                        {formatDuration(job.audio_duration_seconds)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`${getStatusStyle(job.status)} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider`}
                  >
                    {getStatusLabel(job.status)}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, job.id)}
                    className="p-2 hover:bg-error-container/20 rounded-full text-error/50 hover:text-error transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {deleting === job.id ? "progress_activity" : "delete"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination — only show if there are items */}
        {!loading && !error && totalJobs > 0 && (
          <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-outline-variant/10 pt-10">
            <div className="text-sm font-medium text-on-surface-variant">
              Showing{" "}
              <span className="text-on-background font-bold">
                {Math.min(
                  (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  totalJobs
                )}
                –
                {Math.min(currentPage * ITEMS_PER_PAGE, totalJobs)}
              </span>{" "}
              of{" "}
              <span className="text-on-background font-bold">{totalJobs}</span>{" "}
              summaries
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold cursor-pointer transition-colors ${
                      page === currentPage
                        ? "bg-primary text-white"
                        : "bg-surface-container hover:bg-surface-container-high"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
