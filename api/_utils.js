const crypto = require('crypto');

function buildFalPayload({ prompt, startImage, endImage, resolution, motion, webhookUrl, extraParams }) {
  const payload = {
    prompt,
    webhook_url: webhookUrl,
    ...extraParams
  };

  if (resolution) {
    payload.video_size = resolution;
  }

  if (typeof motion === 'number') {
    payload.motion_bucket_id = motion;
  }

  if (startImage && startImage.dataUrl) {
    payload.image_url = startImage.dataUrl;
  }

  if (endImage && endImage.dataUrl) {
    payload.end_image_url = endImage.dataUrl;
  }

  return payload;
}

function encodeBase64URL(value) {
  return Buffer.from(value).toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJwt(header, payload, privateKey) {
  const encodedHeader = encodeBase64URL(JSON.stringify(header));
  const encodedPayload = encodeBase64URL(JSON.stringify(payload));
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(toSign);
  const signature = signer.sign(privateKey);
  return `${toSign}.${encodeBase64URL(signature)}`;
}

function mapToFirestoreValue(value) {
  if (value === null) {
    return { nullValue: null };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(mapToFirestoreValue) } };
  }
  switch (typeof value) {
    case 'string':
      return { stringValue: value };
    case 'number':
      return { doubleValue: value };
    case 'boolean':
      return { booleanValue: value };
    case 'object':
      if (value instanceof Date) {
        return { timestampValue: value.toISOString() };
      }
      if (value && value.seconds && value.nanoseconds) {
        return {
          timestampValue: `${new Date(value.seconds * 1000 + value.nanoseconds / 1e6).toISOString()}`
        };
      }
      const mappedFields = {};
      for (const [key, fieldValue] of Object.entries(value)) {
        mappedFields[key] = mapToFirestoreValue(fieldValue);
      }
      return { mapValue: { fields: mappedFields } };
    default:
      return { stringValue: String(value) };
  }
}

function buildFirestoreDocument(fields) {
  const mappedFields = {};
  for (const [key, value] of Object.entries(fields)) {
    mappedFields[key] = mapToFirestoreValue(value);
  }
  return mappedFields;
}

module.exports = {
  buildFalPayload,
  signJwt,
  mapToFirestoreValue,
  buildFirestoreDocument
};
