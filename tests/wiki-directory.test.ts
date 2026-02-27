import assert from "node:assert/strict";
import test from "node:test";
import {
    WIKI_PRIMARY_MENU,
    WIKI_SECONDARY_MENU,
    WIKI_SEARCH_INDEX
} from "../lib/wiki-directory";

test("primary menu has required entries", () => {
    assert.ok(WIKI_PRIMARY_MENU.length >= 5, "Primary menu should have at least 5 entries");

    const hrefs = WIKI_PRIMARY_MENU.map((item) => item.href);
    assert.ok(hrefs.includes("/"), "Primary menu must include home route");
    assert.ok(hrefs.includes("/moves"), "Primary menu must include moves");
    assert.ok(hrefs.includes("/items"), "Primary menu must include items");
    assert.ok(hrefs.includes("/games"), "Primary menu must include games");
});

test("secondary menu has entries", () => {
    assert.ok(WIKI_SECONDARY_MENU.length >= 3, "Secondary menu should have entries");
});

test("all menu entries have non-empty labels and valid hrefs", () => {
    const allMenuItems = [...WIKI_PRIMARY_MENU, ...WIKI_SECONDARY_MENU];

    for (const item of allMenuItems) {
        assert.ok(item.label.trim().length > 0, `Menu item has empty label: ${JSON.stringify(item)}`);
        assert.ok(item.href.startsWith("/"), `Menu href must start with /: ${item.href}`);
    }
});

test("no duplicate hrefs across menus", () => {
    const allHrefs = [...WIKI_PRIMARY_MENU, ...WIKI_SECONDARY_MENU].map((item) => item.href);
    const uniqueHrefs = new Set(allHrefs);
    assert.equal(uniqueHrefs.size, allHrefs.length, "Found duplicate hrefs in menu");
});

test("search index has substantial entries", () => {
    assert.ok(WIKI_SEARCH_INDEX.length >= 20, `Search index has only ${WIKI_SEARCH_INDEX.length} entries`);
});

test("every search entry has valid title, href, and keywords", () => {
    for (const entry of WIKI_SEARCH_INDEX) {
        assert.ok(entry.title.trim().length > 0, `Search entry has empty title`);
        assert.ok(entry.href.startsWith("/") || entry.href.startsWith("#"), `Invalid href: ${entry.href}`);
        assert.ok(Array.isArray(entry.keywords), `Keywords must be array for: ${entry.title}`);
        assert.ok(entry.keywords.length > 0, `No keywords for: ${entry.title}`);
    }
});

test("search index contains all primary menu destinations", () => {
    const searchHrefs = new Set(WIKI_SEARCH_INDEX.map((entry) => entry.href));

    for (const menuItem of WIKI_PRIMARY_MENU) {
        assert.ok(
            searchHrefs.has(menuItem.href),
            `Primary menu href ${menuItem.href} (${menuItem.label}) is missing from search index`
        );
    }
});
