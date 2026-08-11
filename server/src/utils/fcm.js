const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let initialized = false;

function init() {
  if (initialized) return admin;
  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!keyJson) {
    console.warn('FCM not configured: set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH');
    return null;
  }
  let serviceAccount = null;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      const p = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to parse Firebase service account', e.message);
    return null;
  }
  try {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
    return admin;
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK', e.message);
    return null;
  }
}

function getAdmin() { return init(); }

module.exports = { init, getAdmin };
