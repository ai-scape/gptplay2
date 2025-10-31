import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import GeneratorForm from './components/GeneratorForm.jsx';
import JobStatus from './components/JobStatus.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import { createFirebaseApp } from './firebaseApp.js';

createFirebaseApp();

const RESOLUTION_TO_FAL_SIZE = {
  '16:9': '1024x576',
  '9:16': '576x1024',
  '1:1': '720x720'
};

export default function App() {
  const [userId, setUserId] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const submitPayload = useCallback(
    async (values) => {
      if (!userId) {
        throw new Error('User not authenticated yet');
      }
      setIsSubmitting(true);
      setError(null);
      setVideoUrl(null);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: values.prompt,
          resolution: RESOLUTION_TO_FAL_SIZE[values.resolution] || values.resolution,
          motion: values.motion,
          startImage: values.startImage,
          endImage: values.endImage,
          userId,
          metadata: {
            resolutionPreset: values.resolution
          }
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to create generation job');
      }

      const body = await response.json();
      setJobId(body.jobId);
    },
    [userId]
  );

  const handleSubmit = useCallback(
    async (values) => {
      try {
        await submitPayload(values);
      } catch (submissionError) {
        console.error(submissionError);
        setError(submissionError.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitPayload]
  );

  const handleJobComplete = useCallback((url, jobError) => {
    if (jobError) {
      setError(jobError);
      setVideoUrl(null);
    } else if (url) {
      setVideoUrl(url);
    }
  }, []);

  const reset = useCallback(() => {
    setJobId(null);
    setVideoUrl(null);
    setError(null);
  }, []);

  const jobStatus = useMemo(() => {
    if (!jobId) {
      return null;
    }
    return (
      <JobStatus userId={userId} jobId={jobId} onComplete={handleJobComplete} />
    );
  }, [jobId, userId, handleJobComplete]);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-900 bg-slate-950/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Fal.ai Powered</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Freepik AI Video Generator Clone</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Generate AI-powered motion clips from a prompt or guiding images. Jobs run asynchronously and update in real-time through Firestore.
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        <section className="rounded-2xl border border-slate-900 bg-slate-950/80 p-8 shadow-xl shadow-cyan-500/10">
          <GeneratorForm onSubmit={handleSubmit} isSubmitting={isSubmitting || !userId} />
          {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
        </section>
        {jobStatus}
        <VideoPlayer videoUrl={videoUrl} onReset={reset} />
      </main>
    </div>
  );
}
