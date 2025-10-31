import { useEffect } from 'react';
import { useGenerationDocument } from '../hooks/useGenerationDocument';

const STATUS_LABELS = {
  processing: 'Processing',
  queued: 'Queued',
  running: 'Generating',
  complete: 'Complete',
  failed: 'Failed',
  unknown: 'Unknown'
};

export default function JobStatus({ userId, jobId, onComplete }) {
  const { data, isLoading } = useGenerationDocument({ userId, jobId });

  useEffect(() => {
    if (data && data.status === 'complete' && data.videoUrl) {
      onComplete(data.videoUrl);
    }
    if (data && data.status === 'failed' && data.error) {
      onComplete(null, data.error);
    }
  }, [data, onComplete]);

  if (!jobId) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 shadow-inner">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Job Status</h3>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
          #{jobId.slice(0, 8)}
        </span>
      </div>
      <div className="mt-4">
        {isLoading && <p className="text-sm text-slate-300">Loading status...</p>}
        {!isLoading && data && (
          <div className="space-y-2">
            <p className="text-base font-semibold text-slate-100">
              {STATUS_LABELS[data.status] || 'Processing'}
            </p>
            <progress className="h-2 w-full overflow-hidden rounded bg-slate-800" max="100" value={data.status === 'complete' ? 100 : 60}>
              {data.status === 'complete' ? 'Complete' : 'In progress'}
            </progress>
            {data.videoUrl && (
              <p className="text-sm text-emerald-400">Video ready for playback!</p>
            )}
            {data.error && (
              <p className="text-sm text-rose-400">{data.error}</p>
            )}
          </div>
        )}
        {!isLoading && !data && (
          <p className="text-sm text-rose-300">Generation document not found yet.</p>
        )}
      </div>
    </div>
  );
}
