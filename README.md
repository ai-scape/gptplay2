# Media Whiteboard

A lightweight whiteboard for organising video, image and other reference assets when planning film and media projects. Drag files onto the infinite-style canvas, optionally rename them as they are uploaded, and rearrange them freely.

## Features

- Drag-and-drop uploads for images, videos and any other file types.
- Optional rename prompt toggled by the **Rename on drop** slider.
- Files stored on the server in the `uploads` directory with metadata saved for downloads.
- Video playback and image preview cards rendered directly on the canvas.
- Text note tool for quick annotations.
- Inline controls to resize, manually rename, or remove any asset after it has been placed.
- Canvas-driven selection: click to focus an asset, shift-click or marquee drag to build multi-select groups, and download them with one action.
- Canvas navigation inspired by creative whiteboards: hold <kbd>Space</kbd> to pan, use zoom controls, and reset to re-center.
- Download the current selection as either individual files or an automatic ZIP when multiple assets are highlighted.

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
- Drag files (images, videos, or other documents) from your desktop straight onto the canvas. Each asset appears as a draggable card; videos will play inline, images show thumbnails, and unknown types show their filenames.
- Click **Add Text** to drop a note near the centre of your current view and reposition it like any other card.
- Click a card to select it — the glowing border confirms it's active. Use the ✎ button or double-click the body to rename (the file extension is preserved automatically). Press ✕ or the <kbd>Delete</kbd> key to remove it from both the board and the server.
- Drag the corner handle on any card to resize it. This is especially handy for mood boards or when you need a larger video viewport.
- Hold <kbd>Space</kbd> and drag anywhere on the background to pan the infinite canvas, or use the zoom controls in the toolbar. **Reset view** snaps the board back to centre.
- Multi-select right on the canvas: shift-click to add to a selection or drag a marquee box over several cards. The **Download selection** button uses the current highlighted assets — it streams a single file directly or builds a ZIP when multiple items are chosen.
