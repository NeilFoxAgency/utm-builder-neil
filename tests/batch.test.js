const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {prepare} = require('../batch-tools.js');
function intake() {
  return {source_system:'supabase',supabase_snapshot_version:'2026-09-06T00:00:00Z',
    brand_id:'brand-demo',campaign_id:'CMP-Demo',approved_domains:['SHOP.EXAMPLE.COM.'],
    placements:[{creator_id:'creator-demo',placement_id:'PLC-Demo-1',destination_url:'https://shop.example.com/p?variant=blue'}]};
}
test('canonical UTM values and exact IDs; no invented discount or live link',()=>{
  const result=prepare(intake()), row=result.placements[0], query=new URL(row.expected_destination).searchParams;
  assert.equal(result.status,'prepared_not_provisioned');
  assert.equal(query.get('utm_medium'),'creator_sponsorship');
  assert.equal(query.get('utm_id'),'CMP-Demo');
  assert.equal(query.get('utm_content'),'PLC-Demo-1');
  assert.equal(row.arguments.discount_code,undefined);
  assert.equal(row.tracking_url,undefined);
});
test('same creator may have multiple placements',()=>{
  const data=intake(); data.placements.push({...data.placements[0],placement_id:'PLC-Demo-2'});
  assert.equal(prepare(data).placements.length,2);
});
test('reject duplicate or case-colliding IDs rather than silently deduplicating',()=>{
  const data=intake(); data.placements.push({...data.placements[0],placement_id:'plc-demo-1'});
  assert.throws(()=>prepare(data),/Duplicate/);
});
test('reject unsafe destinations and query collisions',()=>{
  for(const url of ['http://shop.example.com/p','https://evil.example/p','https://sub.shop.example.com/p',
    'https://user:password@shop.example.com','https://shop.example.com:444/p','https://shop.example.com/p#frag',
    'https://shop.example.com/p?UTM_Source=old','https://shop.example.com/p?fbclid=x',
    'https://shop.example.com/p?email=x','https://shop.example.com/p?x=%0a','https://shop.example.com/p\n',
    'https://shop.example.com/p?x=%E2%80%8B']) {
    const data=intake();data.placements[0].destination_url=url;
    assert.throws(()=>prepare(data),undefined,url);
  }
});
test('require authority and explicit approved hosts',()=>{
  for(const [field,value] of [['source_system','d1'],['supabase_snapshot_version',''],['approved_domains',[]]]) {
    const data=intake(); data[field]=value; assert.throws(()=>prepare(data));
  }
});
test('invalid hostnames and IP literals are not an approval',()=>{
  for(const host of ['*.example.com','127.0.0.1','localhost','https://example.com','0x7f000001']) {
    const data=intake();data.approved_domains=[host];assert.throws(()=>prepare(data));
  }
});
test('preserve approved codes and reject unexpected sensitive fields',()=>{
  const data=intake();data.placements[0].discount_code='DEMO10';
  assert.equal(prepare(data).placements[0].arguments.discount_code,'DEMO10');
  data.customer_email='synthetic@example.com';assert.throws(()=>prepare(data));
});
test('UI clears stale downloads after an edit or failed validation',()=>{
  const elements={};
  for(const id of ['intake','result','status','download','export-intake','copy','prepare']) {
    elements[id]={value:'',textContent:'',disabled:false,events:{},addEventListener(name,fn){this.events[name]=fn;}};
  }
  const context={document:{getElementById:id=>elements[id]},NfaBatch:{prepare},JSON,Error};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../batch-ui.js'),'utf8'),context);
  elements.intake.value=JSON.stringify(intake());elements.prepare.events.click();
  assert.equal(elements.download.disabled,false);
  elements.intake.events.input();assert.equal(elements.download.disabled,true);assert.equal(elements.result.textContent,'');
  elements.intake.value='{}';elements.prepare.events.click();assert.equal(elements.download.disabled,true);
});
test('page and logic have no data transmission, external scripts, or HTML injection',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../batch-ui.js'),'utf8')+fs.readFileSync(path.join(__dirname,'../batch-tools.js'),'utf8');
  assert.doesNotMatch(js,/\b(?:fetch\s*\(|new\s+(?:XMLHttpRequest|WebSocket)\b|localStorage\s*\.|innerHTML\s*=)/);
  const html=fs.readFileSync(path.join(__dirname,'../batch.html'),'utf8');
  assert.match(html,/connect-src 'none'/);assert.doesNotMatch(html,/<script[^>]+src=["']https?:/);
});
