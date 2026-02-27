import assert from "node:assert/strict";
import test from "node:test";
import { buildVerificationEmail } from "../lib/email-verification-template";
import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  verifyEmailVerificationToken
} from "../lib/email-verification-token";

test("email verification token round-trips user id and email", () => {
  process.env.NEXTAUTH_SECRET = "unit-test-secret";

  const token = createEmailVerificationToken({
    userId: "trainer-123",
    email: "Trainer@DexLoom.net"
  });
  const result = verifyEmailVerificationToken(token);

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.payload.uid, "trainer-123");
  assert.equal(result.payload.email, "trainer@dexloom.net");
});

test("email verification token rejects tampered signatures", () => {
  process.env.NEXTAUTH_SECRET = "unit-test-secret";

  const token = createEmailVerificationToken({
    userId: "trainer-123",
    email: "trainer@dexloom.net"
  });
  const tampered = `${token}x`;
  const result = verifyEmailVerificationToken(tampered);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, "invalid");
  }
});

test("verification email template includes DexLoom link and Lucario art", () => {
  process.env.NEXTAUTH_URL = "https://dexloom.net";

  const verifyUrl = buildEmailVerificationUrl("abc123");
  const email = buildVerificationEmail({
    trainerName: "Ash Ketchum",
    userId: "25593136-5a20-4d39-ba9e-261f1f3bb4c9",
    verifyUrl
  });

  assert.match(email.subject, /DexLoom Trainer Card/);
  assert.match(email.html, /Lucario verification guide/);
  assert.match(email.html, /VERIFY TRAINER CARD/);
  assert.match(email.html, /https:\/\/dexloom\.net\/images\/email\/lucario-verifier\.png/);
  assert.match(email.text, /Verify now:/);
});
