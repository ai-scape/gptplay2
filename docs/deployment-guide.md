# Freepik AI Video Clone Deployment Guide

This guide describes the configuration required to deploy the Freepik-style video generator using fal.ai for inference and Firestore for persistence.

## Environment variables

Configure these variables in your hosting provider (e.g., Vercel project settings) and in your local `.env` files.

| Name | Description |
| ---- | ----------- |
| `FAL_API_KEY` | fal.ai API key with permissions to enqueue jobs on the selected model. |
| `FAL_MODEL_ID` | Fully-qualified fal.ai model name (e.g., `fal-ai/fast-svd`). |
| `FAL_API_URL` | _(Optional)_ Override for the fal.ai queue endpoint. Defaults to `https://queue.fal.run/fal-ai`. |
| `FAL_WEBHOOK_SECRET` | _(Optional)_ Shared secret for validating webhook payloads from fal.ai. |
| `PUBLIC_BASE_URL` | Publicly reachable base URL of the deployed app (used to construct webhook URLs). |
| `FIREBASE_PROJECT_ID` | Firebase project ID hosting your Firestore database. |
| `FIREBASE_SERVICE_ACCOUNT` | JSON string containing a Firebase service account (escape newlines). |
| `FIREBASE_ROOT_COLLECTION` | _(Optional)_ Top-level collection used to store generation docs. Defaults to `users`. |

### Firebase service account JSON

Use a least-privileged service account with the `Cloud Datastore User` role. Store the entire JSON in `FIREBASE_SERVICE_ACCOUNT` (convert newlines to `\n` when using `.env` files).

## Firestore structure

Documents are created under:

```
{FIREBASE_ROOT_COLLECTION}/{userId}/generations/{requestId}
```

Each document tracks:

- `status`: `processing`, `complete`, `failed`, etc.
- `prompt`: Original text prompt.
- `videoUrl`: Set when the job completes successfully.
- `error`: Error message on failure.
- `startImageProvided` / `endImageProvided`: Boolean flags.
- `createdAt`, `updatedAt`: ISO timestamps.

## Vercel setup

1. **Frontend** – Deploy the `web` Vite React app with the following environment variables (prefixed with `VITE_`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIRESTORE_ROOT_COLLECTION` (optional override)

2. **Serverless functions** – Deploy the `api` directory as Vercel Functions. Ensure the same environment variables from the table above are configured for the backend runtime.

3. **Webhook** – In fal.ai dashboard, configure the webhook endpoint to `https://<your-domain>/api/webhook`. Jobs created through `/api/generate` append `?userId=<uid>` automatically.

4. **Authentication** – The frontend signs users in anonymously using Firebase Authentication. Ensure anonymous auth is enabled in the Firebase console.

## Local development

1. Install dependencies:

   ```bash
   npm install
   cd web
   npm install
   ```

2. Create `.env.local` at the repository root for the backend values and `web/.env.local` for frontend values.

3. Start the backend (existing Express server or `vercel dev`) and frontend:

   ```bash
   npm run dev --prefix web
   ```

   The Vite dev server proxies `/api/*` requests to `http://localhost:3000`.

## fal.ai model notes

- The payload builder maps UI selections to fal.ai parameters (`video_size`, `motion_bucket_id`, `image_url`, etc.).
- Additional model-specific options can be passed via the `metadata` object supplied in the `POST /api/generate` request.
- If your chosen model requires file uploads instead of data URLs, swap the serialization logic to upload the files to object storage and pass the resulting URLs to fal.ai.
