/* Offline inspect only. Never fetches the destination or stores campaign data. */
(function (root) {
  'use strict';

  var BLOCKED = /^(javascript|data|vbscript|file|blob):/i;
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content'];

  function inspectExistingUrl(raw) {
    var warnings = [];
    if (typeof raw !== 'string') {
      return { ok: false, error: 'Paste an absolute http(s) URL.', warnings: warnings };
    }
    var text = raw.trim();
    if (!text) {
      return { ok: false, error: 'Paste an absolute http(s) URL.', warnings: warnings };
    }
    // Interior whitespace only: trim() already removed harmless leading/trailing
    // paste artifacts, so anything left can merge or hide query pairs.
    if (/\s/.test(text)) warnings.push('Whitespace inside the URL can hide or merge query pieces.');
    if (/https?:\/\/https?:\/\//i.test(text)) {
      return { ok: false, error: 'Doubled http(s) scheme. The destination is not a valid URL.', warnings: warnings };
    }
    if (BLOCKED.test(text)) {
      return { ok: false, error: 'Only http and https URLs are allowed.', warnings: warnings };
    }
    if (!/^https?:\/\//i.test(text)) {
      return { ok: false, error: 'Paste an absolute http(s) URL.', warnings: warnings };
    }
    var url;
    try {
      url = new URL(text);
    } catch (_) {
      return { ok: false, error: 'Paste an absolute http(s) URL.', warnings: warnings };
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'Only http and https URLs are allowed.', warnings: warnings };
    }
    if (url.protocol === 'http:') warnings.push('HTTP destination. Prefer HTTPS before the link ships.');
    if (url.username || url.password) {
      warnings.push('Credentials are embedded in the URL. Remove them before the link ships.');
    }
    // url.search begins with the leading '?', so count only later ones;
    // otherwise every URL with any query string would warn.
    if (url.search.slice(1).includes('?')) {
      warnings.push('Extra ? in the query. Later pairs may be ignored by GA4.');
    }
    if (/%26utm_/i.test(url.search) || /%26utm_/i.test(text)) {
      warnings.push('Percent-encoded & before a UTM key. Analytics will not split that pair.');
    }
    if (/[?&#]utm_/i.test(url.hash) || /#.*utm_/i.test(text)) {
      warnings.push('UTM parameters sit in the fragment. GA4 reads the query, not the hash.');
    }

    var params = {};
    UTM_KEYS.forEach(function (key) {
      var value = url.searchParams.get(key);
      params[key] = value == null ? '' : value;
    });

    if (!params.utm_source) warnings.push('Missing utm_source.');
    if (!params.utm_medium) warnings.push('Missing utm_medium.');
    if (!params.utm_campaign) warnings.push('Missing utm_campaign.');
    if (!params.utm_id) warnings.push('Missing utm_id (stable campaign identifier).');
    if (!params.utm_content) warnings.push('Missing utm_content (placement ID).');

    url.searchParams.delete('utm_source');
    url.searchParams.delete('utm_medium');
    url.searchParams.delete('utm_campaign');
    url.searchParams.delete('utm_id');
    url.searchParams.delete('utm_term');
    url.searchParams.delete('utm_content');

    return {
      ok: true,
      error: '',
      warnings: warnings,
      protocol: url.protocol,
      destination: url.toString(),
      params: params
    };
  }

  var api = { inspectExistingUrl: inspectExistingUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NfaInspect = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
