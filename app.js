(function () {
  "use strict";
  var HISTORY_KEY = "nfa_utm_history_v1";
  var HISTORY_MAX = 25;
  var BATCH_MAX = 40;
  var lastBatch = { items: [] };
  var presets = {
    youtube: { source: "youtube", medium: "creator", campaign: "summer-collab-2026", id: "cmp-summer-collab-2026" },
    instagram: { source: "instagram", medium: "social", campaign: "summer-collab-2026", id: "cmp-summer-collab-2026" },
    discount: { source: "promo", medium: "discount", campaign: "summer-promo", id: "cmp-summer-promo", content: "code-summer15" },
    partnership: { source: "creator", medium: "partnership", campaign: "summer-collab-2026", id: "cmp-summer-collab-2026" },
    influencer: { source: "influencer", medium: "influencer", campaign: "q3-creator-seeding", id: "cmp-q3-creator-seeding" }
  };
  function sanitizeLower(val) { return String(val || "").toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, ""); }
  function sanitizeId(val) { return String(val || "").trim().replace(/\s+/g, "-").replace(/[^A-Za-z0-9._:-]/g, ""); }
  function setStatus(msg) { var el = document.getElementById("status"); if (el) el.textContent = msg || ""; }
  function loadHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (item) {
        return item !== null && typeof item === "object" && typeof item.url === "string" && /^https?:\/\//i.test(item.url);
      });
    } catch (e) { return []; }
  }
  function saveHistory(items) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_MAX))); } catch (e) {}
  }
  function csvSafe(cell) {
    var s = String(cell == null ? "" : cell);
    if (/^[=+\-@\t\r\n]/.test(s)) s = "'" + s;
    if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function renderLinkNode(container, url) {
    container.textContent = "";
    var a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = url;
    container.appendChild(a);
  }
  function renderHistory() {
    var list = document.getElementById("historyList");
    var clearBtn = document.getElementById("clearHistoryBtn");
    var history = loadHistory();
    list.textContent = "";
    if (history.length === 0) {
      var empty = document.createElement("p"); empty.className = "tip"; empty.textContent = "No links yet. Generate one to start a private history.";
      list.appendChild(empty); clearBtn.style.display = "none"; return;
    }
    history.forEach(function (item) {
      var div = document.createElement("div"); div.className = "history-item";
      var time = document.createElement("time"); time.textContent = item.time || "";
      div.appendChild(time); div.appendChild(document.createElement("br"));
      var a = document.createElement("a"); a.href = item.url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = item.url;
      div.appendChild(a); list.appendChild(div);
    });
    clearBtn.style.display = "inline-block";
  }
  function applyPreset(type) {
    var p = presets[type]; if (!p) return;
    if (p.source) document.getElementById("utmSource").value = p.source;
    if (p.medium) document.getElementById("utmMedium").value = p.medium;
    if (p.campaign) document.getElementById("utmCampaign").value = p.campaign;
    document.getElementById("utmId").value = p.id || "";
    document.getElementById("utmTerm").value = p.term || "";
    document.getElementById("utmContent").value = p.content || "";
    setStatus("Preset applied: " + type);
  }
  function parsePlacementLines(text) {
    var seen = Object.create(null); var out = [];
    String(text || "").split(/\r?\n/).forEach(function (line) {
      var id = sanitizeLower(line);
      if (!id || seen[id] || out.length >= BATCH_MAX) return;
      seen[id] = true; out.push(id);
    });
    return out;
  }
  function buildUrlWithContent(content) {
    var baseUrlStr = document.getElementById("baseUrl").value.trim();
    if (!baseUrlStr) return { error: "Base URL is required." };
    var candidate = /^https?:\/\//i.test(baseUrlStr) ? baseUrlStr : "https://" + baseUrlStr;
    var url;
    try { url = new URL(candidate); } catch (e) { return { error: "Please enter a valid http(s) URL." }; }
    if (url.protocol !== "http:" && url.protocol !== "https:") return { error: "Only http and https URLs are allowed." };
    var params = new URLSearchParams(url.search);
    var source = sanitizeLower(document.getElementById("utmSource").value);
    var medium = sanitizeLower(document.getElementById("utmMedium").value);
    var campaign = sanitizeLower(document.getElementById("utmCampaign").value);
    var id = sanitizeId(document.getElementById("utmId").value);
    var term = sanitizeLower(document.getElementById("utmTerm").value);
    if (source) params.set("utm_source", source);
    if (medium) params.set("utm_medium", medium);
    if (campaign) params.set("utm_campaign", campaign);
    if (id) params.set("utm_id", id);
    if (term) params.set("utm_term", term);
    if (content) params.set("utm_content", content);
    url.search = params.toString();
    return { url: url.toString(), params: { source: source, medium: medium, campaign: campaign, id: id, term: term, content: content || "" } };
  }
  function buildUTMForPlacement(placementId) { return buildUrlWithContent(sanitizeLower(placementId)); }
  function renderBatchList(items) {
    var list = document.getElementById("batchList"); var panel = document.getElementById("batchResult");
    if (!list || !panel) return;
    list.textContent = "";
    items.forEach(function (item) {
      var li = document.createElement("li"); var a = document.createElement("a");
      a.href = item.url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = item.url;
      li.appendChild(a); list.appendChild(li);
    });
    panel.hidden = items.length === 0;
  }
  function generateBatch() {
    var ids = parsePlacementLines(document.getElementById("placementLines").value);
    if (!ids.length) { setStatus("Add at least one placement ID to generate a batch."); lastBatch.items = []; renderBatchList([]); return []; }
    var first = buildUTMForPlacement(ids[0]);
    if (first.error) { setStatus(first.error); lastBatch.items = []; renderBatchList([]); return []; }
    var items = ids.map(function (pid) { var built = buildUTMForPlacement(pid); return { url: built.url, content: pid, params: built.params }; });
    lastBatch.items = items; renderBatchList(items);
    var result = document.getElementById("result"); if (result) result.hidden = false;
    renderLinkNode(document.getElementById("generatedUrl"), items[0].url);
    setStatus("Generated " + items.length + " placement link" + (items.length === 1 ? "" : "s") + ". Batch links are not saved to history.");
    return items;
  }
  function buildUTM() {
    var built = buildUrlWithContent(sanitizeLower(document.getElementById("utmContent").value));
    if (built.error) { setStatus(built.error); return null; }
    var entry = { url: built.url, time: new Date().toLocaleString(), params: built.params };
    var history = loadHistory(); history.unshift(entry);
    if (history.length > HISTORY_MAX) history = history.slice(0, HISTORY_MAX);
    saveHistory(history); renderHistory(); return built.url;
  }
  document.getElementById("utmForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var link = buildUTM(); if (!link) return;
    document.getElementById("result").hidden = false;
    renderLinkNode(document.getElementById("generatedUrl"), link);
    setStatus("Link generated. History saved in this browser only.");
  });
  document.querySelectorAll(".preset-btn").forEach(function (btn) {
    btn.addEventListener("click", function () { applyPreset(btn.getAttribute("data-preset")); });
  });
  document.getElementById("copyBtn").addEventListener("click", function () {
    var text = document.getElementById("generatedUrl").textContent || ""; if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { setStatus("Copied to clipboard."); }).catch(function () { setStatus("Could not copy — select the link and copy manually."); });
    } else { setStatus("Clipboard API unavailable — select the link and copy manually."); }
  });
  document.getElementById("exportBtn").addEventListener("click", function () {
    var history = loadHistory();
    if (history.length === 0) { setStatus("No history to export yet."); return; }
    var lines = ["Time,URL,Source,Medium,Campaign,Id,Term,Content"];
    history.forEach(function (h) {
      var p = h.params || {};
      lines.push([csvSafe(h.time), csvSafe(h.url), csvSafe(p.source), csvSafe(p.medium), csvSafe(p.campaign), csvSafe(p.id), csvSafe(p.term), csvSafe(p.content)].join(","));
    });
    var blob = new Blob([lines.join("\n") + "\n"], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = url;
    a.download = "utm_campaign_history_" + new Date().toISOString().slice(0, 10) + ".csv"; a.click(); URL.revokeObjectURL(url);
    setStatus("CSV exported. Formula-like cells are neutralized for spreadsheet safety.");
  });
  document.getElementById("clearBtn").addEventListener("click", function () {
    document.getElementById("utmForm").reset(); document.getElementById("result").hidden = true; setStatus("");
  });
  document.getElementById("clearHistoryBtn").addEventListener("click", function () { saveHistory([]); renderHistory(); setStatus("History cleared from this browser."); });
  document.querySelectorAll(".sanitize-lower").forEach(function (input) { input.addEventListener("blur", function () { this.value = sanitizeLower(this.value); }); });
  document.getElementById("utmId").addEventListener("blur", function () { this.value = sanitizeId(this.value); });
  document.getElementById("batchBtn").addEventListener("click", function () { generateBatch(); });
  document.getElementById("copyBatchBtn").addEventListener("click", function () {
    var urls = lastBatch.items.map(function (item) { return item.url; }).join("\n");
    if (!urls) { setStatus("No batch links to copy."); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urls).then(function () { setStatus("Copied " + lastBatch.items.length + " batch links."); }).catch(function () { setStatus("Could not copy. Select the links instead."); });
    } else { setStatus("Clipboard unavailable. Select the links instead."); }
  });
  document.getElementById("exportBatchBtn").addEventListener("click", function () {
    if (!lastBatch.items.length) { setStatus("No batch links to export."); return; }
    var header = "Content,URL,Source,Medium,Campaign,Id,Term";
    var rows = lastBatch.items.map(function (item) {
      var p = item.params || {};
      return [item.content, item.url, p.source, p.medium, p.campaign, p.id, p.term].map(csvSafe).join(",");
    });
    var blob = new Blob([header + "\n" + rows.join("\n") + "\n"], { type: "text/csv;charset=utf-8" });
    var href = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = href; a.download = "utm-batch.csv"; a.click(); URL.revokeObjectURL(href);
    setStatus("Exported " + lastBatch.items.length + " batch links.");
  });
  document.getElementById("baseUrl").value = "https://example.com/creator-landing";
  renderHistory();
})();
