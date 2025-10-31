export default function VideoPlayer({ videoUrl, onReset }) {
  if (!videoUrl) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Generated Video</h3>
        <div className="space-x-2">
          <a
            href={videoUrl}
            download
            className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-400"
          >
            Download
          </a>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 shadow transition hover:bg-slate-700"
          >
            Start another
          </button>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-800 bg-black">
        <video src={videoUrl} controls className="h-full w-full" />
      </div>
    </div>
  );
}
