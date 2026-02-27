import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const FIRESTORE_DOC_SOFT_LIMIT_BYTES = 900_000;
const FIRESTORE_BATCH_LIMIT = 450;

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node ./scripts/migrate-data-to-firestore.mjs [options]",
      "",
      "Options:",
      "  --apply                Write data to Firestore (default: dry-run)",
      "  --social-only          Migrate only social files to social_store docs",
      "  --no-users             Skip users.json migration",
      "  --no-profiles          Skip profiles.json migration",
      "  --no-favorites         Skip favorites.json migration",
      "  --data-dir=<path>      Override local data dir (default: POKEDEX_DATA_DIR or .data)",
      "  --help                 Show this help",
      "",
      "Examples:",
      "  node ./scripts/migrate-data-to-firestore.mjs",
      "  node ./scripts/migrate-data-to-firestore.mjs --apply",
      "  node ./scripts/migrate-data-to-firestore.mjs --apply --social-only"
    ].join("\n")
  );
}

function parseArgs(argv) {
  const options = {
    apply: false,
    socialOnly: false,
    includeUsers: true,
    includeProfiles: true,
    includeFavorites: true,
    dataDirArg: null
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--apply") {
      options.apply = true;
    } else if (arg === "--social-only") {
      options.socialOnly = true;
      options.includeUsers = false;
      options.includeProfiles = false;
      options.includeFavorites = false;
    } else if (arg === "--no-users") {
      options.includeUsers = false;
    } else if (arg === "--no-profiles") {
      options.includeProfiles = false;
    } else if (arg === "--no-favorites") {
      options.includeFavorites = false;
    } else if (arg.startsWith("--data-dir=")) {
      options.dataDirArg = arg.slice("--data-dir=".length).trim() || null;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function loadEnvFile(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/g)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, eqIndex).trim();
      const valueRaw = trimmed.slice(eqIndex + 1).trim();
      if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
        continue;
      }

      process.env[key] = unquote(valueRaw);
    }
  } catch {
    // ignore missing env files
  }
}

async function preloadEnv() {
  await loadEnvFile(path.join(repoRoot, ".env.local"));
  await loadEnvFile(path.join(repoRoot, ".env"));
}

function resolveDataDir(dataDirArg) {
  const fromArgs = dataDirArg ? dataDirArg.trim() : "";
  const fromEnv = (process.env.POKEDEX_DATA_DIR ?? "").trim();
  const selected = fromArgs || fromEnv || ".data";
  return path.isAbsolute(selected) ? selected : path.resolve(repoRoot, selected);
}

async function readArrayJson(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        rows: parsed,
        missing: false
      };
    }
    return {
      rows: [],
      missing: false
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        rows: [],
        missing: true
      };
    }
    throw new Error(`Failed reading JSON array: ${filePath}`);
  }
}

function sanitizePrivateKey(value) {
  return value.replace(/\\n/g, "\n");
}

function ensureFirebaseEnv() {
  const projectId = (process.env.FIREBASE_PROJECT_ID ?? "").trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL ?? "").trim();
  const privateKeyRaw = (process.env.FIREBASE_PRIVATE_KEY ?? "").trim();

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "Missing Firebase credentials. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: sanitizePrivateKey(privateKeyRaw)
  };
}

function getDb() {
  const credentials = ensureFirebaseEnv();

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey
      }),
      projectId: credentials.projectId
    });
  }

  return getFirestore();
}

function toDocSizeBytes(rows) {
  return Buffer.byteLength(JSON.stringify({ rows }), "utf8");
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function commitInBatches(db, collectionName, docsById) {
  let writes = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const [docId, payload] of docsById) {
    const ref = db.collection(collectionName).doc(docId);
    batch.set(ref, payload, { merge: true });
    batchCount += 1;
    writes += 1;

    if (batchCount >= FIRESTORE_BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return writes;
}

function toArrayCollectionDocs(rows, idResolver) {
  const entries = [];
  for (const row of rows) {
    const docId = idResolver(row);
    if (!docId) {
      continue;
    }
    entries.push([docId, row]);
  }
  return entries;
}

function printSection(title) {
  console.log(`\n${title}`);
}

async function main() {
  await preloadEnv();
  const options = parseArgs(process.argv.slice(2));
  const dataDir = resolveDataDir(options.dataDirArg);
  const nowIso = new Date().toISOString();
  const runId = randomUUID();

  const socialFiles = [
    { storeName: "friendships", fileName: "friendships.json" },
    { storeName: "social_presence", fileName: "social-presence.json" },
    { storeName: "social_settings", fileName: "social-settings.json" },
    { storeName: "social_blocks", fileName: "social-blocks.json" },
    { storeName: "social_reports", fileName: "social-reports.json" },
    { storeName: "social_activities", fileName: "social-activities.json" },
    { storeName: "social_notifications", fileName: "social-notifications.json" }
  ];

  const socialPayload = [];
  for (const source of socialFiles) {
    const filePath = path.join(dataDir, source.fileName);
    const data = await readArrayJson(filePath);
    socialPayload.push({
      ...source,
      filePath,
      rows: data.rows,
      missing: data.missing,
      docSizeBytes: toDocSizeBytes(data.rows)
    });
  }

  const usersSource = await readArrayJson(path.join(dataDir, "users.json"));
  const profilesSource = await readArrayJson(path.join(dataDir, "profiles.json"));
  const favoritesSource = await readArrayJson(path.join(dataDir, "favorites.json"));

  printSection("Migration Plan");
  console.log(`Mode: ${options.apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`Data dir: ${dataDir}`);
  console.log(`Run id: ${runId}`);
  console.log(`Timestamp: ${nowIso}`);

  printSection("Social Store");
  for (const entry of socialPayload) {
    const missingText = entry.missing ? " (missing -> empty)" : "";
    const sizeText = `, doc size ~ ${formatBytes(entry.docSizeBytes)}`;
    const warningText =
      entry.docSizeBytes > FIRESTORE_DOC_SOFT_LIMIT_BYTES
        ? " [WARNING: close to/exceeds Firestore doc limit]"
        : "";
    console.log(
      `- ${entry.storeName}: ${entry.rows.length} row(s) from ${path.basename(entry.filePath)}${missingText}${sizeText}${warningText}`
    );
  }

  if (!options.socialOnly) {
    printSection("Additional Collections");
    console.log(`- users.json: ${usersSource.rows.length} row(s)${usersSource.missing ? " (missing -> empty)" : ""}`);
    console.log(
      `- profiles.json: ${profilesSource.rows.length} row(s)${profilesSource.missing ? " (missing -> empty)" : ""}`
    );
    console.log(
      `- favorites.json: ${favoritesSource.rows.length} row(s)${favoritesSource.missing ? " (missing -> empty)" : ""}`
    );
  }

  const oversizeDocs = socialPayload.filter(
    (entry) => entry.docSizeBytes > FIRESTORE_DOC_SOFT_LIMIT_BYTES
  );
  if (oversizeDocs.length > 0) {
    throw new Error(
      `Social document payload too large for Firestore (${oversizeDocs
        .map((entry) => entry.storeName)
        .join(", ")}). Prune local data before migrating.`
    );
  }

  if (!options.apply) {
    printSection("Dry-run Result");
    console.log("No writes executed. Re-run with --apply to migrate.");
    return;
  }

  const db = getDb();
  const summary = {
    socialStoreDocs: 0,
    usersDocs: 0,
    profileDocs: 0,
    favoriteDocs: 0
  };

  for (const entry of socialPayload) {
    await db.collection("social_store").doc(entry.storeName).set(
      {
        rows: entry.rows,
        updatedAt: nowIso,
        migratedAt: nowIso,
        sourceFile: entry.fileName,
        migrationRunId: runId
      },
      { merge: true }
    );
    summary.socialStoreDocs += 1;
  }

  if (!options.socialOnly && options.includeUsers) {
    const userDocs = toArrayCollectionDocs(usersSource.rows, (row) =>
      typeof row?.id === "string" ? row.id : null
    );
    summary.usersDocs = await commitInBatches(db, "pokedexUsers", userDocs);
  }

  if (!options.socialOnly && options.includeProfiles) {
    const profileDocs = toArrayCollectionDocs(profilesSource.rows, (row) =>
      typeof row?.userId === "string" ? row.userId : null
    );
    summary.profileDocs = await commitInBatches(db, "pokedexProfiles", profileDocs);
  }

  if (!options.socialOnly && options.includeFavorites) {
    const favoriteDocs = toArrayCollectionDocs(favoritesSource.rows, (row) => {
      const userId = typeof row?.userId === "string" ? row.userId : "";
      const favoriteId = typeof row?.id === "string" ? row.id : "";
      if (!userId || !favoriteId) {
        return null;
      }
      return `${userId}__${favoriteId}`;
    });
    summary.favoriteDocs = await commitInBatches(db, "pokedexFavorites", favoriteDocs);
  }

  await db.collection("data_migrations").doc(runId).set({
    runId,
    appliedAt: nowIso,
    sourceDataDir: dataDir,
    socialOnly: options.socialOnly,
    summary
  });

  printSection("Apply Result");
  console.log(`- social_store docs updated: ${summary.socialStoreDocs}`);
  if (!options.socialOnly) {
    if (options.includeUsers) console.log(`- pokedexUsers docs upserted: ${summary.usersDocs}`);
    if (options.includeProfiles) console.log(`- pokedexProfiles docs upserted: ${summary.profileDocs}`);
    if (options.includeFavorites) console.log(`- pokedexFavorites docs upserted: ${summary.favoriteDocs}`);
  }
  console.log(`- migration log doc: data_migrations/${runId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
