import assert from "node:assert/strict";
import test from "node:test";
import {
  GAME_ENTRY_SECTION_KEYS,
  MOBILE_GAME_CATALOG,
  MAINLINE_GAME_CATALOG,
  MAINLINE_GAME_DETAILS,
  getMainlineGameDetailBySlug
} from "../lib/mainline-games";

test("mainline game details cover all catalog slugs", () => {
  assert.equal(MAINLINE_GAME_CATALOG.length, 40);
  assert.equal(MAINLINE_GAME_DETAILS.length, MAINLINE_GAME_CATALOG.length);

  for (const entry of MAINLINE_GAME_CATALOG) {
    const detail = getMainlineGameDetailBySlug(entry.slug);
    assert.ok(detail, `Missing detail entry for slug: ${entry.slug}`);
  }
});

test("mobile game catalog is present and resolvable", () => {
  assert.equal(MOBILE_GAME_CATALOG.length, 6);

  for (const entry of MOBILE_GAME_CATALOG) {
    const detail = getMainlineGameDetailBySlug(entry.slug);
    assert.ok(detail, `Missing mobile detail entry for slug: ${entry.slug}`);
    assert.equal(detail?.generationKey, "mobile");
  }
});

test("every game entry has mandatory sections and validated media blocks", () => {
  const knownSlugSet = new Set(MAINLINE_GAME_CATALOG.map((entry) => entry.slug));

  for (const detail of MAINLINE_GAME_DETAILS) {
    assert.match(detail.lastVerifiedOn, /^\d{4}-\d{2}-\d{2}$/);

    for (const sectionKey of GAME_ENTRY_SECTION_KEYS) {
      const sourceIds = detail.sectionSourceMap[sectionKey];
      assert.ok(Array.isArray(sourceIds), `${detail.slug} missing section source map for ${sectionKey}`);
      assert.ok(sourceIds.length > 0, `${detail.slug} has empty source map for ${sectionKey}`);
      sourceIds.forEach((sourceId) => {
        assert.ok(sourceId.trim().length > 0, `${detail.slug} has blank source id in ${sectionKey}`);
      });
    }

    assert.equal(detail.mediaGallery.length, 4, `${detail.slug} media gallery must have 4 items`);
    let concreteMediaCount = 0;
    detail.mediaGallery.forEach((item, index) => {
      if (item.src !== null) {
        assert.ok(item.src.trim().length > 0, `${detail.slug} mediaGallery[${index}] src is empty`);
        concreteMediaCount += 1;
      }
      assert.ok(item.alt.trim().length > 0, `${detail.slug} mediaGallery[${index}] alt is empty`);
      assert.ok(item.sourceIds.length > 0, `${detail.slug} mediaGallery[${index}] sourceIds is empty`);
    });
    assert.ok(concreteMediaCount >= 1, `${detail.slug} media gallery must include at least one concrete asset`);

    detail.relatedSlugs.forEach((relatedSlug) => {
      assert.ok(knownSlugSet.has(relatedSlug), `${detail.slug} references unknown related slug ${relatedSlug}`);
    });

    assert.ok(detail.releaseMatrix.length > 0, `${detail.slug} release matrix is empty`);
    detail.releaseMatrix.forEach((row, index) => {
      assert.ok(row.dateLabel.trim().length > 0, `${detail.slug} releaseMatrix[${index}] dateLabel empty`);
      assert.ok(row.notes.length > 0, `${detail.slug} releaseMatrix[${index}] notes empty`);
      assert.ok(row.sourceIds.length > 0, `${detail.slug} releaseMatrix[${index}] sourceIds empty`);
    });

    assert.ok(detail.versionDifferences.length > 0, `${detail.slug} version differences are empty`);
    detail.versionDifferences.forEach((row, index) => {
      assert.ok(row.category.trim().length > 0, `${detail.slug} versionDifferences[${index}] category empty`);
      assert.ok(row.leftVersion.trim().length > 0, `${detail.slug} versionDifferences[${index}] leftVersion empty`);
      assert.ok(row.rightVersion.trim().length > 0, `${detail.slug} versionDifferences[${index}] rightVersion empty`);
      assert.ok(row.notes.trim().length > 0, `${detail.slug} versionDifferences[${index}] notes empty`);
      assert.ok(row.sourceIds.length > 0, `${detail.slug} versionDifferences[${index}] sourceIds empty`);
    });

    assert.ok(detail.mechanicsIntroduced.length > 0, `${detail.slug} mechanicsIntroduced is empty`);
    assert.ok(detail.progressionOutline.length > 0, `${detail.slug} progressionOutline is empty`);
    assert.ok(detail.postgameProfile.length > 0, `${detail.slug} postgameProfile is empty`);
    assert.ok(detail.dlcAndPatchHistory.length > 0, `${detail.slug} dlcAndPatchHistory is empty`);

    assert.ok(detail.receptionAndSales.length > 0, `${detail.slug} receptionAndSales is empty`);
    detail.receptionAndSales.forEach((metric, index) => {
      assert.ok(metric.label.trim().length > 0, `${detail.slug} receptionAndSales[${index}] label empty`);
      assert.ok(metric.value.trim().length > 0, `${detail.slug} receptionAndSales[${index}] value empty`);
      assert.match(metric.asOf, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(metric.sourceIds.length > 0, `${detail.slug} receptionAndSales[${index}] sourceIds empty`);
    });

    const requiredStrings = [
      detail.title,
      detail.classification,
      detail.releaseDate,
      detail.overview,
      detail.storySummaryNoSpoiler,
      detail.worldProfile.routeStructure,
      detail.technicalProfile.renderTarget
    ];
    requiredStrings.forEach((value, index) => {
      assert.ok(value.trim().length > 0, `${detail.slug} required string #${index + 1} is empty`);
    });
  }
});
