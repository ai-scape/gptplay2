# Media Whiteboard

A lightweight whiteboard for organising video, image and other reference assets when planning film and media projects. Drag files onto the infinite-style canvas, optionally rename them as they are uploaded, and rearrange them freely.

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
