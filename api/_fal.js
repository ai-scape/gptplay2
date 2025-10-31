const { getConfig } = require('./_config');
const { buildFalPayload } = require('./_utils');

async function submitGenerationJob(options) {
  const config = getConfig();
  const endpoint = `${config.fal.apiUrl}/${config.fal.modelId}`;

  const payload = buildFalPayload({
    prompt: options.prompt,
    startImage: options.startImage,
    endImage: options.endImage,
    resolution: options.resolution,
    motion: options.motion,
    webhookUrl: options.webhookUrl,
    extraParams: options.extraParams || {}
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${config.fal.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await safeReadJSON(response);
    const error = new Error('Failed to submit generation job');
    error.status = response.status;
    error.details = errorBody;
    throw error;
  }

  const body = await response.json();
  if (!body || !body.request_id) {
    throw new Error('Fal.ai response did not include a request_id');
  }

  return {
    requestId: body.request_id,
    raw: body
  };
}

async function safeReadJSON(response) {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
}

module.exports = {
  submitGenerationJob
};
