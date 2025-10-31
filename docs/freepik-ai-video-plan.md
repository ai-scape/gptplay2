# Freepik AI Video Generation Clone — Technical Plan

This document expands the implementation plan for recreating Freepik's AI Video Generator on top of **fal.ai**. It distills the research assumptions, feature scope, and workstreams into concrete engineering tasks that can be tackled inside this repository.

## 1. Product Goals & Scope

The goal is to deliver a web application that lets creators turn prompts and keyframes into short-form videos backed by fal.ai's hosted diffusion models. The minimum viable product will:

- Support **text-to-video** and **image-to-video** generation modes.
- Accept **prompt text**, **start image**, and optionally an **end image** (if supported by the selected model).
- Offer preset **aspect ratios / resolutions** and a basic **motion control** slider.
- Provide a **non-blocking UX**: users submit a job, watch its progress update live, and retrieve the generated clip when ready.
- Maintain a **persistent job history** per user for later downloads.

## 2. Architecture Overview

```
React SPA ──▶ Serverless API (/api/generate)
   │                    │
   │                    └──▶ fal.ai queue.submit (model inference)
   │
   └──▶ Firestore (jobs collection) ◀── /api/webhook (fal.ai callbacks)
```

1. **Frontend (React + Tailwind)** — Collects user input, initiates jobs, and subscribes to Firestore for real-time status changes.
2. **Backend glue (Vercel/Express functions)** — Owns secrets, forwards requests to fal.ai, and handles webhooks.
3. **fal.ai** — Executes the actual generation via an async queue.
4. **Firestore** — Persists job metadata and exposes live updates to the SPA.

## 3. fal.ai Model Shortlist

| Model | Strengths | Notes |
| --- | --- | --- |
| **Kling** | Highly dynamic cinematic clips, supports fine control parameters. | Larger compute costs; verify fal.ai quota. |
| **Stable Video Diffusion** | Reliable baseline for image-to-video; open-weights behavior. | Does not natively support end keyframes. |
| **Luma (if offered)** | Supports start+end keyframes similar to Freepik. | Confirm availability in fal.ai catalog; if unavailable, defer end-image feature. |

**Action items:**
- Verify fal.ai account access, inspect the [Marquee Video](https://fal.ai/models?category=video) catalog, and select one model with the required parameters.
- Capture the exact REST / SDK call signature (e.g., `fal.queue.submit(modelId, payload, { webhookUrl })`).

## 4. API Surface & Data Contracts

### 4.1 `/api/generate` (POST)

Request body example:
```json
{
  "mode": "image-to-video",
  "prompt": "A spaceship flying through a nebula",
  "startImage": "data:image/png;base64,...",
  "endImage": null,
  "resolution": "1024x576",
  "motion": 40
}
```

Processing steps:
1. Validate payload (mode, prompt, assets, presets).
2. Persist a Firestore doc: `/artifacts/{appId}/users/{userId}/generations/{requestId}` with `status: "queued"`.
3. Call `fal.queue.submit` with:
   - `model`: configurable via `process.env.FAL_MODEL_ID`.
   - `input` payload matching the selected model.
   - `webhookUrl`: `https://<domain>/api/webhook`.
4. Return `{ requestId }` to the SPA.

### 4.2 `/api/webhook` (POST)

fal.ai webhook body (simplified):
```json
{
  "request_id": "...",
  "status": "completed",
  "result": {
    "video_url": "https://fal.media/.../output.mp4"
  }
}
```

Handling logic:
1. Verify signature header (see fal.ai docs) using the shared secret.
2. Update Firestore document with `status`, `videoUrl`, `error` (if any), `completedAt`.
3. Optionally, emit analytics/log events.

### 4.3 `/api/jobs/:id` (GET)

Helper endpoint for local development that proxies Firestore job reads, allowing the SPA to poll without wiring Firebase (useful before client auth is ready).

## 5. Data Model

Firestore document schema (`generations` collection):

```json
{
  "id": "<requestId>",
  "userId": "<uid>",
  "mode": "image-to-video",
  "prompt": "...",
  "startImageUrl": "gs://...",
  "endImageUrl": null,
  "resolution": "1024x576",
  "motion": 40,
  "status": "processing", // queued | processing | complete | failed
  "videoUrl": null,
  "error": null,
  "createdAt": <timestamp>,
  "updatedAt": <timestamp>
}
```

Uploads can reside in Firebase Storage or a temporary signed URL bucket, referenced by the document.

## 6. Frontend Implementation Notes

- Use **Vite** for fast local dev (`npm create vite@latest client -- --template react`), add Tailwind via PostCSS config.
- Component layout:
  - `App`: orchestrates auth, job submission, and conditional rendering.
  - `GeneratorForm`: handles prompt + asset inputs, validates files, and sends the POST request.
  - `JobStatus`: subscribes to a Firestore document (`onSnapshot`) until completion.
  - `VideoPlayer`: previews and provides download CTA once `videoUrl` exists.
- Provide an **anonymous sign-in** fallback with Firebase Auth for quick onboarding.
- Persist pending job ID in `localStorage` to resume progress after refresh.

## 7. Backend Implementation Steps

1. **Environment Setup**
   - Add `.env` keys: `FAL_API_KEY`, `FAL_MODEL_ID`, `FAL_WEBHOOK_SECRET`, `FIREBASE_PROJECT_ID`, etc.
   - Configure Vercel project secrets to mirror `.env.local`.
2. **Serverless Handlers**
   - Implement `/api/generate` using Node `fetch` to call fal.ai queue endpoint.
   - Implement `/api/webhook` with signature verification (HMAC SHA-256).
   - Add `/api/jobs/[id]` for development polling (optional in production).
3. **Firebase Admin**
   - Use `firebase-admin` SDK in the serverless layer for Firestore writes.
   - Restrict rules so each authenticated UID can only access their own `generations` documents.

## 8. Testing Strategy

- **Unit tests**: mock fal.ai SDK responses and Firestore writes with `jest`.
- **Integration tests**: use a local emulator for Firestore, hitting the API routes end-to-end.
- **Manual QA**: confirm job lifecycle (queued → processing → complete), UI updates, and download flow.

## 9. Deployment Checklist

1. Provision Firebase project, set Firestore + Storage.
2. Deploy frontend and API routes to Vercel.
3. Register webhook endpoint in fal.ai console.
4. Configure domain + HTTPS for webhook verification.
5. Smoke-test text-to-video and image-to-video flows in production.

## 10. Future Enhancements

- Support multiple models with pricing indicators.
- Add credit usage tracking and billing integration.
- Implement collaborative boards for sharing generated clips.
- Queue prioritization and retry strategies for failed jobs.

---

## 11. Implementation Snapshot (Current Repository)

- **Frontend** — Vite + React app now lives in `web/`, featuring the generator form, Firestore-backed status widget, and video playback UI described above.
- **Backend** — Serverless function entrypoints reside in `api/` (`generate.js`, `webhook.js`) and proxy requests to fal.ai while persisting job metadata to Firestore using service account credentials.
- **Docs** — Deployment instructions, environment variables, and workflow notes are captured in `docs/deployment-guide.md`.

**Status:** Backend and frontend scaffolding implemented. Ready for environment configuration, integration testing against live fal.ai models, and iterative UX polish.
