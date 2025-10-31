const REQUIRED_ENV_VARS = [
  'FAL_API_KEY',
  'FAL_MODEL_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT',
  'PUBLIC_BASE_URL'
];

function getConfig() {
  const missing = REQUIRED_ENV_VARS.filter(name => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const serviceAccount = safeParseJSON(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
  }

  return {
    fal: {
      apiKey: process.env.FAL_API_KEY,
      modelId: process.env.FAL_MODEL_ID,
      apiUrl: process.env.FAL_API_URL || 'https://queue.fal.run/fal-ai',
      webhookSecret: process.env.FAL_WEBHOOK_SECRET || null
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      serviceAccount
    },
    app: {
      baseUrl: process.env.PUBLIC_BASE_URL,
      firestoreRootCollection: process.env.FIREBASE_ROOT_COLLECTION || 'users'
    }
  };
}

function safeParseJSON(value) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse JSON value from environment variable', error);
    return null;
  }
}

module.exports = {
  getConfig
};
