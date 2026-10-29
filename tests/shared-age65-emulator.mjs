import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {seed} from '../scripts/seed.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
function value(x){if(Array.isArray(x))return {arrayValue:{values:x.map(value)}};if(typeof x==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(x).map(([k,v])=>[k,value(v)]))}};if(typeof x==='boolean')return {booleanValue:x};if(typeof x==='number')return {integerValue:String(x)};return {stringValue:x};}
const source='http://127.0.0.1:8080/v1/projects/demo-kimhae-dev/databases/(default)/documents';
const target='http://127.0.0.1:8081/v1/projects/demo-jangyu-dev/databases/(default)/documents';
const put=async(base,path,data)=>assert.ok((await fetch(base+'/'+path,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:value(data).mapValue.fields})})).ok);
await seed();await mkdir('test-results/shared-age65',{recursive:true});
const club='가상테스트클럽',tid='shared-age65-current',names=['가상연동65','가상부클럽65','가상기록65','가상다른클럽65','가상동명65','가상취소65','가상장유65'];
const members=[
 {name:names[0],club,age65Certified:true,playerId:'shared-p1'},
 {name:names[1],club:'가상상대클럽',subClub:club,age65Certified:true,playerId:'shared-p2'},
 {name:names[2],club,age65Certified:false,playerId:'shared-p3'},
 {name:names[3],club:'다른가상클럽',age65Certified:true,playerId:'shared-p4'},
 {name:names[4],club,age65Certified:true,playerId:'shared-p5a'},
 {name:names[4],club,age65Certified:false,playerId:'shared-p5b'},
 {name:names[5],club,age65Certified:false,playerId:'shared-p6'}
];
await put(source,'memberRegistries/2026',{members});
await put(source,'age65Certifications/shared-legacy',{name:names[2],clubAtApproval:club,certified:true});
await put(target,'age65Certifications/shared-local',{name:names[6],clubAtApproval:club,certified:true});
await put(target,'tournaments/'+tid,{name:'가상 65세 연동 검증',date:'2026-12-01',createdAt:'2026-10-29T00:00:00Z',status:'open',type:'team',divisions:['동'],divSettings:{동:{doublesCount:3}}});
await put(target,'tournaments/shared-age65-past',{name:'2025 가상 시장기',date:'2025-12-01',createdAt:'2025-01-01T00:00:00Z',status:'finished',type:'team',divisions:['금'],divSettings:{금:{doublesCount:3}}});
await put(target,'registrations/shared-age65-baseline',{tournamentId:'shared-age65-past',division:'금',club,players:names,doublesCount:3,mainPlayerCount:6});
const prior=await (await fetch(target+'/registrations')).json();
for(const doc of prior.documents||[])if(doc.fields?.tournamentId?.stringValue===tid)assert.ok((await fetch('http://127.0.0.1:8081/v1/'+doc.name,{method:'DELETE'})).ok);
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[],sourceWrites=[],production=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(/firestore\.googleapis|firebasestorage\.googleapis|identitytoolkit\.googleapis/.test(url.hostname)){production.push(url.origin);return route.abort();}
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 page.on('request',request=>{const u=new URL(request.url());if(u.port==='8080'&&/\/Write\/|:commit|:batchWrite/i.test(u.pathname))sourceWrites.push(u.pathname);});
 await page.goto('http://127.0.0.1:5500/?org=jangyu',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof doRegLogin==='function'&&document.body.innerText.includes('연결 완료'));
 await page.evaluate(()=>{toggleReg();setClubLoginRole('director');document.getElementById('regClubLogin').value='가상테스트클럽';document.getElementById('regPwInput').value='demo-club-2026';doRegLogin();showPage('register');});
 await page.waitForFunction(()=>getCurrentClubRoleInfo().role==='director');
 await page.evaluate(tid=>{document.getElementById('regTS').value=tid;onRegTC();document.getElementById('regDS').value='동';renderRL();},tid);
 await page.waitForTimeout(1200);await page.evaluate(()=>cm('mDirectorManual'));
 const row=page.locator('#p1').locator('..').locator('.division-rule-form-row153');
 const cases=[];
 for(const [index,shared,local] of [[0,true,true],[1,true,true],[2,true,true],[3,false,false],[4,false,false],[5,false,false],[6,false,true]]){
  await page.locator('#p1').fill(names[index]);await page.waitForTimeout(700);
  const text=await row.allTextContents();
  assert.equal(text.some(t=>t.includes('협회 연동')),shared,names[index]+' shared flag');
  assert.equal(text.some(t=>t.includes('65+ 인증완료')),local,names[index]+' approved flag');
  if(local)assert.ok(text.some(t=>t.includes('하향 예외')),names[index]+' downgrade exemption');
  const warning=await page.locator('#jangyuDivisionFormWarning_register').innerText();
  if(local)assert.equal(warning,'');else assert.ok(warning.includes(names[index]));
  cases.push({index,shared,approved:local});
 }
 await page.locator('#p1').fill(names[0]);await page.waitForTimeout(500);
 await page.evaluate(()=>registerTeam());await page.locator('#registrationReceipt[open]').waitFor();await page.keyboard.press('Escape');
 assert.ok((await page.locator('[data-shared-age65-badge][data-name="가상연동65"]').first().textContent()).includes('협회 연동'));
 const readSaved=async()=>((await (await fetch(target+'/registrations')).json()).documents||[]).filter(d=>d.fields?.tournamentId?.stringValue===tid);
 assert.equal((await readSaved()).length,1);
 await page.locator('#p1').fill(names[3]);await page.waitForTimeout(400);await page.evaluate(()=>registerTeam());
 await page.locator('#registrationReceipt[open]').waitFor();await page.keyboard.press('Escape');assert.equal((await readSaved()).length,2);
 assert.ok(!(await page.locator('[data-shared-age65-badge][data-name="가상다른클럽65"]').first().textContent()).includes('65+ 인증완료'));
 await page.locator('#p1').fill(names[1]);await page.waitForTimeout(500);assert.ok((await row.innerText()).includes('협회 연동'));
 members[1].age65Certified=false;await put(source,'memberRegistries/2026',{members});
 await page.evaluate(()=>registerTeam());await page.locator('#registrationReceipt[open]').waitFor();await page.keyboard.press('Escape');assert.equal((await readSaved()).length,3);
 assert.ok(!(await page.locator('[data-shared-age65-badge][data-name="가상부클럽65"]').first().textContent()).includes('65+ 인증완료'));
 await page.locator('#p1').fill(names[1]);await page.waitForTimeout(500);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.waitForFunction(()=>!document.querySelector('#p1')?.closest('.pslot')?.querySelector('.division-rule-form-row153')?.textContent.includes('협회 연동'),{},{timeout:15000});
 assert.ok(!(await row.innerText()).includes('협회 연동'));
 await page.locator('#p1').fill(names[2]);await page.waitForTimeout(500);assert.ok((await row.innerText()).includes('협회 연동'));
 await context.setOffline(true);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.locator('.shared-age65-read-notice').waitFor({timeout:20000});
 assert.ok(!(await row.innerText()).includes('협회 연동'));
 await context.setOffline(false);await page.evaluate(()=>{showPage('register');goPageSheet('register',true);});await page.waitForTimeout(500);
 await page.getByRole('button',{name:'인증 다시 확인'}).evaluate(button=>button.scrollIntoView({block:'center',inline:'nearest'}));
 await page.getByRole('button',{name:'인증 다시 확인'}).click();
 await page.waitForTimeout(1000);assert.ok((await row.innerText()).includes('협회 연동'));
 await page.evaluate(({name,club,tid})=>openAge65CertificationRequest(name,club,tid,'동'),{name:names[2],club,tid});
 assert.equal(await page.locator('#mAge65CertRequest.open').count(),0);
 await page.evaluate(()=>showPage('register'));await page.waitForTimeout(700);
 await page.locator('#p1').evaluate(input=>input.scrollIntoView({block:'center',inline:'nearest'}));
 await page.evaluate(()=>{goPageSheet('register',true);document.querySelectorAll('.main-content,#pageViewport,#pageSlider').forEach(e=>e.scrollLeft=0);});await page.waitForTimeout(200);
 await page.screenshot({path:'test-results/shared-age65/jangyu-390.png'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewportSize({width:1440,height:960});await page.evaluate(()=>showPage('register'));await page.waitForTimeout(700);
 await page.locator('#p1').evaluate(input=>input.scrollIntoView({block:'center',inline:'nearest'}));
 await page.evaluate(()=>{goPageSheet('register',true);document.querySelectorAll('.main-content,#pageViewport,#pageSlider').forEach(e=>e.scrollLeft=0);});await page.waitForTimeout(200);
 await page.screenshot({path:'test-results/shared-age65/jangyu-1440.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(sourceWrites,[]);assert.deepEqual(production,[]);
 const certs=await (await fetch(target+'/age65Certifications')).json();
 assert.ok(!(certs.documents||[]).some(d=>names.slice(0,6).includes(d.fields?.name?.stringValue)));
 const result={cases,approvedTwoLevelDowngradeSaved:true,wrongClubNotAutoApproved:true,warningOnlyRegistrationPreserved:true,revocationCheckedBeforeSave:true,offlineDoesNotGrant:true,retryRestores:true,noRedundantCertificationRequest:true,sourceWrites,production,errors};
 await writeFile('test-results/shared-age65/report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 await context.close();
}finally{await browser.close();}
