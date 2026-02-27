import assert from "node:assert/strict";
import test from "node:test";
import {
    GENERATIONS,
    DEFAULT_GENERATION_KEY,
    getGenerationByKey,
    getGenerationByPokemonId
} from "../lib/generations";

test("GENERATIONS has all 9 entries", () => {
    assert.equal(GENERATIONS.length, 9);
});

test("GENERATIONS covers IDs 1-1025 without gaps or overlaps", () => {
    for (let i = 0; i < GENERATIONS.length - 1; i++) {
        const current = GENERATIONS[i];
        const next = GENERATIONS[i + 1];
        assert.equal(
            current.endId + 1,
            next.startId,
            `Gap between ${current.key} (end ${current.endId}) and ${next.key} (start ${next.startId})`
        );
    }
    assert.equal(GENERATIONS[0].startId, 1);
    assert.equal(GENERATIONS[GENERATIONS.length - 1].endId, 1025);
});

test("every generation has valid key, label, and region", () => {
    for (const gen of GENERATIONS) {
        assert.ok(gen.key.startsWith("gen"), `Key ${gen.key} should start with 'gen'`);
        assert.ok(gen.label.length > 0, `Label for ${gen.key} is empty`);
        assert.ok(gen.region.length > 0, `Region for ${gen.key} is empty`);
        assert.ok(gen.startId > 0, `startId for ${gen.key} must be positive`);
        assert.ok(gen.endId >= gen.startId, `endId must be >= startId for ${gen.key}`);
    }
});

test("DEFAULT_GENERATION_KEY is gen1", () => {
    assert.equal(DEFAULT_GENERATION_KEY, "gen1");
});

test("getGenerationByKey returns correct generation", () => {
    const gen1 = getGenerationByKey("gen1");
    assert.equal(gen1.region, "Kanto");

    const gen5 = getGenerationByKey("gen5");
    assert.equal(gen5.region, "Unova");

    const gen9 = getGenerationByKey("gen9");
    assert.equal(gen9.region, "Paldea");
});

test("getGenerationByPokemonId resolves boundary IDs correctly", () => {
    // First Pokemon
    assert.equal(getGenerationByPokemonId(1).key, "gen1");
    // Last of Gen 1
    assert.equal(getGenerationByPokemonId(151).key, "gen1");
    // First of Gen 2
    assert.equal(getGenerationByPokemonId(152).key, "gen2");
    // Last Pokemon
    assert.equal(getGenerationByPokemonId(1025).key, "gen9");
    // Mid-range
    assert.equal(getGenerationByPokemonId(25).key, "gen1"); // Pikachu
    assert.equal(getGenerationByPokemonId(448).key, "gen4"); // Lucario
    assert.equal(getGenerationByPokemonId(700).key, "gen6"); // Sylveon
});

test("getGenerationByPokemonId falls back to gen1 for out-of-range IDs", () => {
    const fallback = getGenerationByPokemonId(9999);
    assert.equal(fallback.key, "gen1");
});
