const admin = require('firebase-admin');
const fs = require('fs');
const env = require('./env');

function hasInlineFirebaseConfig() {
  return Boolean(env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey);
}

function hasFirebaseConfig() {
  return Boolean(
    hasInlineFirebaseConfig() ||
    env.firebaseServiceAccountPath ||
    env.googleApplicationCredentials
  );
}

function readServiceAccountFromFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (parsed.type !== 'service_account' || !parsed.client_email || !parsed.private_key) {
    throw new Error('Invalid service account JSON. Download from Firebase Console > Service accounts.');
  }

  return parsed;
}

function initializeFirebase() {
  if (admin.apps.length) {
    return true;
  }

  if (!hasFirebaseConfig()) {
    return false;
  }

  try {
    if (hasInlineFirebaseConfig()) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebaseProjectId,
          clientEmail: env.firebaseClientEmail,
          privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n')
        })
      });
      return true;
    }

    if (env.firebaseServiceAccountPath) {
      const serviceAccount = readServiceAccountFromFile(env.firebaseServiceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      return true;
    }

    if (env.googleApplicationCredentials) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: env.firebaseProjectId || undefined
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Firebase initialization failed:', error.message);
    return false;
  }
}

function getMessaging() {
  const initialized = initializeFirebase();
  if (!initialized) {
    return null;
  }
  return admin.messaging();
}

module.exports = {
  hasFirebaseConfig,
  getMessaging
};
