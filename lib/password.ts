import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);
const HASH_PREFIX = "scrypt";
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${HASH_PREFIX}:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [prefix, salt, digest] = storedHash.split(":");
  if (!prefix || !salt || !digest || prefix !== HASH_PREFIX) {
    return false;
  }

  const expectedDigest = Buffer.from(digest, "hex");
  const derivedKey = (await scrypt(password, salt, expectedDigest.length)) as Buffer;

  if (derivedKey.length !== expectedDigest.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedDigest);
}

