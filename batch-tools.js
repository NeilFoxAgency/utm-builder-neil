/* Offline preparation only. Never provisions a link or sends campaign data. */
(function (root) {
  'use strict';
  const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;
  const hidden = value => /[\s\p{Cc}\p{Cf}]/u.test(value);
  function object(value, keys, name) {
    if (!value || Array.isArray(value) || typeof value !== 'object' ||
        Object.keys(value).some(key => !keys.includes(key))) throw new Error('Invalid ' + name + ' fields.');
    return value;
  }
  function id(value, name) {
    if (typeof value !== 'string' || !ID.test(value)) throw new Error('Invalid stable ' + name + '. IDs are never silently changed.');
    return value;
  }
  function host(value) {
    if (typeof value !== 'string' || hidden(value)) throw new Error('Invalid approved domain.');
    const result = value.toLowerCase().replace(/\.$/, '');
    if (result.length > 253 || !result.includes('.') ||
        !result.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
        /^(?:\d+\.){3}\d+$/.test(result) || /\.(?:localhost|local|internal|test|invalid)$/.test(result)) {
      throw new Error('Use exact DNS hostnames, not IP addresses, URLs or wildcards.');
    }
    return result;
  }
  function destination(value, domains) {
    if (typeof value !== 'string' || value.length > 2000 || hidden(value) || value.includes('\\')) {
      throw new Error('Invalid destination URL.');
    }
    let url;
    try {
      if (hidden(decodeURIComponent(value))) throw new Error();
      url = new URL(value);
    } catch (_) { throw new Error('Invalid URL or hidden characters.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.port ||
        !domains.includes(host(url.hostname))) throw new Error('Use HTTPS on an explicitly approved host, without credentials or fragment.');
    for (const key of url.searchParams.keys()) {
      if (/^utm_/i.test(key) || /^(?:gclid|dclid|fbclid|msclkid|ttclid|gbraid|wbraid|email|phone|password|token|access_token|api_key)$/i.test(key)) {
        throw new Error('Remove existing UTMs, paid click IDs, or private query fields.');
      }
    }
    return url;
  }
  function prepare(raw) {
    const data = object(raw, ['source_system','supabase_snapshot_version','brand_id','campaign_id','approved_domains','placements'], 'intake');
    if (data.source_system !== 'supabase') throw new Error('Use existing Supabase campaign and placement records.');
    const version = data.supabase_snapshot_version;
    if (typeof version !== 'string' || !version.length || version.length > 100 || hidden(version)) throw new Error('A current snapshot version is required.');
    const brand = id(data.brand_id, 'brand_id'), campaign = id(data.campaign_id, 'campaign_id');
    if (!Array.isArray(data.approved_domains) || !data.approved_domains.length) throw new Error('Explicit approved domains are required.');
    const domains = [...new Set(data.approved_domains.map(host))].sort();
    if (!Array.isArray(data.placements) || !data.placements.length || data.placements.length > 40) throw new Error('Provide 1-40 placements. This is not scope approval.');
    const seen = new Set();
    const placements = data.placements.map(input => {
      const row = object(input, ['creator_id','placement_id','destination_url','discount_code','slug'], 'placement');
      const creator = id(row.creator_id, 'creator_id'), placement = id(row.placement_id, 'placement_id');
      if (seen.has(placement.toLowerCase())) throw new Error('Duplicate or case-colliding placement ID.');
      seen.add(placement.toLowerCase());
      const url = destination(row.destination_url, domains);
      const params = {utm_source:'youtube',utm_medium:'creator_sponsorship',utm_campaign:campaign,utm_id:campaign,utm_content:placement};
      Object.entries(params).forEach(([key,value]) => url.searchParams.set(key,value));
      const args = {brand_id:brand,campaign_id:campaign,creator_id:creator,placement_id:placement,
        platform:'youtube',destination_url:row.destination_url,source_system:'supabase',
        supabase_snapshot_version:version,utm_source:'youtube',utm_medium:'creator_sponsorship',utm_campaign:campaign};
      for (const [key, pattern] of [['discount_code',/^[A-Za-z0-9_-]{1,64}$/],['slug',/^[a-z0-9][a-z0-9-]{1,63}$/]]) {
        if (Object.prototype.hasOwnProperty.call(row,key)) {
          if (typeof row[key] !== 'string' || !pattern.test(row[key])) throw new Error('Invalid approved ' + key + '.');
          args[key] = row[key];
        }
      }
      return {tool:'create_campaign_link',arguments:args,expected_destination:url.toString()};
    });
    return {schema_version:1,status:'prepared_not_provisioned',kind:'browser_draft',
      brand_id:brand,campaign_id:campaign,source_system:'supabase',supabase_snapshot_version:version,
      approved_domains:domains,placements,
      warning:'Draft only. Re-fetch authoritative records and approvals before execution. No links have been created. Use creator-link-kit.agency for fingerprinted specifications.'};
  }
  const api = {prepare};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NfaBatch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
