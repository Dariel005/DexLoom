import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(repoRoot, "data", "pokemon-go-item-icons.json");
const outputDir = path.join(repoRoot, "public", "assets", "pokemon-go", "items");

const rawBaseUrl = "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master";

function encodePathSegments(relativePath) {
  return relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function loadManifest() {
  const content = await readFile(manifestPath, "utf8");
  return JSON.parse(content);
}

async function fetchBinary(relativePath) {
  const url = `${rawBaseUrl}/${encodePathSegments(relativePath)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "pokedex-wiki-pro-icon-sync"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${relativePath} (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  const shouldClean = process.argv.includes("--clean");
  const manifest = await loadManifest();
  const categoryFallback = manifest.categoryFallback ?? {};
  const slugMap = manifest.slugMap ?? {};
  const sourceBasePath = manifest.sourceBasePath ?? "Images/Items";

  await mkdir(outputDir, { recursive: true });

  const sourceCache = new Map();
  const expectedFilenames = new Set();
  let filesWritten = 0;
  let filesRemoved = 0;

  const writeIcon = async (targetFilename, sourceFilename) => {
    const sourcePath = `${sourceBasePath}/${sourceFilename}`;
    let binary = sourceCache.get(sourcePath);
    if (!binary) {
      binary = await fetchBinary(sourcePath);
      sourceCache.set(sourcePath, binary);
    }

    const targetPath = path.join(outputDir, targetFilename);
    await writeFile(targetPath, binary);
    filesWritten += 1;
  };

  for (const [category, sourceFilename] of Object.entries(categoryFallback)) {
    const targetFilename = `category-${category}.png`;
    expectedFilenames.add(targetFilename);
    await writeIcon(targetFilename, sourceFilename);
  }

  for (const [slug, sourceFilename] of Object.entries(slugMap)) {
    const targetFilename = `${slug}.png`;
    expectedFilenames.add(targetFilename);
    await writeIcon(targetFilename, sourceFilename);
  }

  if (shouldClean) {
    const existingEntries = await readdir(outputDir, { withFileTypes: true });
    for (const entry of existingEntries) {
      if (!entry.isFile()) {
        continue;
      }
      if (!expectedFilenames.has(entry.name)) {
        await unlink(path.join(outputDir, entry.name));
        filesRemoved += 1;
      }
    }
  }

  const baseMessage =
    `Synced ${filesWritten} local Pokemon GO item icons to ${path.relative(repoRoot, outputDir)}`;
  if (shouldClean) {
    console.log(`${baseMessage} and removed ${filesRemoved} stale file(s).`);
    return;
  }
  console.log(baseMessage);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
