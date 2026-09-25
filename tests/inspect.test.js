'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { inspectExistingUrl } = require('../inspect-url.js');

test('extracts classic UTM fields and strips them from the destination', () => {
  const report = inspectExistingUrl(
    'https://shop.example.com/product?ref=bio&utm_source=YouTube&utm_medium=creator&utm_campaign=spring&utm_id=CMP-1&utm_content=plc-1#reviews'
  );
  assert.equal(report.ok, true);
  assert.equal(report.params.utm_source, 'YouTube');
  assert.equal(report.params.utm_id, 'CMP-1');
  assert.ok(report.destination.includes('ref=bio'));
  assert.ok(!report.destination.includes('utm_source='));
  assert.ok(report.destination.includes('#reviews'));
});

test('rejects dangerous and non-absolute schemes', () => {
  for (const raw of [
    'javascript:alert(1)',
    'data:text/html,hi',
    'file:///etc/passwd',
    'blob:https://example.com/1',
    'shop.example.com/product',
    'https://https://shop.example.com/product',
    '',
    '   '
  ]) {
    const report = inspectExistingUrl(raw);
    assert.equal(report.ok, false, raw);
  }
});

test('warns on HTTP, fragment UTMs, encoded separators, and missing fields', () => {
  const http = inspectExistingUrl('http://shop.example.com/p?utm_source=youtube');
  assert.equal(http.ok, true);
  assert.ok(http.warnings.some((w) => /HTTP/i.test(w)));
  assert.ok(http.warnings.some((w) => /utm_medium/i.test(w)));

  const fragment = inspectExistingUrl('https://shop.example.com/p#utm_source=youtube');
  assert.equal(fragment.ok, true);
  assert.ok(fragment.warnings.some((w) => /fragment/i.test(w)));

  const encoded = inspectExistingUrl(
    'https://shop.example.com/p?utm_source=youtube%26utm_medium=creator&utm_campaign=spring'
  );
  assert.equal(encoded.ok, true);
  assert.ok(encoded.warnings.some((w) => /Percent-encoded/i.test(w)));
});

test('UI uses textContent and inspect-url.js; no network or injection', () => {
  const elements = {};
  for (const id of ['shipped', 'result', 'status', 'inspect']) {
    elements[id] = {
      value: '',
      textContent: '',
      children: [],
      events: {},
      addEventListener(name, fn) { this.events[name] = fn; },
      appendChild(child) { this.children.push(child); this.textContent += child.textContent || ''; return child; }
    };
  }
  const created = [];
  const context = {
    window: { NfaInspect: { inspectExistingUrl } },
    document: {
      getElementById: (id) => elements[id],
      createElement(tag) {
        const node = { tagName: tag, textContent: '', childNodes: [], appendChild(c) { this.childNodes.push(c); this.textContent += c.textContent || ''; return c; } };
        created.push(node);
        return node;
      },
      createTextNode(text) { return { textContent: String(text) }; }
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../inspect-ui.js'), 'utf8'), context);
  elements.shipped.value = 'https://shop.example.com/p?utm_source=youtube&utm_medium=creator&utm_campaign=spring';
  elements.inspect.events.click();
  assert.match(elements.status.textContent, /warning/i);
  assert.match(elements.result.textContent, /utm_source/);
  elements.shipped.events.input();
  assert.equal(elements.result.textContent, '');

  const js = fs.readFileSync(path.join(__dirname, '../inspect-ui.js'), 'utf8') +
    fs.readFileSync(path.join(__dirname, '../inspect-url.js'), 'utf8');
  assert.doesNotMatch(js, /\b(?:fetch\s*\(|new\s+(?:XMLHttpRequest|WebSocket)\b|localStorage\s*\.|innerHTML\s*=)/);
  const html = fs.readFileSync(path.join(__dirname, '../inspect.html'), 'utf8');
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:/);
});

test('clean, fully tagged URLs produce no warnings', () => {
  const report = inspectExistingUrl(
    'https://shop.example.com/product?utm_source=youtube&utm_medium=creator_sponsorship&utm_campaign=spring_launch&utm_id=CMP-1&utm_content=plc-greta-video-01'
  );
  assert.equal(report.ok, true);
  assert.deepEqual(report.warnings, []);
});

test('extra-? warning fires on a real second delimiter, not on every query', () => {
  const glued = inspectExistingUrl('https://shop.example.com/p?a=1?utm_source=youtube');
  assert.ok(glued.warnings.some((w) => /Extra \?/i.test(w)));
  const normal = inspectExistingUrl('https://shop.example.com/p?utm_source=youtube&utm_medium=creator&utm_campaign=spring&utm_id=C1&utm_content=p1');
  assert.ok(!normal.warnings.some((w) => /Extra \?/i.test(w)));
});

test('trailing paste whitespace is ignored; interior whitespace still warns', () => {
  const trailing = inspectExistingUrl('https://shop.example.com/p?utm_source=youtube&utm_medium=creator&utm_campaign=spring&utm_id=C1&utm_content=p1\n');
  assert.ok(!trailing.warnings.some((w) => /hitespace/i.test(w)));
  const interior = inspectExistingUrl('https://shop.example.com/p?utm_source=youtube utm_medium=creator');
  assert.ok(interior.warnings.some((w) => /hitespace/i.test(w)));
});

test('warns when credentials are embedded in the URL', () => {
  const report = inspectExistingUrl('https://user:secret@shop.example.com/p?utm_source=youtube&utm_medium=creator&utm_campaign=spring&utm_id=C1&utm_content=p1');
  assert.equal(report.ok, true);
  assert.ok(report.warnings.some((w) => /redentials/i.test(w)));
});
