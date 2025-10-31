const { getConfig } = require('./_config');
const { signJwt, buildFirestoreDocument } = require('./_utils');

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';

let cachedToken = null;

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.accessToken;
  }

  const config = getConfig();
  const { client_email, private_key } = config.firebase.serviceAccount;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    iss: client_email,
    sub: client_email,
    aud: TOKEN_ENDPOINT,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
    scope: 'https://www.googleapis.com/auth/datastore'
  };

  const assertion = signJwt({ alg: 'RS256', typ: 'JWT' }, payload, private_key);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error('Failed to obtain Google access token');
    error.status = response.status;
    error.details = errorBody;
    throw error;
  }

  const body = await response.json();
  cachedToken = {
    accessToken: body.access_token,
    expiresAt: Date.now() + (body.expires_in || 3600) * 1000
  };

  return cachedToken.accessToken;
}

async function commitWrites(writes) {
  const config = getConfig();
  const accessToken = await getAccessToken();
  const url = `${FIRESTORE_BASE}/projects/${config.firebase.projectId}/databases/(default)/documents:commit`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ writes })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error('Failed to commit writes to Firestore');
    error.status = response.status;
    error.details = errorBody;
    throw error;
  }

  return response.json();
}

function buildDocumentName({ projectId, rootCollection, userId, requestId }) {
  return `projects/${projectId}/databases/(default)/documents/${rootCollection}/${userId}/generations/${requestId}`;
}

async function createGenerationDocument({ userId, requestId, data }) {
  const config = getConfig();
  const documentName = buildDocumentName({
    projectId: config.firebase.projectId,
    rootCollection: config.app.firestoreRootCollection,
    userId,
    requestId
  });

  const document = {
    name: documentName,
    fields: buildFirestoreDocument(data)
  };

  return commitWrites([
    {
      update: document,
      currentDocument: { exists: false }
    }
  ]);
}

async function updateGenerationDocument({ userId, requestId, data }) {
  const config = getConfig();
  const documentName = buildDocumentName({
    projectId: config.firebase.projectId,
    rootCollection: config.app.firestoreRootCollection,
    userId,
    requestId
  });

  const updateMask = Object.keys(data).map(field => ({ fieldPath: field }));

  const document = {
    name: documentName,
    fields: buildFirestoreDocument(data)
  };

  return commitWrites([
    {
      update: document,
      updateMask: { fieldPaths: updateMask.map(item => item.fieldPath) },
      currentDocument: { exists: true }
    }
  ]);
}

module.exports = {
  createGenerationDocument,
  updateGenerationDocument
};
