# The Curator AI — Meeting Summary Platform

AI-powered meeting transcription and summarization platform. Upload audio recordings, get intelligent summaries with action items.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Frontend (Next.js on Vercel)              │
│         Supabase Realtime for live job status           │
└──────────┬───────────────────────────┬──────────────────┘
           │ REST API                  │ Realtime
           ▼                           ▼
┌──────────────────┐        ┌─────────────────────┐
│  FastAPI Backend │        │  Supabase            │
│  (Railway)       │        │  PostgreSQL + Auth   │
│  - JWT Auth      │        │  + Storage               │
│  - Upload URL    │        │  + Realtime              │
│  - Enqueue jobs  │        └──────────▲───────────┘
│                  │                   │ write direct
└──────┬───────────┘                   │
       │ enqueue                       │
       ▼                               │
┌──────────────┐                       │
│ Upstash Redis│                       │
│ (Celery broker)                      │
└──────┬───────┘                       │
       │ consume                       │
       ▼                               │
┌──────────────────────────────────────┴──────────────────┐
│                  API Worker (Railway / local)             │
│  1. Download audio ← Supabase Storage                   │
│  2. Gladia API → transcript + speaker diarization       │
│  3. Gemini 2.5 Flash API → summary + action items       │
│     (fallback: Gemini 2.5 Flash-Lite)                   │
│  4. Save results → Supabase DB (service key)            │
└─────────────────────────────────────────────────────────┘
```

> ✅ **Gladia** รองรับ Speaker Diarization (แยกเสียงผู้พูด) ในตัวเลย ไม่ต้องใช้ GPU

## Free Tier Limits

| Service | Limit | หมายเหตุ |
|---|---|---|
| Gladia API | 10 ชั่วโมง/เดือน | transcript + diarization ในตัว reset ทุกเดือน |
| Gemini 2.5 Flash | 250 req/วัน | fallback → Flash-Lite (1,000 req/วัน) |
| Supabase | 500MB DB / 1GB Storage | DB + Auth + Storage + Realtime ในที่เดียว |
| Upstash Redis | 10,000 req/วัน | เพียงพอสำหรับ queue |
| Railway | $5 free credit/เดือน | backend + worker แยก service, ไม่ sleep |
| Vercel | ฟรี (hobby) | frontend |

**รวมค่าใช้จ่าย: $0/เดือน** สำหรับ ≤20 meetings/วัน

## Project Structure

```
sum_meeting/
├── frontend/          # Next.js 14 (App Router) — deploy on Vercel
├── backend/           # FastAPI — deploy on Railway (backend/railway.toml)
├── worker/            # Celery Worker — deploy on Railway (worker/railway.toml)
├── supabase/          # SQL migrations and schema
│   ├── schema.sql
│   └── seed.sql
└── README.md
```

## Prerequisites

- Node.js 18+ (frontend)
- Python 3.11+ (backend + worker)
- ~~CUDA 12.1+ GPU~~ ไม่จำเป็นแล้ว
- Accounts: Supabase, Upstash Redis, Railway, Google AI Studio, Gladia

## Quick Start

### 1. Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable Email auth in Authentication > Providers
4. Go to Storage → Create bucket named `audio-files` → set to **private**
5. Note: Project URL, Anon Key, Service Role Key, JWT Secret

### 2. Upstash Redis Setup
1. Create database at [upstash.com](https://upstash.com)
2. Enable TLS
3. Note: Redis URL (starts with `rediss://`)

### 3. Gladia API Setup
1. Sign up at [app.gladia.io](https://app.gladia.io)
2. Create API key
3. Free tier: 10 ชั่วโมง/เดือน รวม diarization ฟรี reset ทุกเดือน
4. ไม่มี file size limit — ส่งได้เลย

### 4. Google AI Studio Setup
1. Get API key at [aistudio.google.com](https://aistudio.google.com)
2. Free tier: Gemini 2.5 Flash 250 req/วัน, Flash-Lite 1,000 req/วัน

### 5. Frontend (Next.js)
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in .env.local
npm run dev
```

### 6. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in .env
uvicorn app.main:app --reload
```

#### Deploy to Railway

1. Push code ขึ้น GitHub
2. ไปที่ [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. เลือก repo → Railway จะเจอ `railway.toml` อัตโนมัติ

**สร้าง Backend service:**
```
Railway Dashboard → New Service → GitHub Repo
  Root Directory: backend          ← สำคัญมาก!
  (Railway จะใช้ backend/Dockerfile และ backend/railway.toml)
```

**Environment Variables (Backend):**
```
SUPABASE_URL
SUPABASE_SERVICE_KEY
SUPABASE_JWT_SECRET
SUPABASE_STORAGE_BUCKET=audio-files
REDIS_URL
FRONTEND_URL=https://your-frontend.vercel.app
```

### 7. Worker (Celery — ไม่ต้องใช้ GPU)

**สร้าง Worker service (ใน Project เดียวกับ Backend):**
```
Railway Dashboard → New Service (in same project) → GitHub Repo
  Root Directory: worker           ← สำคัญมาก!
  (Railway จะใช้ worker/Dockerfile และ worker/railway.toml)
```

**Environment Variables (Worker):**
```
SUPABASE_URL
SUPABASE_SERVICE_KEY
SUPABASE_STORAGE_BUCKET=audio-files
REDIS_URL
GLADIA_API_KEY
GEMINI_API_KEY
```

## Environment Variables Summary

| Variable | Service | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Frontend | FastAPI URL on Railway |
| `SUPABASE_URL` | Backend + Worker | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend + Worker | Service role key (bypasses RLS) |
| `SUPABASE_JWT_SECRET` | Backend | For verifying user JWTs |
| `SUPABASE_STORAGE_BUCKET` | Backend + Worker | ชื่อ bucket (audio-files) |
| `REDIS_URL` | Backend + Worker | Upstash Redis TLS URL |
| `GLADIA_API_KEY` | Worker | Gladia API key (transcription + diarization) |
| `GEMINI_API_KEY` | Worker | Google AI Studio key (summarization) |
| ~~`HUGGINGFACE_TOKEN`~~ | ~~Worker~~ | ไม่จำเป็นแล้ว (ตัด pyannote ออก) |

## Upload Flow (Step by Step)

1. User fills upload form → clicks "Start Processing"
2. Frontend calls `POST /api/jobs` → FastAPI creates job record + returns Supabase Storage signed upload URL
3. Frontend uploads audio **directly** to Supabase Storage (bypasses FastAPI — no bandwidth cost)
4. Frontend calls `POST /api/jobs/{id}/start` → FastAPI enqueues Celery task
5. Frontend redirects to `/jobs/{id}` page (realtime status)
6. Worker picks up task:
   - Download audio from Supabase Storage
   - ส่งไปที่ Gladia API → ได้ transcript + speaker diarization
   - ส่ง transcript ไปที่ Gemini Flash API → ได้ summary + action items
   - เขียนผลลัพธ์ลง Supabase DB โดยตรง
   - **ลบไฟล์ audio ออกจาก Storage** (ประหยัด space — เก็บแค่ text)
7. Supabase Realtime pushes updates → frontend shows live progress
8. On completion → "View Summary" button appears → `/summary/{id}`

## Worker Processing Logic

```python
async def process_job(job_id: str):
    # 1. Download from Supabase Storage
    audio_bytes = supabase.storage.from_("audio-files").download(f"{job_id}.mp3")

    # 2. Transcribe + Diarize via Gladia
    response = gladia_client.audio.transcribe({
        "audio_url": supabase.storage.from_("audio-files").create_signed_url(
            f"{job_id}.mp3", expires_in=300
        )["signedURL"],
        "diarization": True,          # แยกเสียงผู้พูด
        "language": "th",             # หรือ "en" หรือ None (auto-detect)
        "diarization_max_speakers": 10
    })

    transcript = response.result.transcription.full_transcript
    utterances = response.result.transcription.utterances  # มี speaker label

    # 3. Summarize via Gemini Flash
    try:
        summary = gemini_flash.generate(transcript)
    except RateLimitError:
        summary = gemini_flash_lite.generate(transcript)  # fallback

    # 4. Save to Supabase (direct — ไม่ผ่าน FastAPI)
    supabase.table("jobs").update({
        "status": "completed",
        "transcript": transcript,
        "utterances": utterances,     # speaker A/B/C + timestamps
        "summary": summary,
    }).eq("id", job_id).execute()

    # 5. ลบไฟล์ audio — ไม่ต้องเก็บหลัง process เสร็จ
    supabase.storage.from_("audio-files").remove([f"{job_id}.mp3"])
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/jobs` | Create job + get Supabase Storage upload URL |
| POST | `/api/jobs/{id}/start` | Enqueue job after upload |
| GET | `/api/jobs` | List user's jobs |
| GET | `/api/jobs/{id}` | Get single job |
| DELETE | `/api/jobs/{id}` | Delete job + storage file |
| GET | `/api/storage/download/{id}` | Get signed download URL |

## License
MIT
