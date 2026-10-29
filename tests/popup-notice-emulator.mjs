import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {seed} from '../scripts/seed.mjs';
await seed();const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const org of ['kimhae','jangyu']){
  const page=await browser.newPage({viewport:{width:390,height:844}});let denied=true,uploads=0;
  page.on('dialog',d=>d.accept());
  await page.route('**/*',route=>{
   const request=route.request(),u=new URL(request.url());
   if(['9199','9299'].includes(u.port)&&request.method()==='POST'&&(u.searchParams.get('name')||'').startsWith('notices/popup/')){uploads++;if(denied)return route.fulfill({status:403,contentType:'application/json',body:'{"error":{"code":403,"message":"Synthetic denied"}}'});}
   if(!['localhost','127.0.0.1','www.gstatic.com','cdn.jsdelivr.net','cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com','developers.kakao.com'].includes(u.hostname))return route.abort();return route.continue();
  });
  await page.goto('http://127.0.0.1:5500/?org='+org,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof doLogin==='function'&&document.body.innerText.includes('연결 완료'));
  await page.evaluate(()=>{document.getElementById('adminPw').value='demo-admin-2026';doLogin();openPopupNoticeManager();});
  for(const width of [360,390,1440]){
   await page.setViewportSize({width,height:844});
   assert.ok(await page.locator('#popupNoticeManagerOverlay>div').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'popup form overflow at '+width);
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#popupNoticeTitle').fill('가상 공지 '+org);await page.locator('#popupNoticeText').fill('테스트 내용 저장 검증');await page.locator('#popupNoticeEnabled').check();
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=100;c.height=70;c.getContext('2d').fillRect(0,0,100,70);return c.toDataURL().split(',')[1];});
  await page.locator('#popupNoticeImageFile').setInputFiles({name:'synthetic-popup.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.evaluate(()=>savePopupNotice());
  assert.match(await page.locator('#popupNoticeSaveStatus').innerText(),/저장하지 못했습니다/);
  assert.equal(await page.locator('#popupNoticeTitle').inputValue(),'가상 공지 '+org);
  assert.equal(await page.locator('button[onclick="savePopupNotice()"]').isDisabled(),false);
  denied=false;await page.evaluate(()=>savePopupNotice());
  assert.equal(await page.locator('#popupNoticeManagerOverlay').isVisible(),false);
  await page.locator('#popupNoticeViewOverlay').waitFor({state:'visible'});
  assert.match(await page.locator('#popupNoticeViewOverlay').innerText(),/테스트 내용 저장 검증/);
  const docURL='http://127.0.0.1:'+(org==='kimhae'?8080:8081)+'/v1/projects/demo-'+org+'-dev/databases/(default)/documents/meta/config';
  const data=await (await fetch(docURL)).json(),notice=data.fields.popupNotice.mapValue.fields;
  assert.equal(notice.title.stringValue,'가상 공지 '+org);assert.equal(notice.enabled.booleanValue,true);assert.equal(data.fields.pw.stringValue,'demo-admin-2026');
  assert.deepEqual(Buffer.from(await (await fetch(notice.imageUrl.stringValue)).arrayBuffer()),Buffer.from(png,'base64'));
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof openPopupNoticeManager==='function'&&document.body.innerText.includes('연결 완료'));
  await page.waitForFunction(()=>document.getElementById('popupNoticeViewOverlay')?.style.display==='flex');
  assert.match(await page.locator('#popupNoticeViewOverlay').innerText(),/테스트 내용 저장 검증/);
  await page.locator('button[onclick="hidePopupNoticeToday()"]').click();
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof openPopupNoticeManager==='function'&&document.body.innerText.includes('연결 완료'));
  await page.waitForTimeout(800);assert.equal(await page.locator('#popupNoticeViewOverlay').isVisible(),false);
  await page.evaluate(()=>{closePopupNoticeView();document.getElementById('adminPw').value='demo-admin-2026';doLogin();openPopupNoticeManager();});
  assert.equal(await page.locator('#popupNoticeTitle').inputValue(),'가상 공지 '+org);
  await page.evaluate(()=>disablePopupNotice());
  const stopped=await (await fetch(docURL)).json();assert.equal(stopped.fields.popupNotice.mapValue.fields.enabled.booleanValue,false);
  await page.evaluate(()=>{removePopupNoticeImage();return savePopupNotice();});
  const removed=await (await fetch(docURL)).json();assert.equal(removed.fields.popupNotice.mapValue.fields.imageUrl.stringValue,'');
  assert.ok(uploads>=2);console.log(org+': 360/390/1440 layout, upload failure recovery, original image bytes, persisted notice reload/publication, stop and remove image passed');
  await page.close();
 }
}finally{await browser.close();}
