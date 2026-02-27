import { cache } from "react";

const POKEMON_3D_API_URL = "https://pokemon-3d-api.onrender.com/v1/pokemon";
const POKEMON_3D_REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const POKEMON_3D_REQUEST_TIMEOUT_MS = 8_000;

interface Pokemon3DForm {
  name: string;
  model: string;
  formName: string;
}

interface Pokemon3DEntry {
  id: number;
  forms: Pokemon3DForm[];
}

export interface MegaModelUrls {
  regularUrl: string | null;
  shinyUrl: string | null;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean);
}

function isShinyForm(form: Pokemon3DForm) {
  const formName = form.formName.toLowerCase();
  if (formName.includes("shiny") || formName.startsWith("s")) {
    return true;
  }
  return tokenize(form.name).includes("shiny");
}

function isMegaForm(form: Pokemon3DForm) {
  const formName = form.formName.toLowerCase();
  if (formName.includes("mega")) {
    return true;
  }
  if (["xy", "x", "y", "sxy", "sx", "sy"].includes(formName)) {
    return true;
  }
  return tokenize(form.name).includes("mega");
}

function scoreMegaCandidate(form: Pokemon3DForm, megaName: string) {
  const target = normalizeText(megaName);
  const targetTokens = tokenize(megaName).filter((token) => token !== "shiny");
  const source = normalizeText(form.name);
  const sourceTokens = tokenize(form.name);
  let score = 0;

  targetTokens.forEach((token) => {
    if (sourceTokens.includes(token)) {
      score += 3;
    } else {
      score -= 2;
    }
  });

  if (source === target) {
    score += 10;
  } else if (source.includes(target)) {
    score += 6;
  }

  if (sourceTokens.includes("mega")) {
    score += 2;
  }

  return score;
}

function pickBestMegaForm(forms: Pokemon3DForm[], megaName: string) {
  if (forms.length === 0) {
    return null;
  }

  return forms
    .map((form) => ({
      form,
      score: scoreMegaCandidate(form, megaName)
    }))
    .sort((a, b) => b.score - a.score || a.form.name.localeCompare(b.form.name))[0]?.form ?? null;
}

const fetchPokemon3dCatalog = cache(async (): Promise<Pokemon3DEntry[]> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), POKEMON_3D_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(POKEMON_3D_API_URL, {
      signal: controller.signal,
      next: {
        revalidate: POKEMON_3D_REVALIDATE_SECONDS
      }
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .map((entry: unknown) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const candidate = entry as { id?: unknown; forms?: unknown };
        if (typeof candidate.id !== "number" || !Array.isArray(candidate.forms)) {
          return null;
        }

        const forms = candidate.forms
          .map((form: unknown) => {
            if (!form || typeof form !== "object") {
              return null;
            }

            const formCandidate = form as {
              name?: unknown;
              model?: unknown;
              formName?: unknown;
            };

            if (
              typeof formCandidate.name !== "string" ||
              typeof formCandidate.model !== "string"
            ) {
              return null;
            }

            return {
              name: formCandidate.name,
              model: formCandidate.model,
              formName: typeof formCandidate.formName === "string" ? formCandidate.formName : ""
            };
          })
          .filter((form): form is Pokemon3DForm => Boolean(form));

        return {
          id: candidate.id,
          forms
        };
      })
      .filter((entry): entry is Pokemon3DEntry => Boolean(entry));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
});

export const resolveMegaModelUrls = cache(
  async (baseDexNumber: number, megaName: string): Promise<MegaModelUrls> => {
    const catalog = await fetchPokemon3dCatalog();
    const speciesEntry = catalog.find((entry) => entry.id === baseDexNumber);

    if (!speciesEntry) {
      return { regularUrl: null, shinyUrl: null };
    }

    const megaForms = speciesEntry.forms.filter((form) => isMegaForm(form));
    if (megaForms.length === 0) {
      return { regularUrl: null, shinyUrl: null };
    }

    const regularCandidates = megaForms.filter((form) => !isShinyForm(form));
    const shinyCandidates = megaForms.filter((form) => isShinyForm(form));

    const regularMatch = pickBestMegaForm(regularCandidates, megaName);
    const shinyMatch = pickBestMegaForm(shinyCandidates, megaName);

    return {
      regularUrl: regularMatch?.model ?? null,
      shinyUrl: shinyMatch?.model ?? null
    };
  }
);
