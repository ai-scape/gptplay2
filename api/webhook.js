const crypto = require('crypto');
const { getConfig } = require('./_config');
const { updateGenerationDocument } = require('./_firestore');

function getRawBody(req) {
  if (typeof req.body === 'string') {
    return req.body;
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  return JSON.stringify(req.body || {});
}

function safeJsonParse(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse webhook payload', error);
    return null;
  }
}

function verifyFalSignature(secret, signatureHeader, rawBody) {
  if (!secret) {
    return true;
  }
  if (!signatureHeader) {
    return false;
  }
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const expected = hmac.digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch (_error) {
    return signatureHeader === expected;
  }
}

function extractVideoUrl(payload) {
  if (!payload) {
    return null;
  }
  if (payload.video_url) {
    return payload.video_url;
  }
  if (payload.output && payload.output.video) {
    return payload.output.video;
  }
  if (payload.output && payload.output.video_url) {
    return payload.output.video_url;
  }
  if (payload.data && payload.data.video && payload.data.video.url) {
    return payload.data.video.url;
  }
  return null;
}

function extractStatus(payload) {
  if (!payload) {
    return 'unknown';
  }
  if (payload.status) {
    return String(payload.status).toLowerCase();
  }
  if (payload.state) {
    return String(payload.state).toLowerCase();
  }
  if (payload.success === true) {
    return 'complete';
  }
  if (payload.success === false) {
    return 'failed';
  }
  return 'unknown';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const config = getConfig();
  const userId = (req.query && (req.query.userId || req.query.userid)) || null;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId in webhook query string' });
  }

  const rawBody = getRawBody(req);

  if (!verifyFalSignature(config.fal.webhookSecret, req.headers['x-fal-signature'], rawBody)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const payload = safeJsonParse(req.body) || safeJsonParse(rawBody);

  if (!payload) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  const requestId = payload.request_id || (payload.request && payload.request.id);
  if (!requestId) {
    return res.status(400).json({ error: 'Webhook payload missing request_id' });
  }

  const status = extractStatus(payload);
  const lowerStatus = status.toLowerCase();
  const videoUrl = extractVideoUrl(payload);
  const errorMessage = payload.error && (payload.error.message || payload.error);

  const update = {
    status: lowerStatus === 'completed' ? 'complete' : lowerStatus,
    updatedAt: new Date().toISOString()
  };

  if (videoUrl) {
    update.videoUrl = videoUrl;
  }

  if (errorMessage) {
    update.error = errorMessage;
  }

  await updateGenerationDocument({
    userId,
    requestId,
    data: update
  });

  return res.status(200).json({ ok: true });
};
