"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const INDEX_HTML = path.join(__dirname, "..", "index.html");
const HISTORY_KEY = "nfa_utm_history_v1";

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
  const sanitizeLowerInputs = [els.utmSource, els.utmMedium, els.utmCampaign, els.utmTerm, els.utmContent];
  const presetButtons = ["youtube", "instagram", "discount", "partnership", "influencer"].map((name) => {
    const btn = new FakeElement("button");
    btn.setAttribute("data-preset", name);
    return btn;
  });
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

test("sanitizeLower enforces creator naming conventions", () => {
  const { hooks } = loadApp();
  assert.equal(hooks.sanitizeLower("YouTube Creator"), "youtube_creator");
  assert.equal(hooks.sanitizeLower("  Summer Collab!  "), "summer_collab");
});

test("sanitizeId preserves case and GA4-safe punctuation", () => {
  const { hooks } = loadApp();
  assert.equal(hooks.sanitizeId("CMP Summer 2026"), "CMP-Summer-2026");
});

test("csvSafe neutralizes spreadsheet formula cells", () => {
  const { hooks } = loadApp();
  assert.equal(hooks.csvSafe("=HYPERLINK(x)"), "'=HYPERLINK(x)");
});

test("submit builds a GA4-aligned link", () => {
  const { els } = loadApp();
  els.baseUrl.value = "https://brand.example/landing";
  els.utmSource.value = "YouTube";
  els.utmMedium.value = "Creator";
  els.utmCampaign.value = "Summer Collab 2026";
  els.utmId.value = "CMP-Summer-2026";
  els.utmContent.value = "plc-greta-video-01";
  els.utmForm.dispatch("submit");
  const link = els.generatedUrl.textContent;
  assert.ok(link.includes("utm_source=youtube"), link);
  assert.ok(link.includes("utm_id=CMP-Summer-2026"), link);
  assert.equal(els.result.hidden, false);
});

test("dangerous URL schemes stored in localStorage are never rendered", () => {
  const seed = {
    [HISTORY_KEY]: JSON.stringify([
      { url: "javascript:alert(1)", time: "t", params: {} },
      { url: "https://ok.example/?utm_source=youtube", time: "t", params: {} },
    ]),
  };
  const { hooks, els } = loadApp({ storageSeed: seed });
  assert.equal(hooks.loadHistory().length, 1);
  assert.deepEqual(els.historyList.hrefs(), ["https://ok.example/?utm_source=youtube"]);
});

test("page script stays self-contained: no network, no third-party calls", () => {
  const html = fs.readFileSync(INDEX_HTML, "utf8");
  const src = extractScript(html);
  for (const banned of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "innerHTML"]) {
    assert.ok(!src.includes(banned), `script must not use ${banned}`);
  }
  assert.ok(!/<script[^>]+src=/.test(html), "no external scripts");
});
