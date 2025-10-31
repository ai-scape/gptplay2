import { useForm } from 'react-hook-form';

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function serializeImage(file) {
  if (!file) {
    return null;
  }
  const base64 = await readFileAsBase64(file);
  return {
    base64,
    mimeType: file.type,
    name: file.name
  };
}

export default function GeneratorForm({ onSubmit, isSubmitting }) {
  const { register, handleSubmit, watch, reset, formState } = useForm({
    defaultValues: {
      prompt: '',
      resolution: '16:9',
      motion: 4
    }
  });

  const startFile = watch('startImage');
  const endFile = watch('endImage');

  const handleFormSubmit = handleSubmit(async (values) => {
    const payload = {
      prompt: values.prompt,
      resolution: values.resolution,
      motion: Number(values.motion),
      startImage: startFile && startFile[0] ? await serializeImage(startFile[0]) : null,
      endImage: endFile && endFile[0] ? await serializeImage(endFile[0]) : null
    };

    await onSubmit(payload);
    reset({ prompt: values.prompt, resolution: values.resolution, motion: values.motion });
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
          Prompt
        </label>
        <textarea
          id="prompt"
          rows={4}
          className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-slate-100 shadow-sm focus:border-cyan-400 focus:ring-cyan-400"
          placeholder="Describe the scene you want to animate..."
          {...register('prompt', { required: 'Prompt is required' })}
        />
        {formState.errors.prompt && (
          <p className="mt-1 text-sm text-rose-400">{formState.errors.prompt.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300">Start Image</label>
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-cyan-400"
            {...register('startImage')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Optional End Image</label>
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-cyan-400"
            {...register('endImage')}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="resolution" className="block text-sm font-medium text-slate-300">
            Resolution / Aspect Ratio
          </label>
          <select
            id="resolution"
            className="mt-2 block w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 focus:border-cyan-400 focus:ring-cyan-400"
            {...register('resolution', { required: true })}
          >
            <option value="16:9">16:9 Landscape (1024x576)</option>
            <option value="9:16">9:16 Portrait (576x1024)</option>
            <option value="1:1">1:1 Square (720x720)</option>
          </select>
        </div>

        <div>
          <label htmlFor="motion" className="block text-sm font-medium text-slate-300">
            Motion Intensity
          </label>
          <input
            id="motion"
            type="range"
            min="1"
            max="8"
            step="1"
            className="mt-3 w-full"
            {...register('motion')}
          />
          <p className="mt-1 text-xs text-slate-400">{watch('motion')} / 8</p>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Generate'}
          </button>
        </div>
      </div>
    </form>
  );
}
