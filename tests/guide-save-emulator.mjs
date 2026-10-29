import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {seed} from '../scripts/seed.mjs';
await seed();
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const org of ['jangyu','kimhae']){
  const page=await browser.newPage();let fail=true,uploads=0;
  page.on('dialog',d=>d.accept());
  await page.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(['9299','9199'].includes(u.port)&&r.method()==='POST'&&(u.searchParams.get('name')||'').startsWith('guides/')){uploads++;if(fail)return route.fulfill({status:fail==='stall'?503:403,contentType:'application/json',body:'{"error":{"code":'+(fail==='stall'?503:403)+',"message":"Synthetic failure"}}'});}if(!['127.0.0.1','localhost','www.gstatic.com','cdn.jsdelivr.net','developers.kakao.com','cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return route.abort();return route.continue();});
  await page.goto('http://127.0.0.1:5500/?org='+org,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof doLogin==='function'&&document.body.innerText.includes('연결 완료'));
  await page.waitForFunction(()=>document.body.innerText.includes('테스트 대회'));
  await page.evaluate(()=>{document.getElementById('adminPw').value='demo-admin-2026';doLogin();openET('demo-cup');});
  await page.waitForTimeout(500);
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=100;c.getContext('2d').fillRect(0,0,300,100);return c.toDataURL().split(',')[1];});
  await page.locator('#etGuideFiles').setInputFiles({name:'synthetic-guide.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.locator('#etGuidePreview img').waitFor();
  await page.evaluate(()=>saveET());
  assert.match(await page.locator('#guideSaveStatus_edit').innerText(),/저장하지 못했습니다/);
  assert.equal(await page.locator('#gLd').isVisible(),false);
  assert.equal(await page.locator('#mET').evaluate(e=>e.classList.contains('open')),true);
  assert.equal(await page.locator('#mET button[onclick*="saveET"]').isDisabled(),false);
  assert.equal(await page.locator('#etGuidePreview img').count(),1);
  if(org==='jangyu'){
   fail='stall';const started=Date.now();await page.evaluate(()=>saveET());
   assert.ok(Date.now()-started<45000);assert.match(await page.locator('#guideSaveStatus_edit').innerText(),/진행되지/);
   assert.equal(await page.locator('#gLd').isVisible(),false);
  }
  fail=false;
  await page.evaluate(()=>saveET());
  assert.match(await page.locator('#guideSaveStatus_edit').innerText(),/저장 완료/);
  assert.equal(await page.locator('#mET').evaluate(e=>e.classList.contains('open')),false);
  await page.evaluate(()=>openET('demo-cup'));
  await page.waitForFunction(()=>document.querySelector('#etGuidePreview img')?.src.startsWith('http'));
  const url=await page.locator('#etGuidePreview img').getAttribute('src');
  const downloaded=await page.request.get(url);
  assert.equal(downloaded.status(),200);assert.deepEqual(await downloaded.body(),Buffer.from(png,'base64'));
  await page.evaluate(()=>{removeGuideFile('edit',0);return saveET();});
  await page.evaluate(()=>openET('demo-cup'));await page.waitForTimeout(500);
  assert.equal(await page.locator('#etGuidePreview img').count(),0);
  assert.ok(uploads>=2);console.log(org+': failure recovery, retry, original bytes, deletion passed');
  await page.close();
 }
}finally{await browser.close();}
