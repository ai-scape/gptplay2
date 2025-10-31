const { submitGenerationJob } = require('./_fal');
const { createGenerationDocument } = require('./_firestore');
const { getConfig } = require('./_config');

function parseMotionValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function sanitizeImagePayload(image) {
  if (!image || !image.base64 || !image.mimeType) {
    return null;
  }
  const dataUrl = `data:${image.mimeType};base64,${image.base64}`;
  return {
    dataUrl,
    mimeType: image.mimeType
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const config = getConfig();
    const {
      prompt,
      startImage,
      endImage,
      resolution,
      motion,
      userId,
      appId,
      metadata
    } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!prompt && !(startImage && startImage.base64)) {
      return res.status(400).json({ error: 'Either a prompt or a start image must be provided.' });
    }

    const sanitizedStartImage = sanitizeImagePayload(startImage);
    const sanitizedEndImage = sanitizeImagePayload(endImage);
    const motionValue = parseMotionValue(motion);

    const webhookBase = `${config.app.baseUrl.replace(/\/$/, '')}/api/webhook`;
    const webhookUrl = `${webhookBase}?userId=${encodeURIComponent(userId)}`;

    const job = await submitGenerationJob({
      prompt: prompt || '',
      startImage: sanitizedStartImage,
      endImage: sanitizedEndImage,
      resolution,
      motion: motionValue,
      webhookUrl,
      extraParams: {
        metadata: {
          userId,
          appId: appId || null,
          ...metadata
        }
      }
    });

    const initialDoc = {
      status: 'processing',
      prompt: prompt || null,
      createdAt: new Date().toISOString(),
      startImageProvided: Boolean(sanitizedStartImage),
      endImageProvided: Boolean(sanitizedEndImage)
    };

    await createGenerationDocument({
      userId,
      requestId: job.requestId,
      data: initialDoc
    });

    return res.status(201).json({ jobId: job.requestId, request: job.raw });
  } catch (error) {
    console.error('Failed to handle generation request', error);
    const status = error.status || 500;
    const payload = { error: error.message || 'Internal Server Error' };
    if (error.details) {
      payload.details = error.details;
    }
    return res.status(status).json(payload);
  }
};
