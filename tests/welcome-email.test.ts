import assert from "node:assert/strict";
import test from "node:test";
import { buildWelcomeEmail } from "../lib/welcome-email-template";

test("welcome email template includes roadmap sections and DexLoom links", () => {
  process.env.NEXTAUTH_URL = "https://dexloom.net";

  const email = buildWelcomeEmail({
    trainerName: "Ash Ketchum"
  });

  assert.match(email.subject, /DexLoom League Notice \| Trainer Registration Confirmed/);
  assert.match(email.html, /Trainer Registration Confirmed/);
  assert.match(email.html, /Official Trainer Briefing/);
  assert.match(email.html, /Lucario welcome guide/);
  assert.match(email.html, /ENTER THE LEAGUE/);
  assert.match(email.html, /https:\/\/dexloom\.net\/assets\/pokemon-go\/items\/poke-ball\.png/);
  assert.match(email.html, /https:\/\/dexloom\.net\/tools/);
  assert.match(email.html, /https:\/\/dexloom\.net\/favorites/);
  assert.match(email.html, /https:\/\/dexloom\.net\/social/);
  assert.match(email.text, /Your trainer registration has been received/);
  assert.match(email.text, /League archive for the Pokemon community/i);
});
