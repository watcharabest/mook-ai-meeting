"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopNavBar } from "@/app/components/TopNavBar";
import { Footer } from "@/app/components/Footer";
import { useAuth } from "@/app/contexts/AuthContext";
import { getJob, type Job } from "@/app/lib/api";
import { supabase } from "@/app/lib/supabase";

const STATUS_STEPS = [
  { status: "created", label: "Created", icon: "note_add" },
  { status: "uploading", label: "Uploading", icon: "cloud_upload" },
  { status: "queued", label: "Queued", icon: "schedule" },
  { status: "transcribing", label: "Transcribing", icon: "mic" },
  { status: "summarizing", label: "Summarizing", icon: "summarize" },
  { status: "completed", label: "Completed", icon: "check_circle" },
];

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
}

export default function JobStatusPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { getAccessToken } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const data = await getJob(jobId, token);
      setJob(data);

      // Auto-redirect if completed
      if (data.status === "completed") {
        router.push(`/summary/${jobId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job");
    } finally {
      setLoading(false);
    }
  }, [jobId, getAccessToken, router]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Realtime subscription for job updates
  useEffect(() => {
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const updated = payload.new as Job;
          setJob(updated);
          if (updated.status === "completed") {
            setTimeout(() => router.push(`/summary/${jobId}`), 1500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, router]);

  const currentStepIndex = job ? getStepIndex(job.status) : 0;
  const isFailed = job?.status === "failed";

  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar title="Job Status" />
      <section className="flex-1 flex items-center justify-center px-6 py-12 md:px-20">
        <div className="w-full max-w-2xl">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">
                progress_activity
              </span>
              <p className="text-on-surface-variant">Loading job status...</p>
            </div>
          ) : error ? (
            <div className="bg-error-container/10 border border-error/20 rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-error text-3xl mb-2">error</span>
              <p className="text-error font-medium">{error}</p>
            </div>
          ) : job ? (
            <div className="space-y-10">
              {/* Job Title */}
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-black text-on-background tracking-tight mb-2">
                  {job.title}
                </h1>
                {job.description && (
                  <p className="text-on-surface-variant">{job.description}</p>
                )}
              </div>

              {/* Failed State */}
              {isFailed && (
                <div className="bg-error-container/20 border border-error/30 rounded-2xl p-8 text-center">
                  <span className="material-symbols-outlined text-error text-4xl mb-3">error</span>
                  <h3 className="text-xl font-bold text-error mb-2">Processing Failed</h3>
                  <p className="text-on-surface-variant">{job.error_message || "An unknown error occurred."}</p>
                </div>
              )}

              {/* Progress Steps */}
              {!isFailed && (
                <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow">
                  <div className="space-y-1">
                    {STATUS_STEPS.map((step, i) => {
                      const isActive = i === currentStepIndex;
                      const isDone = i < currentStepIndex;
                      const isPending = i > currentStepIndex;

                      return (
                        <div key={step.status} className="flex items-center gap-4 py-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              isDone
                                ? "bg-primary text-on-primary"
                                : isActive
                                ? "bg-primary-container text-primary ring-2 ring-primary/30"
                                : "bg-surface-container-high text-outline-variant"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-lg ${isActive ? "animate-pulse" : ""}`}
                              style={isDone ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            >
                              {isDone ? "check" : step.icon}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p
                              className={`font-semibold ${
                                isDone
                                  ? "text-on-surface"
                                  : isActive
                                  ? "text-primary"
                                  : "text-outline-variant"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                          {isActive && (
                            <span className="material-symbols-outlined text-primary animate-spin text-lg">
                              progress_activity
                            </span>
                          )}
                          {isDone && (
                            <span className="material-symbols-outlined text-primary text-lg"
                                  style={{ fontVariationSettings: "'FILL' 1" }}>
                              check_circle
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${job.progress}%`,
                          background: "linear-gradient(90deg, #446464, #385858)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2 text-right font-mono">
                      {job.progress}%
                    </p>
                  </div>
                </div>
              )}

              {/* Job Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-low rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">File</p>
                  <p className="text-sm font-semibold text-on-surface truncate">{job.audio_filename}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Size</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {job.audio_size_bytes
                      ? `${(job.audio_size_bytes / (1024 * 1024)).toFixed(1)} MB`
                      : "—"}
                  </p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Language</p>
                  <p className="text-sm font-semibold text-on-surface uppercase">{job.detected_language || job.language}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-4 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Created</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Back Button */}
              <div className="text-center">
                <button
                  onClick={() => router.push("/")}
                  className="text-on-surface-variant hover:text-on-surface font-semibold flex items-center gap-2 mx-auto transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <Footer />
    </div>
  );
}
