"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopNavBar } from "@/app/components/TopNavBar";
import { Footer } from "@/app/components/Footer";
import { useAuth } from "@/app/contexts/AuthContext";
import { createJob, startJob } from "@/app/lib/api";

const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/ogg",
  "audio/webm",
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export default function UploadPage() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("auto");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
      setError("Unsupported file type. Please upload MP3, WAV, M4A, OGG, or WebM.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File exceeds 500MB limit.");
      return;
    }

    setFile(selectedFile);

    // Auto-fill title from filename if empty
    if (!title) {
      const name = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, [title]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;

    setError(null);
    setUploading(true);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      // Step 1: Create job and get upload URL
      setUploadStep("Creating job...");
      setUploadProgress(10);

      const contentType = file.type || "audio/mpeg";
      const jobResponse = await createJob(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          language,
          audio_filename: file.name,
          audio_size_bytes: file.size,
          content_type: contentType,
        },
        token
      );

      // Step 2: Upload directly to Supabase Storage
      setUploadStep("Uploading audio...");
      setUploadProgress(30);

      const uploadRes = await fetch(jobResponse.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.statusText}`);
      }

      setUploadProgress(80);

      // Step 3: Notify backend to start processing
      setUploadStep("Starting processing...");
      await startJob(jobResponse.id, token);

      setUploadProgress(100);
      setUploadStep("Done! Redirecting...");

      // Redirect to job status page
      setTimeout(() => {
        router.push(`/jobs/${jobResponse.id}`);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setUploadProgress(0);
      setUploadStep("");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar title="Upload Content" />
      <section className="flex-1 flex items-center justify-center px-6 py-12 md:px-20 lg:px-40">
        <div className="w-full max-w-2xl space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-on-background tracking-tight mb-4">
              Feed the intelligence.
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-xl mx-auto">
              Upload your audio files to begin the editorial distillation. Our AI
              identifies key speakers, extracts core insights, and generates
              high-fidelity summaries.
            </p>
          </div>

          <div className="space-y-8">
            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-error-container/20 border border-error/20 text-error text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative rounded-[2rem] border-2 border-dashed transition-all cursor-pointer p-12 flex flex-col items-center justify-center text-center overflow-hidden ${
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : file
                  ? "border-primary/30 bg-primary-container/10"
                  : "border-outline-variant/30 hover:border-primary/50 bg-surface-container-low"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.webm,audio/*"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleFileSelect(selected);
                }}
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-primary pointer-events-none" />
              <div className="relative z-10">
                {file ? (
                  <>
                    <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center shadow-xl shadow-primary/10 mb-6 mx-auto">
                      <span className="material-symbols-outlined text-4xl text-primary"
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                        audio_file
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-on-surface mb-1">
                      {file.name}
                    </h3>
                    <p className="text-on-surface-variant font-medium">
                      {formatFileSize(file.size)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="mt-4 px-4 py-2 text-sm bg-surface-container-high text-on-surface-variant rounded-full hover:bg-error-container hover:text-on-error-container transition-all cursor-pointer"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200/50 mb-6 mx-auto group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-4xl text-primary">
                        audio_file
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface mb-2">
                      Drop your audio file here
                    </h3>
                    <p className="text-on-surface-variant font-medium">
                      MP3, WAV, M4A, OGG, or WebM up to 500MB
                    </p>
                    <button className="mt-8 px-8 py-3 bg-slate-200 text-on-surface font-semibold rounded-full hover:bg-primary hover:text-white transition-all cursor-pointer">
                      Select from Computer
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1"
                       htmlFor="meeting-name">
                  Meeting Name *
                </label>
                <input
                  id="meeting-name"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant outline-none"
                  placeholder="Enter meeting title..."
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1"
                       htmlFor="meeting-description">
                  Description
                </label>
                <textarea
                  id="meeting-description"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant min-h-[100px] resize-none outline-none"
                  placeholder="Optional context for the AI..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1"
                       htmlFor="language-select">
                  Language
                </label>
                <select
                  id="language-select"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface outline-none cursor-pointer"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="th">Thai (ไทย)</option>
                  <option value="en">English</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                  <option value="ko">Korean</option>
                </select>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary animate-spin">
                    progress_activity
                  </span>
                  <span className="font-semibold text-on-surface">{uploadStep}</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${uploadProgress}%`,
                      background: "linear-gradient(90deg, #446464, #385858)",
                    }}
                  />
                </div>
                <p className="text-xs text-on-surface-variant mt-2 text-right">
                  {uploadProgress}%
                </p>
              </div>
            )}

            {/* Submit */}
            {!uploading && (
              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!file || !title.trim()}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg tracking-tight shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 group transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                >
                  <span>Start Processing</span>
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                    bolt
                  </span>
                </button>
                {file && (
                  <p className="text-center text-[10px] text-on-surface-variant mt-4 uppercase tracking-[0.2em] font-bold">
                    Ready to analyze 1 file: {file.name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
