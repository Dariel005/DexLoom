import {
  applicationDefault,
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

function parseFirebaseConfigEnv() {
  const raw = String(process.env.FIREBASE_CONFIG ?? "").trim();
  if (!raw) {
    return { projectId: null as string | null, storageBucket: null as string | null };
  }

  try {
    const parsed = JSON.parse(raw) as { projectId?: unknown; storageBucket?: unknown };
    const projectId =
      typeof parsed.projectId === "string" && parsed.projectId.trim().length > 0
        ? parsed.projectId.trim()
        : null;
    const storageBucket =
      typeof parsed.storageBucket === "string" && parsed.storageBucket.trim().length > 0
        ? parsed.storageBucket.trim()
        : null;
    return { projectId, storageBucket };
  } catch {
    return { projectId: null as string | null, storageBucket: null as string | null };
  }
}

function resolveProjectId() {
  const fromEnv = String(process.env.FIREBASE_PROJECT_ID ?? "").trim();
  if (fromEnv) {
    return fromEnv;
  }

  const cloudProject =
    String(process.env.GOOGLE_CLOUD_PROJECT ?? "").trim() ||
    String(process.env.GCLOUD_PROJECT ?? "").trim();
  if (cloudProject) {
    return cloudProject;
  }

  return parseFirebaseConfigEnv().projectId;
}

function resolveStorageBucket() {
  const fromEnv = String(process.env.FIREBASE_STORAGE_BUCKET ?? "").trim();
  if (fromEnv) {
    return fromEnv;
  }

  return parseFirebaseConfigEnv().storageBucket;
}

function isAuthSyncEnabledExplicit() {
  return process.env.AUTH_FIREBASE_SYNC_ENABLED === "1";
}

function isSyncEnabledWithProductionDefault(value: string | undefined) {
  if (value === "1") {
    return true;
  }
  if (value === "0") {
    return false;
  }
  return process.env.NODE_ENV === "production";
}

export function isFirebaseProfileSyncEnabled() {
  return (
    isSyncEnabledWithProductionDefault(process.env.PROFILE_FIREBASE_SYNC_ENABLED) ||
    isAuthSyncEnabledExplicit()
  );
}

export function isFirebaseSocialSyncEnabled() {
  return (
    isSyncEnabledWithProductionDefault(process.env.SOCIAL_FIREBASE_SYNC_ENABLED) ||
    isAuthSyncEnabledExplicit()
  );
}

export function isFirebaseAuthSyncEnabled() {
  return isSyncEnabledWithProductionDefault(process.env.AUTH_FIREBASE_SYNC_ENABLED);
}

export function isProfileFeatureEnabled() {
  return process.env.NEXT_PUBLIC_PROFILE_FEATURE_ENABLED !== "0";
}

export function isFirebaseAdminConfigured() {
  const hasSyncEnabled =
    isFirebaseProfileSyncEnabled() || isFirebaseSocialSyncEnabled() || isFirebaseAuthSyncEnabled();

  return Boolean(
    hasSyncEnabled &&
      resolveProjectId()
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

  const projectId = resolveProjectId();
  if (!projectId) {
    return null;
  }

  const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL ?? "").trim();
  const privateKey = getPrivateKey();
  const storageBucket = resolveStorageBucket();

  const appConfig: {
    credential?: ReturnType<typeof cert> | ReturnType<typeof applicationDefault>;
    projectId: string;
    storageBucket?: string;
  } = {
    projectId
  };

  if (storageBucket) {
    appConfig.storageBucket = storageBucket;
  }

  if (clientEmail && privateKey) {
    const credentials: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey
    };
    appConfig.credential = cert(credentials);
  } else {
    // Use default GCP service account in App Hosting / Cloud Run environments.
    appConfig.credential = applicationDefault();
  }

  try {
    cachedApp = initializeApp(appConfig);
  } catch {
    return null;
  }
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

  const bucketName = resolveStorageBucket();
  if (!bucketName) {
    return null;
  }

  return getStorage(app).bucket(bucketName);
}
