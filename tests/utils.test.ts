import assert from "node:assert/strict";
import test from "node:test";
import { cn, formatLabel } from "../lib/utils";

test("cn merges class names correctly", () => {
    assert.equal(cn("a", "b"), "a b");
    assert.equal(cn("a", false && "b", "c"), "a c");
    assert.equal(cn("a", undefined, null, "b"), "a b");
    assert.equal(cn(""), "");
    assert.equal(cn(), "");
});

test("formatLabel converts hyphenated strings to title case", () => {
    assert.equal(formatLabel("fire"), "Fire");
    assert.equal(formatLabel("dark-pulse"), "Dark Pulse");
    assert.equal(formatLabel("thunder-wave"), "Thunder Wave");
    assert.equal(formatLabel("x-scissor"), "X Scissor");
    assert.equal(formatLabel(""), "");
});

test("formatLabel handles single character tokens", () => {
    assert.equal(formatLabel("a"), "A");
    assert.equal(formatLabel("a-b-c"), "A B C");
});
