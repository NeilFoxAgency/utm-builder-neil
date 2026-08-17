"use strict";

/**
 * Regression tests for the UTM builder's inline script.
 *
 * The tool ships as a single dependency-free index.html. These tests extract
 * the real <script> block from that file and run it in Node's vm against a
 * minimal fake DOM, so the shipped artifact itself is verified — no refactor,
 * no build step, and no npm dependencies.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const INDEX_HTML = path.join(__dirname, "..", "index.html");
const HISTORY_KEY = "nfa_utm_history_v1";
const HISTORY_MAX = 25;

/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

function extractScript(html) {
  const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(matches.length, 1, "index.html must contain exactly one inline <script> block");
  const src = matches[0][1];
  const marker = "})();";
  const at = src.lastIndexOf(marker);
  assert.notEqual(at, -1, "inline script must end with an IIFE close");
  const hooks =
    ";globalThis.__utmTestHooks = { sanitizeLower, sanitizeId, csvSafe, " +
    "loadHistory, saveHistory, buildUTM, renderHistory, applyPreset, " +
    "HISTORY_KEY, HISTORY_MAX };";
  return src.slice(0, at) + hooks + "\n" + src.slice(at);
}

/* ------------------------------------------------------------------ */
/* Minimal fake DOM                                                    */
/* ------------------------------------------------------------------ */

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.listeners = Object.create(null);
    this.attributes = Object.create(null);
    this.style = {};
    this.value = "";
    this.className = "";
    this.hidden = false;
    this._text = "";
  }

  addEventListener(type, fn) {
    (this.listeners[type] = this.listeners[type] || []).push(fn);
  }

  dispatch(type) {
    const event = { preventDefault() {} };
    for (const fn of this.listeners[type] || []) fn.call(this, event);
  }

  click() {
    this.dispatch("click");
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  get textContent() {
    return this._text + this.children.map((c) => c.textContent).join("");
  }

  set textContent(value) {
    this._text = String(value);
    this.children = [];
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name)
      ? this.attributes[name]
      : null;
  }

  /** Depth-first collection of every rendered href (anchors are the XSS surface). */
  hrefs() {
    const out = [];
    const walk = (node) => {
      if (typeof node.href === "string") out.push(node.href);
      node.children.forEach(walk);
    };
    walk(this);
    return out;
  }
}

function makeDocument() {
  const els = {
    status: new FakeElement("p"),
    historyList: new FakeElement("div"),
    clearHistoryBtn: new FakeElement("button"),
    utmForm: new FakeElement("form"),
    generatedUrl: new FakeElement("p"),
    result: new FakeElement("div"),
    copyBtn: new FakeElement("button"),
    exportBtn: new FakeElement("button"),
    clearBtn: new FakeElement("button"),
    baseUrl: new FakeElement("input"),
    utmSource: new FakeElement("input"),
    utmMedium: new FakeElement("input"),
    utmCampaign: new FakeElement("input"),
    utmId: new FakeElement("input"),
    utmTerm: new FakeElement("input"),
    utmContent: new FakeElement("input"),
  };
  els.result.hidden = true;
  els.utmForm.reset = () => {
    for (const id of ["baseUrl", "utmSource", "utmMedium", "utmCampaign", "utmId", "utmTerm", "utmContent"]) {
      els[id].value = "";
    }
  };
  const sanitizeLowerInputs = [
    els.utmSource,
    els.utmMedium,
    els.utmCampaign,
    els.utmTerm,
    els.utmContent,
  ];
  const presetButtons = ["youtube", "instagram", "discount", "partnership", "influencer"].map(
    (name) => {
      const btn = new FakeElement("button");
      btn.setAttribute("data-preset", name);
      return btn;
    }
  );
  const document = {
    getElementById: (id) => els[id] || null,
    createElement: (tag) => new FakeElement(tag),
    querySelectorAll: (selector) => {
      if (selector === ".preset-btn") return presetButtons;
      if (selector === ".sanitize-lower") return sanitizeLowerInputs;
      return [];
    },
  };
  return { document, els, presetButtons };
}

function makeLocalStorage(seed) {
  const map = new Map(Object.entries(seed || {}));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => void map.set(key, String(value)),
    removeItem: (key) => void map.delete(key),
    clear: () => map.clear(),
    entries: () => map,
  };
}

/**
 * Load index.html, run its script in a fresh vm context, and return the
 * captured internals plus the fake DOM/storage for assertions.
 */
function loadApp({ storageSeed } = {}) {
  const html = fs.readFileSync(INDEX_HTML, "utf8");
  const src = extractScript(html);

  const { document, els, presetButtons } = makeDocument();
  const storage = makeLocalStorage(storageSeed);
  const blobs = [];

  class TestURL extends URL {}
  TestURL.createObjectURL = (blob) => {
    blobs.push(blob);
    return "blob:fake-" + blobs.length;
  };
  TestURL.revokeObjectURL = () => {};

  const context = vm.createContext({
    document,
    localStorage: storage,
    navigator: {},
    URL: TestURL,
    URLSearchParams,
    Blob,
    Date,
    console,
  });
  vm.runInContext(src, context, { filename: "index.html<script>" });
  return { hooks: context.__utmTestHooks, els, presetButtons, storage, blobs };
}

function storedHistory(storage) {
  const raw = storage.entries().get(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

function makeEntry(overrides = {}) {
  return {
    url: "https://brand.example/landing?utm_source=youtube",
    time: "2026-08-17 12:00",
    params: {
      source: "youtube",
      medium: "creator",
      campaign: "summer_collab_2026",
      id: "cmp-summer-collab-2026",
      term: "",
      content: "plc-greta-video-01",
    },
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Sanitizers                                                          */
/* ------------------------------------------------------------------ */

test("sanitizeLower enforces creator naming conventions", () => {
  const { hooks } = loadApp();
  assert.equal(hooks.sanitizeLower("YouTube Creator"), "youtube_creator");
  assert.equal(hooks.sanitizeLower("  Summer Collab!  "), "summer_collab");
  assert.equal(hooks.sanitizeLower("Q3--Seed__ing"), "q3--seed__ing");
  assert.equal(hooks.sanitizeLower("Café Ümlaut"), "caf_mlaut");
  assert.equal(hooks.sanitizeLower(""), "");
  assert.equal(hooks.sanitizeLower(null), "");
});

test("sanitizeId preserves case and GA4-safe punctuation", () => {
  const { hooks } = loadApp();
  assert.equal(hooks.sanitizeId("CMP Summer 2026"), "CMP-Summer-2026");
  assert.equal(hooks.sanitizeId("cmp:launch_01.x"), "cmp:launch_01.x");
  assert.equal(hooks.sanitizeId("cmp@home#1"), "cmphome1");
  assert.equal(hooks.sanitizeId("   "), "");
});

/* ------------------------------------------------------------------ */
/* CSV safety                                                          */
/* ------------------------------------------------------------------ */

test("csvSafe neutralizes spreadsheet formula cells", () => {
  const { hooks } = loadApp();
  assert.equal(hooks.csvSafe("=HYPERLINK(x)"), "'=HYPERLINK(x)");
  assert.equal(hooks.csvSafe("+SUM(A1:A2)"), "'+SUM(A1:A2)");
  assert.equal(hooks.csvSafe("-10"), "'-10");
  assert.equal(hooks.csvSafe("@handle"), "'@handle");
  assert.equal(hooks.csvSafe("\t=1+1"), "'\t=1+1");
});

test("csvSafe quotes and doubles quotes without breaking plain cells", () => {
  const { hooks } = loadApp();
  assert.equal(hooks.csvSafe("a,b"), '"a,b"');
  assert.equal(hooks.csvSafe('say "hi"'), '"say ""hi"""');
  assert.equal(hooks.csvSafe("youtube"), "youtube");
  assert.equal(hooks.csvSafe(null), "");
  // Formula-like AND comma-containing: apostrophe first, then quoted.
  assert.equal(hooks.csvSafe("=1,2"), '"\'=1,2"');
});

/* ------------------------------------------------------------------ */
/* Link generation through the real submit handler                     */
/* ------------------------------------------------------------------ */

test("submit builds a GA4-aligned link and preserves query and fragment", () => {
  const { els } = loadApp();
  els.baseUrl.value = "brand.example/landing?ref=footer#reviews";
  els.utmSource.value = "YouTube";
  els.utmMedium.value = "Creator";
  els.utmCampaign.value = "Summer Collab 2026";
  els.utmId.value = "CMP-Summer-2026";
  els.utmTerm.value = "";
  els.utmContent.value = "plc-greta-video-01";

  els.utmForm.dispatch("submit");

  const link = els.generatedUrl.textContent;
  assert.ok(link.startsWith("https://brand.example/landing?"), link);
  assert.ok(link.includes("ref=footer"), "existing query params kept");
  assert.ok(link.includes("utm_source=youtube"), link);
  assert.ok(link.includes("utm_medium=creator"), link);
  assert.ok(link.includes("utm_campaign=summer_collab_2026"), link);
  assert.ok(link.includes("utm_id=CMP-Summer-2026"), "utm_id keeps its case");
  assert.ok(link.includes("utm_content=plc-greta-video-01"), link);
  assert.ok(!link.includes("utm_term="), "empty params omitted");
  assert.ok(link.endsWith("#reviews"), "fragment stays last so GA4 sees the tags");
  assert.ok(link.indexOf("utm_source") < link.indexOf("#reviews"));
  assert.equal(els.result.hidden, false, "result panel revealed");
  assert.match(els.status.textContent, /history saved/i);
});

test("submit rejects a missing or invalid base URL without generating a link", () => {
  const { els } = loadApp();

  els.baseUrl.value = "";
  els.utmForm.dispatch("submit");
  assert.match(els.status.textContent, /required/i);
  assert.equal(els.result.hidden, true);
  assert.equal(els.generatedUrl.textContent, "");

  els.baseUrl.value = "javascript:alert(1)";
  els.utmForm.dispatch("submit");
  assert.match(els.status.textContent, /valid http/i);
  assert.equal(els.result.hidden, true);
  assert.equal(els.generatedUrl.textContent, "");
});

test("blur handlers normalize classic fields and utm_id in place", () => {
  const { els } = loadApp();
  els.utmSource.value = "You Tube!";
  els.utmSource.dispatch("blur");
  assert.equal(els.utmSource.value, "you_tube");

  els.utmId.value = "CMP Summer 2026";
  els.utmId.dispatch("blur");
  assert.equal(els.utmId.value, "CMP-Summer-2026");
});

test("preset buttons fill aligned campaign values", () => {
  const { els, presetButtons } = loadApp();
  presetButtons[0].click(); // youtube
  assert.equal(els.utmSource.value, "youtube");
  assert.equal(els.utmMedium.value, "creator");
  assert.equal(els.utmCampaign.value, "summer-collab-2026");
  assert.equal(els.utmId.value, "cmp-summer-collab-2026");
});

/* ------------------------------------------------------------------ */
/* History persistence and rendering                                   */
/* ------------------------------------------------------------------ */

test("history persists privately, newest first, capped at 25", () => {
  const seed = {};
  const app = loadApp({ storageSeed: seed });
  for (let i = 0; i < HISTORY_MAX + 2; i++) {
    app.els.baseUrl.value = "https://brand.example/p" + i;
    app.els.utmSource.value = "youtube";
    app.els.utmForm.dispatch("submit");
  }
  const items = storedHistory(app.storage);
  assert.equal(items.length, HISTORY_MAX, "history capped");
  assert.ok(items[0].url.includes("/p26"), "newest entry first");
  assert.equal(app.storage.entries().size, 1, "single private storage key");
});

test("corrupt localStorage JSON falls back to an empty history", () => {
  const { els, hooks } = loadApp({ storageSeed: { [HISTORY_KEY]: "{not json" } });
  assert.equal(hooks.loadHistory().length, 0);
  assert.match(els.historyList.textContent, /no links yet/i);
});

test("stored non-object and non-string entries never reach the page", () => {
  const seed = {
    [HISTORY_KEY]: JSON.stringify([
      null,
      42,
      "https://string-entry.example/",
      { time: "no url" },
      makeEntry({ url: "https://ok.example/?utm_source=youtube" }),
    ]),
  };
  const { hooks, els } = loadApp({ storageSeed: seed });
  const kept = hooks.loadHistory();
  assert.equal(kept.length, 1);
  assert.equal(kept[0].url, "https://ok.example/?utm_source=youtube");
  assert.deepEqual(els.historyList.hrefs(), ["https://ok.example/?utm_source=youtube"]);
});

test("dangerous URL schemes stored in localStorage are never rendered", () => {
  const seed = {
    [HISTORY_KEY]: JSON.stringify([
      makeEntry({ url: "javascript:alert(document.cookie)" }),
      makeEntry({ url: "data:text/html,<script>alert(1)</script>" }),
      makeEntry({ url: "file:///etc/passwd" }),
      makeEntry({ url: "https://ok.example/?utm_source=youtube" }),
    ]),
  };
  const { hooks, els } = loadApp({ storageSeed: seed });
  const kept = hooks.loadHistory();
  assert.equal(kept.length, 1, "only the https entry survives");
  const hrefs = els.historyList.hrefs();
  assert.deepEqual(hrefs, ["https://ok.example/?utm_source=youtube"]);
  assert.ok(
    hrefs.every((h) => /^https:\/\//i.test(h)),
    "every rendered href is http(s)"
  );
});

test("generated links render through safe DOM nodes, never HTML strings", () => {
  const { els } = loadApp();
  els.baseUrl.value = 'https://brand.example/?x="><img src=x onerror=alert(1)>';
  els.utmSource.value = "youtube";
  els.utmForm.dispatch("submit");
  const rendered = els.generatedUrl;
  assert.equal(rendered.children.length, 1, "single anchor child");
  const anchor = rendered.children[0];
  assert.equal(anchor.tagName, "a");
  assert.equal(anchor.rel, "noopener noreferrer");
  // The payload survives only as inert text content, never as markup.
  assert.equal(anchor.textContent, anchor.href);
  assert.match(anchor.textContent, /onerror%3Dalert/, "payload survives only as inert encoded text");
});

/* ------------------------------------------------------------------ */
/* CSV export                                                          */
/* ------------------------------------------------------------------ */

test("CSV export emits a header and neutralizes formula-like cells", async () => {
  const evil = '=HYPERLINK("http://evil.example","click")';
  const seed = {
    [HISTORY_KEY]: JSON.stringify([
      makeEntry({
        time: "2026-08-17 12:00",
        params: {
          source: "youtube",
          medium: "creator",
          campaign: evil,
          id: "cmp-1",
          term: "",
          content: "plc-1",
        },
      }),
    ]),
  };
  const { els, blobs } = loadApp({ storageSeed: seed });
  els.exportBtn.click();

  assert.equal(blobs.length, 1, "one CSV blob produced");
  const text = await blobs[0].text();
  const lines = text.trimEnd().split("\n");
  assert.equal(lines[0], "Time,URL,Source,Medium,Campaign,Id,Term,Content");
  assert.equal(lines.length, 2);
  // Formula neutralized with a leading apostrophe, then safely quoted.
  assert.ok(lines[1].includes("\"'=HYPERLINK("), lines[1]);
  assert.ok(lines[1].includes('""http://evil.example""'), "quotes doubled");
  assert.match(els.status.textContent, /exported/i);
});

test("CSV export with an empty history explains instead of downloading", () => {
  const { els, blobs } = loadApp();
  els.exportBtn.click();
  assert.equal(blobs.length, 0);
  assert.match(els.status.textContent, /no history/i);
});

/* ------------------------------------------------------------------ */
/* Privacy guardrails                                                  */
/* ------------------------------------------------------------------ */

test("page script stays self-contained: no network, no third-party calls", () => {
  const html = fs.readFileSync(INDEX_HTML, "utf8");
  const src = extractScript(html);
  for (const banned of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "innerHTML"]) {
    assert.ok(!src.includes(banned), `script must not use ${banned}`);
  }
  // No remote subresources anywhere in the document.
  assert.ok(!/<script[^>]+src=/.test(html), "no external scripts");
  assert.ok(!/<link[^>]+href=["']https?:/.test(html), "no external stylesheets");
});
