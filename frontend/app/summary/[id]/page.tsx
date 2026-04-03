"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TopNavBar } from "@/app/components/TopNavBar";
import { Footer } from "@/app/components/Footer";
import { useAuth } from "@/app/contexts/AuthContext";
import { getJob, type Job } from "@/app/lib/api";

export default function SummaryDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { getAccessToken } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const data = await getJob(jobId, token);
      setJob(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summary");
    } finally {
      setLoading(false);
    }
  }, [jobId, getAccessToken]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleCopySummary = async () => {
    if (!job?.summary) return;
    const text = [
      `# ${job.title}`,
      "",
      "## Overview",
      job.summary.overview,
      "",
      "## Key Themes",
      ...(job.summary.key_themes || []).map((t) => `- ${t}`),
      "",
      "## Action Items",
      ...(job.summary.action_items || []).map(
        (a) => `- **${a.title}**: ${a.description} (${a.assignee}, ${a.deadline})`
      ),
      "",
      "## Decisions",
      ...(job.summary.decisions || []).map((d) => `- ${d}`),
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopNavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">
              progress_activity
            </span>
            <p className="text-on-surface-variant">Loading summary...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopNavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-error-container/10 border border-error/20 rounded-xl p-8 text-center max-w-md">
            <span className="material-symbols-outlined text-error text-3xl mb-2">error</span>
            <p className="text-error font-medium">{error || "Job not found"}</p>
            <Link href="/" className="text-primary font-semibold mt-4 inline-block hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const summary = job.summary;
  const utterances = job.utterances || [];
  const speakerCount = new Set(utterances.map((u) => u.speaker)).size;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    return `${m} Minutes`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar title={job.title} />
      <main className="p-8 lg:p-20 bg-background max-w-screen-2xl mx-auto w-full">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 text-on-surface-variant text-sm mb-4">
              <Link href="/">Dashboard</Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-on-background font-medium truncate max-w-xs">
                {job.title}
              </span>
            </nav>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-on-background leading-tight">
              {job.title}
            </h1>
            <div className="flex items-center gap-4 mt-4 text-on-surface-variant font-medium flex-wrap">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                {new Date(job.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">schedule</span>
                {formatDuration(job.audio_duration_seconds)}
              </span>
              {speakerCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">group</span>
                  {speakerCount} Participants
                </span>
              )}
              {(job.detected_language || job.language) && (
                <span className="flex items-center gap-1 uppercase text-xs font-bold bg-surface-container-high px-2 py-1 rounded">
                  {job.detected_language || job.language}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopySummary}
              className="bg-surface-container-high hover:bg-surface-container-highest px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined">
                {copySuccess ? "check" : "content_copy"}
              </span>
              {copySuccess ? "Copied!" : "Copy Summary"}
            </button>
          </div>
        </div>

        {/* Executive Overview + Action Items */}
        {summary ? (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            <div className="lg:col-span-2 bg-surface-container-lowest p-10 rounded-[2rem] shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-2 h-8 bg-primary rounded-full" />
                <h2 className="text-2xl font-bold text-on-background">Executive Overview</h2>
              </div>
              <p className="text-on-surface-variant leading-relaxed text-lg mb-8">
                {summary.overview || "No overview available."}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {summary.key_themes && summary.key_themes.length > 0 && (
                  <div className="p-6 bg-surface-container-low rounded-2xl">
                    <h3 className="font-bold text-on-background mb-2">Key Themes</h3>
                    <div className="flex flex-wrap gap-2">
                      {summary.key_themes.map((theme) => (
                        <span
                          key={theme}
                          className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-lg text-sm font-medium"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {summary.sentiment && (
                  <div className="p-6 bg-surface-container-low rounded-2xl">
                    <h3 className="font-bold text-on-background mb-2">Sentiment Analysis</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        trending_up
                      </span>
                      <span className="font-semibold text-on-background">{summary.sentiment}</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Decisions */}
              {summary.decisions && summary.decisions.length > 0 && (
                <div className="mt-6 p-6 bg-surface-container-low rounded-2xl">
                  <h3 className="font-bold text-on-background mb-3">Key Decisions</h3>
                  <ul className="space-y-2">
                    {summary.decisions.map((decision, i) => (
                      <li key={i} className="flex items-start gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary text-lg mt-0.5"
                              style={{ fontVariationSettings: "'FILL' 1" }}>
                          gavel
                        </span>
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Items */}
            <div className="bg-tertiary-container text-on-tertiary-container p-10 rounded-[2rem] flex flex-col shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
                <h2 className="text-2xl font-bold">Action Items</h2>
              </div>
              {summary.action_items && summary.action_items.length > 0 ? (
                <ul className="space-y-6 flex-1">
                  {summary.action_items.map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="min-w-[24px] h-6 rounded-full border-2 border-slate-400 flex items-center justify-center mt-1" />
                      <div>
                        <p className="font-bold">{item.title}</p>
                        <p className="text-sm opacity-80">{item.description}</p>
                        {(item.assignee || item.deadline) && (
                          <p className="text-xs opacity-60 mt-1">
                            {item.assignee && `📋 ${item.assignee}`}
                            {item.assignee && item.deadline && " · "}
                            {item.deadline && `📅 ${item.deadline}`}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm opacity-70">No action items extracted.</p>
              )}

              {/* Follow Ups */}
              {summary.follow_ups && summary.follow_ups.length > 0 && (
                <div className="mt-8 pt-6 border-t border-on-tertiary-container/10">
                  <h3 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-70">Follow Ups</h3>
                  <ul className="space-y-2">
                    {summary.follow_ups.map((fu, i) => (
                      <li key={i} className="text-sm opacity-80 flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm mt-0.5">arrow_right</span>
                        {fu}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mb-20 bg-surface-container-low rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">
              summarize
            </span>
            <p className="text-on-surface-variant">
              No summary available yet. The job may still be processing.
            </p>
          </section>
        )}

        {/* Transcript */}
        {utterances.length > 0 && (
          <section className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-on-background mb-10">Full Transcript</h2>
            <div className="space-y-8">
              {(showFullTranscript ? utterances : utterances.slice(0, 10)).map((utt, i) => (
                <div key={i} className="flex gap-8">
                  <div className="hidden md:block w-16 text-on-surface-variant text-sm font-mono pt-1">
                    {formatTime(utt.start)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-on-background">
                        Speaker {utt.speaker + 1}
                      </span>
                      <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        {formatTime(utt.start)} - {formatTime(utt.end)}
                      </span>
                    </div>
                    <p className="text-on-background leading-relaxed text-lg">
                      {utt.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {utterances.length > 10 && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setShowFullTranscript(!showFullTranscript)}
                  className="text-on-surface-variant hover:text-on-background font-semibold flex items-center gap-2 mx-auto transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">
                    {showFullTranscript ? "expand_less" : "expand_more"}
                  </span>
                  {showFullTranscript
                    ? "Show Less"
                    : `Show Full Transcript (${utterances.length} utterances)`}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Raw Transcript (if no utterances but transcript exists) */}
        {utterances.length === 0 && job.transcript && (
          <section className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-on-background mb-10">Full Transcript</h2>
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10">
              <p className="text-on-background leading-relaxed text-lg whitespace-pre-wrap">
                {showFullTranscript ? job.transcript : job.transcript.slice(0, 2000)}
              </p>
              {job.transcript.length > 2000 && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setShowFullTranscript(!showFullTranscript)}
                    className="text-on-surface-variant hover:text-on-background font-semibold flex items-center gap-2 mx-auto transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined">
                      {showFullTranscript ? "expand_less" : "expand_more"}
                    </span>
                    {showFullTranscript
                      ? "Show Less"
                      : `Show Full Transcript (${job.transcript.length.toLocaleString()} chars)`}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Participants Summary */}
        {summary?.participants_summary && summary.participants_summary.length > 0 && (
          <section className="max-w-4xl mx-auto mt-20">
            <h2 className="text-3xl font-bold text-on-background mb-10">Participants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {summary.participants_summary.map((p, i) => (
                <div key={i} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">person</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-background">{p.speaker}</p>
                      {p.role_or_context && (
                        <p className="text-xs text-on-surface-variant">{p.role_or_context}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    {p.key_contributions}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
