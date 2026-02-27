import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount
} from "firebase-admin/app";
import {
  getFirestore,
  type Firestore
} from "firebase-admin/firestore";
import {
  getStorage
} from "firebase-admin/storage";

let cachedApp: App | null = null;

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) {
    return null;
  }
  return raw.replace(/\\n/g, "\n");
}

export function isFirebaseProfileSyncEnabled() {
  return process.env.PROFILE_FIREBASE_SYNC_ENABLED === "1";
}

export function isFirebaseSocialSyncEnabled() {
  return process.env.SOCIAL_FIREBASE_SYNC_ENABLED === "1";
}

export function isProfileFeatureEnabled() {
  return process.env.NEXT_PUBLIC_PROFILE_FEATURE_ENABLED !== "0";
}

export function isFirebaseAdminConfigured() {
  return Boolean(
    (isFirebaseProfileSyncEnabled() || isFirebaseSocialSyncEnabled()) &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      getPrivateKey() &&
      process.env.FIREBASE_STORAGE_BUCKET
  );
}

export function isSocialDatabaseEnabled() {
  return isFirebaseSocialSyncEnabled() && isFirebaseAdminConfigured();
}

export function getFirebaseAdminApp() {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  if (cachedApp) {
    return cachedApp;
  }

  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return cachedApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKey = getPrivateKey()!;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET!;

  const credentials: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey
  };

  cachedApp = initializeApp({
    credential: cert(credentials),
    projectId,
    storageBucket
  });
  return cachedApp;
}

export function getFirebaseFirestoreDb(): Firestore | null {
  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }
  return getFirestore(app);
}

export function getFirebaseStorageBucket() {
  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    return null;
  }

  return getStorage(app).bucket(bucketName);
}
