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

```bash
npm install
npm start
```

The server defaults to `http://localhost:3000`.

## Usage tips

- Toggle **Rename on drop** to rename incoming files while preserving their original extensions.
- Hold and drag cards on the canvas to reposition them.
- Use the asset selector to choose one or more assets and click **Download Selected** to fetch them.
