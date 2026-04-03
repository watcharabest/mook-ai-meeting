const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Authenticated fetch wrapper — attaches Supabase JWT to requests.
 */
async function apiFetch(
  path: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error: ${res.status}`);
  }

  return res;
}

// ── Job API ─────────────────────────────────────────

export interface CreateJobPayload {
  title: string;
  description?: string;
  language?: string;
  audio_filename: string;
  audio_size_bytes?: number;
  content_type?: string;
}

export interface CreateJobResponse {
  id: string;
  upload_url: string;
  storage_path: string;
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  error_message?: string;
  audio_filename?: string;
  audio_size_bytes?: number;
  audio_duration_seconds?: number;
  transcript?: string;
  utterances?: Array<{
    speaker: number;
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  summary?: {
    overview: string;
    key_themes: string[];
    sentiment: string;
    action_items: Array<{
      title: string;
      description: string;
      assignee: string;
      deadline: string;
    }>;
    decisions: string[];
    follow_ups: string[];
    participants_summary: Array<{
      speaker: string;
      role_or_context: string;
      key_contributions: string;
    }>;
  };
  language: string;
  detected_language?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export async function createJob(
  payload: CreateJobPayload,
  accessToken: string
): Promise<CreateJobResponse> {
  const res = await apiFetch("/api/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  }, accessToken);
  return res.json();
}

export async function startJob(
  jobId: string,
  accessToken: string
): Promise<{ message: string }> {
  const res = await apiFetch(`/api/jobs/${jobId}/start`, {
    method: "POST",
  }, accessToken);
  return res.json();
}

export async function listJobs(
  accessToken: string,
  limit = 20,
  offset = 0
): Promise<{ jobs: Job[]; total: number }> {
  const res = await apiFetch(
    `/api/jobs?limit=${limit}&offset=${offset}`,
    {},
    accessToken
  );
  return res.json();
}

export async function getJob(
  jobId: string,
  accessToken: string
): Promise<Job> {
  const res = await apiFetch(`/api/jobs/${jobId}`, {}, accessToken);
  return res.json();
}

export async function deleteJob(
  jobId: string,
  accessToken: string
): Promise<{ message: string }> {
  const res = await apiFetch(`/api/jobs/${jobId}`, {
    method: "DELETE",
  }, accessToken);
  return res.json();
}

export async function getDownloadUrl(
  jobId: string,
  accessToken: string
): Promise<{ download_url: string }> {
  const res = await apiFetch(
    `/api/storage/download/${jobId}`,
    {},
    accessToken
  );
  return res.json();
}
