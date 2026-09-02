"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const INDEX_HTML = path.join(__dirname, "..", "index.html");
const HISTORY_KEY = "nfa_utm_history_v1";
const HISTORY_MAX = 25;
function extractScript(html) {
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const external = [...html.matchAll(/<script\s+src=["']([^"']+)["']><\/script>/g)];
  let src = "";
  if (inline.length === 1) src = inline[0][1];
  else if (external.length === 1) {
    const rel = external[0][1];
    assert.ok(!/^https?:/i.test(rel), "script src must be same-origin");
    src = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
  } else assert.fail("index.html must contain exactly one application script");
  const marker = "})();";
  const at = src.lastIndexOf(marker);
  assert.notEqual(at, -1, "script must end with an IIFE close");
  const hooks = ";globalThis.__utmTestHooks = { sanitizeLower, sanitizeId, csvSafe, loadHistory, saveHistory, buildUTM, renderHistory, applyPreset, parsePlacementLines, generateBatch, lastBatch, BATCH_MAX, HISTORY_KEY, HISTORY_MAX };";
  return src.slice(0, at) + hooks + "\n" + src.slice(at);
}
class FakeElement {
  constructor(tagName) { this.tagName = tagName; this.children = []; this.listeners = Object.create(null); this.attributes = Object.create(null); this.style = {}; this.value = ""; this.className = ""; this.hidden = false; this._text = ""; }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  dispatch(type) { const event = { preventDefault() {} }; for (const fn of this.listeners[type] || []) fn.call(this, event); }
  click() { this.dispatch("click"); }
  appendChild(child) { this.children.push(child); return child; }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(""); }
  set textContent(value) { this._text = String(value); this.children = []; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; }
  hrefs() { const out = []; const walk = (node) => { if (typeof node.href === "string") out.push(node.href); node.children.forEach(walk); }; walk(this); return out; }
}
function makeDocument() {
  const ids = ["status","historyList","clearHistoryBtn","utmForm","generatedUrl","result","copyBtn","exportBtn","clearBtn","baseUrl","utmSource","utmMedium","utmCampaign","utmId","utmTerm","utmContent","placementLines","batchBtn","batchResult","batchList","copyBatchBtn","exportBatchBtn"];
  const els = {};
  ids.forEach((id) => { els[id] = new FakeElement(id.includes("Btn") || id === "utmForm" ? "button" : "div"); });
  els.utmForm = new FakeElement("form");
  els.result.hidden = true;
  els.utmForm.reset = () => { ["baseUrl","utmSource","utmMedium","utmCampaign","utmId","utmTerm","utmContent","placementLines"].forEach((id) => { els[id].value = ""; }); };
  const sanitizeLowerInputs = [els.utmSource, els.utmMedium, els.utmCampaign, els.utmTerm, els.utmContent];
  const presetButtons = ["youtube","instagram","discount","partnership","influencer"].map((name) => { const btn = new FakeElement("button"); btn.setAttribute("data-preset", name); return btn; });
  const document = {
    getElementById: (id) => els[id] || null,
    createElement: (tag) => new FakeElement(tag),
    querySelectorAll: (selector) => selector === ".preset-btn" ? presetButtons : selector === ".sanitize-lower" ? sanitizeLowerInputs : []
  };
  return { document, els, presetButtons };
}
function makeLocalStorage(seed) {
  const map = new Map(Object.entries(seed || {}));
  return { getItem: (key) => (map.has(key) ? map.get(key) : null), setItem: (key, value) => void map.set(key, String(value)), removeItem: (key) => void map.delete(key), clear: () => map.clear(), entries: () => map };
}
function loadApp({ storageSeed } = {}) {
  const html = fs.readFileSync(INDEX_HTML, "utf8");
  const src = extractScript(html);
  const { document, els, presetButtons } = makeDocument();
  const storage = makeLocalStorage(storageSeed);
  const blobs = [];
  class TestURL extends URL {}
  TestURL.createObjectURL = (blob) => { blobs.push(blob); return "blob:fake-" + blobs.length; };
  TestURL.revokeObjectURL = () => {};
  const context = vm.createContext({ document, localStorage: storage, navigator: {}, URL: TestURL, URLSearchParams, Blob, Date, console });
  vm.runInContext(src, context, { filename: "app.js" });
  return { hooks: context.__utmTestHooks, els, presetButtons, storage, blobs };
}
function storedHistory(storage) { const raw = storage.entries().get(HISTORY_KEY); return raw ? JSON.parse(raw) : []; }
function fromVm(value) { return JSON.parse(JSON.stringify(value)); }
function makeEntry(overrides = {}) { return { url: "https://brand.example/landing?utm_source=youtube", time: "2026-08-17 12:00", params: { source: "youtube", medium: "creator", campaign: "summer_collab_2026", id: "cmp-summer-collab-2026", term: "", content: "plc-greta-video-01" }, ...overrides }; }
test("sanitizeLower enforces creator naming conventions", () => { const { hooks } = loadApp(); assert.equal(hooks.sanitizeLower("YouTube Creator"), "youtube_creator"); assert.equal(hooks.sanitizeLower("  Summer Collab!  "), "summer_collab"); });
test("sanitizeId preserves case and GA4-safe punctuation", () => { const { hooks } = loadApp(); assert.equal(hooks.sanitizeId("CMP Summer 2026"), "CMP-Summer-2026"); assert.equal(hooks.sanitizeId("cmp:launch_01.x"), "cmp:launch_01.x"); });
test("csvSafe neutralizes spreadsheet formula cells", () => { const { hooks } = loadApp(); assert.equal(hooks.csvSafe("=HYPERLINK(x)"), "'=HYPERLINK(x)"); assert.equal(hooks.csvSafe("+SUM(A1:A2)"), "'+SUM(A1:A2)"); });
test("submit builds a GA4-aligned link and preserves query and fragment", () => { const { els } = loadApp(); els.baseUrl.value = "brand.example/landing?ref=footer#reviews"; els.utmSource.value = "YouTube"; els.utmMedium.value = "Creator"; els.utmCampaign.value = "Summer Collab 2026"; els.utmId.value = "CMP-Summer-2026"; els.utmContent.value = "plc-greta-video-01"; els.utmForm.dispatch("submit"); const link = els.generatedUrl.textContent; assert.ok(link.includes("utm_source=youtube"), link); assert.ok(link.includes("utm_id=CMP-Summer-2026"), link); assert.ok(link.endsWith("#reviews"), link); });
test("submit rejects javascript: base URLs", () => { const { els } = loadApp(); els.baseUrl.value = "javascript:alert(1)"; els.utmForm.dispatch("submit"); assert.match(els.status.textContent, /valid http/i); assert.equal(els.result.hidden, true); });
test("dangerous URL schemes stored in localStorage are never rendered", () => { const seed = { [HISTORY_KEY]: JSON.stringify([makeEntry({ url: "javascript:alert(1)" }), makeEntry({ url: "https://ok.example/?utm_source=youtube" })]) }; const { hooks, els } = loadApp({ storageSeed: seed }); assert.equal(hooks.loadHistory().length, 1); assert.deepEqual(els.historyList.hrefs(), ["https://ok.example/?utm_source=youtube"]); });
test("parsePlacementLines sanitizes, dedupes, and caps at 40", () => { const { hooks } = loadApp(); assert.deepEqual(fromVm(hooks.parsePlacementLines("plc-Greta-video-01\n\nplc-greta-video-01\nplc priya video 01")), ["plc-greta-video-01", "plc_priya_video_01"]); assert.equal(hooks.parsePlacementLines(Array.from({ length: 45 }, (_, i) => "plc-" + i).join("\n")).length, 40); });
test("generateBatch builds distinct utm_content values and skips history", () => { const { hooks, els, storage } = loadApp(); els.baseUrl.value = "https://shop.example.com/offer?ref=footer#buy"; els.utmSource.value = "YouTube"; els.utmId.value = "CMP-Summer-2026"; els.placementLines.value = "plc-greta-video-01\nplc-greta-video-02\nplc-priya-video-01"; const items = fromVm(hooks.generateBatch()); assert.equal(items.length, 3); assert.deepEqual(items.map((item) => new URL(item.url).searchParams.get("utm_content")), ["plc-greta-video-01", "plc-greta-video-02", "plc-priya-video-01"]); assert.equal(storedHistory(storage).length, 0); });
test("generateBatch rejects an invalid base URL", () => { const { hooks, els } = loadApp(); els.placementLines.value = "plc-1"; els.baseUrl.value = "javascript:alert(1)"; assert.deepEqual(fromVm(hooks.generateBatch()), []); assert.match(els.status.textContent, /valid http/i); });
test("page script stays self-contained: no network, no third-party calls", () => { const html = fs.readFileSync(INDEX_HTML, "utf8"); const src = extractScript(html); for (const banned of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "innerHTML"]) assert.ok(!src.includes(banned), banned); const remoteScripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]; assert.ok(remoteScripts.every((m) => !/^https?:/i.test(m[1]))); });
