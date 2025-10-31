# Freepik AI Video Generator Clone

This repository now ships a fal.ai-powered recreation of Freepik's AI Video Generator alongside the original media whiteboard backend. The new experience pairs a React + Tailwind single-page app with secure serverless functions that forward generation requests to fal.ai and persist job metadata in Firestore.

## What’s inside

| Path | Description |
| --- | --- |
| `web/` | Vite + React frontend that captures prompts, uploads keyframes, and streams job updates from Firestore. |
| `api/` | Serverless handlers (`/api/generate`, `/api/webhook`) that enqueue fal.ai jobs and process webhook callbacks. |
| `docs/` | Architecture plan (`freepik-ai-video-plan.md`) and deployment checklist (`deployment-guide.md`). |
| `server.js` | Existing Express whiteboard backend that can continue to serve the legacy asset board if desired. |

## Quick start (AI video generator)

1. Install dependencies:

   ```bash
   npm install
   cd web
   npm install
   ```

2. Create environment files following [`docs/deployment-guide.md`](docs/deployment-guide.md). Frontend keys go in `web/.env.local` (prefixed with `VITE_`); backend secrets live in the root `.env.local`.

3. Run the Vite dev server (proxies API calls to `http://localhost:3000`):

   ```bash
   npm run dev --prefix web
   ```

4. Start your preferred backend runtime:

   - **Vercel-style**: `vercel dev` (if using Vercel CLI) to execute the functions under `api/`.
   - **Express legacy server**: `npm start` from the repo root to boot the original whiteboard service.

5. Open `http://localhost:5173` to use the generator UI. Submit a prompt (and optional keyframes); the app writes to Firestore and renders real-time updates as fal.ai processes the job.

For production deployment guidance—including environment variables, webhook registration, and Firestore structure—see [`docs/deployment-guide.md`](docs/deployment-guide.md).

# Media Whiteboard (legacy)

The historical Express whiteboard is still available and can run independently of the new generator frontend.

## Features

- Drag-and-drop uploads for images, videos and any other file types.
- Optional rename prompt toggled by the **Rename on drop** slider.
- Files stored on the server in the `uploads` directory with metadata saved for downloads.
- Video playback and image preview cards rendered directly on the canvas.
- Text note tool for quick annotations.
- Multi-select download box that returns either the renamed file or a zipped archive.

## Getting started

### 1. Install prerequisites

- [Node.js](https://nodejs.org/) version 18 or later (bundled `npm` is fine).
- Optional (for auto-restart during development): `npx` will install `nodemon` from `devDependencies` on demand.

Verify your Node.js installation:

```bash
node --version
npm --version
```

### 2. Install dependencies

From the project root run:

```bash
npm install
```

This pulls in the Express server, upload helpers, and the archiver utility used for multi-file downloads.

### 3. Start the server

For a regular run:

```bash
npm start
```

During development you can use auto-reload:

```bash
npm run dev
```

Either command starts the server at `http://localhost:3000` by default.

### 4. Open the whiteboard

Visit `http://localhost:3000` in your browser. The first load will create an `uploads/` directory next to `server.js` (if it does not already exist) where all incoming files are stored.

## Usage tips

- Toggle **Rename on drop** if you want the browser to prompt for a new filename every time you drop an asset onto the canvas. The tool keeps the original extension automatically.
- Drag files (images, videos, or other documents) from your desktop or use the **Upload** button. Each asset appears as a draggable card; videos will play inline, images show thumbnails, and unknown types show their filenames.
- Click the **Text Tool** button to add free-form notes that you can reposition like other cards.
- Use the asset selector on the right to pick one or more stored assets. Clicking **Download Selected** will return the renamed file directly when a single asset is selected, or a ZIP archive when multiple assets are chosen.
