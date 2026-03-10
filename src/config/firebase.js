const admin = require('firebase-admin');
const env = require('./env');

function hasFirebaseConfig() {
  return Boolean(env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey);
}

function initializeFirebase() {
  if (admin.apps.length) {
    return true;
  }

  if (!hasFirebaseConfig()) {
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebaseProjectId,
        clientEmail: env.firebaseClientEmail,
        privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n')
      })
    });

    return true;
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
