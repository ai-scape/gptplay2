# Media Whiteboard

A lightweight whiteboard for organising video, image and other reference assets when planning film and media projects. Drag files onto the infinite-style canvas, optionally rename them as they are uploaded, and rearrange them freely.

## Features

- Drag-and-drop uploads for images, videos and any other file types.
- Optional rename prompt toggled by the **Rename on drop** slider.
- Files stored on the server in the `uploads` directory with metadata saved for downloads.
- Video playback and image preview cards rendered directly on the canvas.
- Text note tool for quick annotations.
- Inline controls to resize, manually rename, or remove any asset after it has been placed.
- Canvas navigation inspired by creative whiteboards: hold <kbd>Space</kbd> to pan, use zoom controls, and reset to re-center.
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
- Click **Add Text** to drop a note near the centre of your current view and reposition it like any other card.
- Use the ✎ button on a card to rename an asset at any time (the original file extension is preserved), or the ✕ button to remove it from both the board and the server.
- Drag the corner handle on any card to resize it. This is especially handy for mood boards or when you need a larger video viewport.
- Hold <kbd>Space</kbd> and drag anywhere on the background to pan the infinite canvas, or use the zoom controls in the toolbar. **Reset view** snaps the board back to centre.
- Use the asset selector on the right to pick one or more stored assets. Clicking **Download Selected** will return the renamed file directly when a single asset is selected, or a ZIP archive when multiple assets are chosen.
