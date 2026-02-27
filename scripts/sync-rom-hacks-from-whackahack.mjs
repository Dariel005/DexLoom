import { writeFile } from "node:fs/promises";

const WHACK_A_HACK_BASE_URL = "https://whackahack.com";
const WHACK_A_HACK_INDEX_URL = `${WHACK_A_HACK_BASE_URL}/juegos/?language=en`;
const POKEHARBOR_BASE_URL = "https://www.pokeharbor.com";
const POKEHARBOR_API_BASE_URL = `${POKEHARBOR_BASE_URL}/wp-json/wp/v2`;
const POKEHARBOR_ROMS_ROOT_SLUG = "roms";
const POKEHARBOR_PAGE_SIZE = 100;
const POKEHARBOR_FALLBACK_IMAGE =
  `${POKEHARBOR_BASE_URL}/wp-content/uploads/2021/04/pokeharbor-favicon.png`;
const REQUEST_TIMEOUT_MS = 45_000;
const REQUEST_RETRIES = 2;
const OUTPUT_FILE = "lib/rom-hacks-encyclopedia.ts";
const VERIFIED_ON = new Date().toISOString().slice(0, 10);

function decodeEntities(value) {
  const decodedNamed = value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");

  return decodedNamed.replace(/&#(\d+);/g, (_, numeric) => {
    const codePoint = Number.parseInt(numeric, 10);
    if (!Number.isFinite(codePoint)) {
      return _;
    }
    return String.fromCodePoint(codePoint);
  });
}

function repairMojibake(value) {
  if (!/[ÃƒÃ‚Ã¢]/.test(value)) {
    return value;
  }

  try {
    const fixed = Buffer.from(value, "latin1").toString("utf8");
    return fixed.includes("ï¿½") ? value : fixed;
  } catch {
    return value;
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ");
}

function cleanText(value) {
  return normalizeWhitespace(repairMojibake(decodeEntities(stripTags(value))));
}

function normalizePokemonTitle(value) {
  return value
    .replace(/Pok(?:e|é|Ã©|ÃƒÂ©)mon/gi, "Pokemon")
    .replace(/\u2019/g, "'")
    .replace(/\u2013|\u2014/g, "-");
}

function toEnglishDescriptor(value) {
  return value
    .replace(/\bOtras plataformas\b/gi, "Other Platforms")
    .replace(/\bCompleta\b/gi, "Complete")
    .replace(/\bCompleto\b/gi, "Complete")
    .replace(/\bVersiÃ³n\b/gi, "Version")
    .replace(/\bAlfa\b/gi, "Alpha")
    .replace(/\by\b/g, "and");
}

function platformTag(platform) {
  const normalized = platform
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "unknown-platform";
}

function inferStatus(versionLabel) {
  const value = versionLabel.toLowerCase();
  if (
    /(beta|alpha|alfa|demo|prototype|preview|wip|work in progress|in progress|test build|pending)/.test(
      value
    )
  ) {
    return "Active Development";
  }
  return "Playable";
}

function buildSummary(sourceName, platform, versionLabel) {
  if (versionLabel.length > 0 && versionLabel.toLowerCase() !== "unknown") {
    return `Community Pokemon project listed on ${sourceName}. ${platform} release track: ${versionLabel}.`;
  }
  return `Community Pokemon project listed on ${sourceName}. ${platform} release track is not publicly detailed.`;
}

function toAbsoluteUrl(maybeRelativeUrl, baseUrl) {
  try {
    return new URL(maybeRelativeUrl, baseUrl).toString();
  } catch {
    return "";
  }
}

function toHttpsUrl(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("http")) {
    return null;
  }

  return trimmed;
}

function toSlugFromHref(href) {
  const parts = href.split("/").filter(Boolean);
  return parts.at(-1) ?? href;
}

function toTitleKey(value) {
  return normalizePokemonTitle(cleanText(value))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseInteger(value, fallback = 1) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function request(url, responseType = "text") {
  let lastError;

  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "accept-language": "en-US,en;q=0.9",
          "user-agent": "DexLoom/1.0 (+https://localhost)"
        }
      });

      if (!response.ok) {
        throw new Error(`Unable to fetch ${url} (${response.status})`);
      }

      const data =
        responseType === "json"
          ? await response.json()
          : responseType === "text"
            ? await response.text()
            : null;

      return {
        data,
        headers: response.headers
      };
    } catch (error) {
      lastError = error;
      if (attempt >= REQUEST_RETRIES) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 180 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

async function fetchHtml(url) {
  const result = await request(url, "text");
  return result.data;
}

async function fetchJson(url) {
  const result = await request(url, "json");
  return result.data;
}

async function fetchJsonWithHeaders(url) {
  const result = await request(url, "json");
  return result;
}

function getWhackAHackLastPage(html) {
  const matches = [...html.matchAll(/href="\/juegos\/\?language=en&amp;page=(\d+)"/g)];
  const pages = matches
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value));
  return pages.length > 0 ? Math.max(...pages) : 1;
}

function extractWhackAHackEntriesFromPage(html, page) {
  const blocks = [
    ...html.matchAll(
      /<div class="game">\s*<a class="game__link"[\s\S]*?<\/a>(?:\s*<div class="game__category text--mini-title">[\s\S]*?<\/div>)?\s*<\/div>/g
    )
  ];

  return blocks
    .map((match) => {
      const block = match[0];
      const hrefMatch = block.match(/class="game__link"[^>]*href="([^"]+)"/);
      const titleMatch = block.match(/<div class="game__title">([\s\S]*?)<\/div>/);
      const imageMatches = [...block.matchAll(/<img[^>]*src="([^"]+)"/g)];
      const categoryMatch = block.match(
        /<div class="game__category text--mini-title">([\s\S]*?)<\/div>/
      );
      const versionMatch = categoryMatch?.[1]?.match(/<span class="text--light">([\s\S]*?)<\/span>/);

      if (!hrefMatch || !titleMatch || imageMatches.length === 0) {
        return null;
      }

      const href = decodeEntities(hrefMatch[1]);
      const title = normalizePokemonTitle(cleanText(titleMatch[1]));
      const imageSrc = toAbsoluteUrl(decodeEntities(imageMatches[0][1]), WHACK_A_HACK_BASE_URL);
      const categoryHtml = categoryMatch?.[1] ?? "";
      const versionLabelRaw = cleanText(versionMatch?.[1] ?? "")
        .replace(/[â€”-]\s*$/, "")
        .replace(/\s*[-–—]\s*$/, "")
        .trim();
      const platformRaw = cleanText(
        categoryHtml.replace(/<span class="text--light">[\s\S]*?<\/span>/, "")
      );
      const platform =
        platformRaw.length > 0
          ? toEnglishDescriptor(normalizePokemonTitle(platformRaw))
          : "Unknown platform";
      const versionLabel =
        versionLabelRaw.length > 0
          ? toEnglishDescriptor(normalizePokemonTitle(versionLabelRaw))
          : "Unknown";
      const slug = toSlugFromHref(href);
      const status = inferStatus(versionLabel);

      return {
        id: slug,
        title,
        sourcePage: page,
        platform,
        versionLabel,
        status,
        summary: buildSummary("Whack a Hack", platform, versionLabel),
        imageSrc,
        imageAlt: `${title} cover art`,
        officialUrl: toAbsoluteUrl(href, WHACK_A_HACK_BASE_URL),
        officialLabel: "Whack a Hack Official Listing",
        tags: ["community", platformTag(platform)],
        verifiedOn: VERIFIED_ON
      };
    })
    .filter((entry) => entry !== null);
}

async function fetchWhackAHackEntries() {
  const firstPageHtml = await fetchHtml(WHACK_A_HACK_INDEX_URL);
  const lastPage = getWhackAHackLastPage(firstPageHtml);
  const pages = Array.from({ length: lastPage }, (_, index) => index + 1);
  const entries = [];
  const seenIds = new Set();

  for (const page of pages) {
    const pageUrl =
      page === 1
        ? WHACK_A_HACK_INDEX_URL
        : `${WHACK_A_HACK_BASE_URL}/juegos/?language=en&page=${page}`;
    const html = page === 1 ? firstPageHtml : await fetchHtml(pageUrl);
    const pageEntries = extractWhackAHackEntriesFromPage(html, page);

    for (const entry of pageEntries) {
      if (seenIds.has(entry.id)) {
        continue;
      }
      seenIds.add(entry.id);
      entries.push(entry);
    }
  }

  return entries;
}

function extractVersionLabel(text) {
  const cleaned = normalizePokemonTitle(cleanText(text));
  if (!cleaned) {
    return "Latest listed build";
  }

  const patterns = [
    /\b(Complete(?:\s*\([^)]{1,40}\))?)\b/i,
    /\b(Beta(?:\s+[A-Za-z0-9.\-]+)?)\b/i,
    /\b(Alpha(?:\s+[A-Za-z0-9.\-]+)?)\b/i,
    /\b(Version\s+[A-Za-z0-9.\-]+)\b/i,
    /\b(v\d+(?:\.\d+){0,4}[A-Za-z0-9\-]*)\b/i
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (!match?.[1]) {
      continue;
    }
    return normalizeWhitespace(match[1]);
  }

  return "Latest listed build";
}

async function fetchPokeHarborCategories() {
  const url = new URL(`${POKEHARBOR_API_BASE_URL}/categories`);
  url.searchParams.set("per_page", String(POKEHARBOR_PAGE_SIZE));
  url.searchParams.set("page", "1");

  const firstPage = await fetchJsonWithHeaders(url.toString());
  const totalPages = parseInteger(firstPage.headers.get("x-wp-totalpages"), 1);
  const categories = Array.isArray(firstPage.data) ? [...firstPage.data] : [];

  for (let page = 2; page <= totalPages; page += 1) {
    const pageUrl = new URL(`${POKEHARBOR_API_BASE_URL}/categories`);
    pageUrl.searchParams.set("per_page", String(POKEHARBOR_PAGE_SIZE));
    pageUrl.searchParams.set("page", String(page));
    const pageData = await fetchJson(pageUrl.toString());

    if (!Array.isArray(pageData) || pageData.length === 0) {
      break;
    }
    categories.push(...pageData);
  }

  return categories;
}

function collectDescendantCategoryIds(categories, rootId) {
  const childrenByParent = new Map();

  for (const category of categories) {
    const parent = Number(category.parent ?? 0);
    if (!childrenByParent.has(parent)) {
      childrenByParent.set(parent, []);
    }
    childrenByParent.get(parent).push(Number(category.id));
  }

  const result = new Set([Number(rootId)]);
  const queue = [Number(rootId)];

  while (queue.length > 0) {
    const parentId = queue.shift();
    const children = childrenByParent.get(parentId) ?? [];

    for (const childId of children) {
      if (result.has(childId)) {
        continue;
      }
      result.add(childId);
      queue.push(childId);
    }
  }

  return result;
}

function inferPokeHarborPlatform(categoryIds, categoryById) {
  const slugs = categoryIds
    .map((categoryId) => String(categoryById.get(categoryId)?.slug ?? "").toLowerCase())
    .filter((entry) => entry.length > 0);

  if (slugs.some((slug) => slug.includes("rpgxp"))) {
    return "RPG Maker XP";
  }
  if (slugs.some((slug) => slug.includes("nds"))) {
    return "ROM Hacking NDS";
  }
  if (slugs.some((slug) => slug.includes("gbc"))) {
    return "ROM Hacking GB/C";
  }
  if (slugs.some((slug) => slug.includes("gba"))) {
    return "ROM Hacking GBA";
  }
  if (slugs.some((slug) => slug.includes("mystery-dungeon"))) {
    return "ROM Hacking NDS";
  }

  return "ROM Hacking";
}

function extractPokeHarborEntriesFromPostsPage(posts, page, categoryById) {
  return posts
    .map((post) => {
      const title = normalizePokemonTitle(cleanText(post?.title?.rendered ?? ""));
      if (!title) {
        return null;
      }

      const officialUrl = toAbsoluteUrl(post?.link ?? "", POKEHARBOR_BASE_URL);
      if (!officialUrl) {
        return null;
      }

      const slug = cleanText(post?.slug ?? "") || toSlugFromHref(officialUrl);
      const categories = Array.isArray(post?.categories)
        ? post.categories
            .map((entry) => Number.parseInt(String(entry), 10))
            .filter((entry) => Number.isFinite(entry))
        : [];
      const platform = inferPokeHarborPlatform(categories, categoryById);
      const excerpt = cleanText(post?.excerpt?.rendered ?? "");
      const versionLabel = extractVersionLabel(`${title} ${excerpt}`);
      const imageSrc =
        toHttpsUrl(post?.jetpack_featured_media_url) ??
        toHttpsUrl(post?.featured_image_src) ??
        POKEHARBOR_FALLBACK_IMAGE;

      return {
        id: `pokeharbor-${slug}`,
        title,
        sourcePage: page,
        platform,
        versionLabel,
        status: inferStatus(versionLabel),
        summary: buildSummary("PokeHarbor", platform, versionLabel),
        imageSrc,
        imageAlt: `${title} cover art`,
        officialUrl,
        officialLabel: "PokeHarbor Official Listing",
        tags: ["community", "pokeharbor", platformTag(platform)],
        verifiedOn: VERIFIED_ON
      };
    })
    .filter((entry) => entry !== null);
}

async function fetchPokeHarborEntries() {
  const categories = await fetchPokeHarborCategories();
  const rootCategory = categories.find(
    (category) => String(category.slug ?? "").toLowerCase() === POKEHARBOR_ROMS_ROOT_SLUG
  );

  if (!rootCategory) {
    throw new Error("Unable to locate PokeHarbor root ROM category.");
  }

  const categoryIds = Array.from(collectDescendantCategoryIds(categories, rootCategory.id));
  const categoryById = new Map(
    categories.map((category) => [Number(category.id), category])
  );

  const baseUrl = new URL(`${POKEHARBOR_API_BASE_URL}/posts`);
  baseUrl.searchParams.set("categories", categoryIds.join(","));
  baseUrl.searchParams.set("per_page", String(POKEHARBOR_PAGE_SIZE));
  baseUrl.searchParams.set("page", "1");

  const firstPage = await fetchJsonWithHeaders(baseUrl.toString());
  const totalPages = parseInteger(firstPage.headers.get("x-wp-totalpages"), 1);
  const entries = [];
  const seenIds = new Set();

  const appendPageEntries = (posts, page) => {
    const pageEntries = extractPokeHarborEntriesFromPostsPage(posts, page, categoryById);
    for (const entry of pageEntries) {
      if (seenIds.has(entry.id)) {
        continue;
      }
      seenIds.add(entry.id);
      entries.push(entry);
    }
  };

  appendPageEntries(Array.isArray(firstPage.data) ? firstPage.data : [], 1);

  for (let page = 2; page <= totalPages; page += 1) {
    const pageUrl = new URL(`${POKEHARBOR_API_BASE_URL}/posts`);
    pageUrl.searchParams.set("categories", categoryIds.join(","));
    pageUrl.searchParams.set("per_page", String(POKEHARBOR_PAGE_SIZE));
    pageUrl.searchParams.set("page", String(page));

    const pageData = await fetchJson(pageUrl.toString());
    if (!Array.isArray(pageData) || pageData.length === 0) {
      break;
    }

    appendPageEntries(pageData, page);
  }

  return entries;
}

function mergeCatalogs(primaryEntries, secondaryEntries) {
  const merged = [...primaryEntries];
  const seenIds = new Set(primaryEntries.map((entry) => entry.id));
  const seenTitleKeys = new Set(primaryEntries.map((entry) => toTitleKey(entry.title)));

  for (const entry of secondaryEntries) {
    if (seenIds.has(entry.id)) {
      continue;
    }

    const titleKey = toTitleKey(entry.title);
    if (titleKey && seenTitleKeys.has(titleKey)) {
      continue;
    }

    seenIds.add(entry.id);
    if (titleKey) {
      seenTitleKeys.add(titleKey);
    }
    merged.push(entry);
  }

  return merged;
}

function buildOutput(entries) {
  const content = `export interface RomHackEntry {
  id: string;
  title: string;
  sourcePage: number;
  platform: string;
  versionLabel: string;
  status: "Playable" | "Active Development";
  summary: string;
  imageSrc: string;
  imageAlt: string;
  officialUrl: string;
  officialLabel: string;
  tags: string[];
  verifiedOn: string;
}

const VERIFIED_ON = "${VERIFIED_ON}";

export const ROM_HACKS_CATALOG: RomHackEntry[] = ${JSON.stringify(entries, null, 2).replaceAll(
    `"${VERIFIED_ON}"`,
    "VERIFIED_ON"
  )};
`;

  return content;
}

async function main() {
  const whackAHackEntries = await fetchWhackAHackEntries();
  let pokeHarborEntries = [];

  try {
    pokeHarborEntries = await fetchPokeHarborEntries();
  } catch (error) {
    console.warn(
      `Warning: unable to sync PokeHarbor entries. Keeping Whack a Hack only. (${error instanceof Error ? error.message : String(error)})`
    );
  }

  const mergedEntries = mergeCatalogs(whackAHackEntries, pokeHarborEntries);
  const output = buildOutput(mergedEntries);
  await writeFile(OUTPUT_FILE, output, "utf8");

  process.stdout.write(
    `Synced ${mergedEntries.length} ROM hack entries (Whack a Hack: ${whackAHackEntries.length}, PokeHarbor added: ${
      mergedEntries.length - whackAHackEntries.length
    }).\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
