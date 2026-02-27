import assert from "node:assert/strict";
import test from "node:test";
import { resolveAvatarSrc } from "../lib/avatar-url";

test("resolveAvatarSrc returns null for empty/null/undefined", () => {
    assert.equal(resolveAvatarSrc(null), null);
    assert.equal(resolveAvatarSrc(undefined), null);
    assert.equal(resolveAvatarSrc(""), null);
    assert.equal(resolveAvatarSrc("   "), null);
});

test("resolveAvatarSrc converts local avatar paths to proxy URLs", () => {
    const result = resolveAvatarSrc("/images/avatars/red.svg");
    assert.equal(result, "/api/profile/avatar-file/red.svg");
});

test("resolveAvatarSrc encodes special characters in filenames", () => {
    const result = resolveAvatarSrc("/images/avatars/my avatar.png");
    assert.equal(result, "/api/profile/avatar-file/my%20avatar.png");
});

test("resolveAvatarSrc returns null for local base path without filename", () => {
    const result = resolveAvatarSrc("/images/avatars/");
    assert.equal(result, null);
});

test("resolveAvatarSrc passes through external URLs unchanged", () => {
    const url = "https://example.com/avatar.png";
    assert.equal(resolveAvatarSrc(url), url);
});

test("resolveAvatarSrc passes through non-local paths unchanged", () => {
    const path = "/other/path/image.png";
    assert.equal(resolveAvatarSrc(path), path);
});
