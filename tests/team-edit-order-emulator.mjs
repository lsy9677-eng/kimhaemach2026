import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {seed,targets} from '../scripts/seed.mjs';
await seed();
const tid='stable-team-test',club='가상테스트클럽',key=tid+'_금';
const names=['가상첫선수','가상둘선수','가상추가선수'];
function value(x){if(Array.isArray(x))return {arrayValue:{values:x.map(value)}};if(x&&typeof x==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(x).map(([k,v])=>[k,value(v)]))}};if(typeof x==='boolean')return {booleanValue:x};if(typeof x==='number')return {integerValue:String(x)};return {stringValue:String(x)};}
for(const target of targets){
 const base=`http://127.0.0.1:${target.port}/v1/projects/${target.project}/databases/(default)/documents`;
 const docs={['tournaments/'+tid]:{name:'가상 팀순서 테스트',date:'2026-12-01',status:'open',createdAt:'2026-10-31',type:'team',divisions:['금','은'],divSettings:{금:{doublesCount:3},은:{doublesCount:3}}},['registrations/stable-a']:{tournamentId:tid,division:'금',club,players:[names[0]],registeredAt:'2026-10-30T01:00:00Z'},['registrations/stable-b']:{tournamentId:tid,division:'금',club,players:[names[1]],registeredAt:'2026-10-30T02:00:00Z'},['memberRegistries/2026']:{members:names.map(name=>({name,club}))}};
 for(const [path,data] of Object.entries(docs)){const r=await fetch(base+'/'+path,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(value(data).mapValue)});assert.ok(r.ok,await r.text());}
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const target of targets){
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('**/*',route=>{const host=new URL(route.request().url()).hostname;return ['127.0.0.1','localhost','www.gstatic.com','cdn.jsdelivr.net','cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com','developers.kakao.com'].includes(host)?route.continue():route.abort();});
  await page.goto('http://127.0.0.1:5500/?org='+target.org,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof doLogin==='function'&&document.body.innerText.includes('연결 완료'));
  await page.evaluate(()=>{document.getElementById('adminPw').value='demo-admin-2026';doLogin();showPage('register');});
  const select=async()=>{await page.waitForFunction(id=>[...document.querySelector('#regTS').options].some(o=>o.value===id),tid);await page.evaluate(id=>{document.getElementById('regTS').value=id;onRegTC();document.getElementById('regDS').value='금';renderRL();},tid);};await select();
  assert.equal(await page.locator('[data-past-roster-link]').count(),1);
  await page.locator('[data-reg-division="금"] .register-team-identity').first().waitFor();
  const state=()=>page.evaluate(key=>{const names=[...document.querySelectorAll('[data-reg-division="금"] .register-team-identity')].map(el=>el.innerText.split('\n')[1]);return (G.teams[key]||[]).map((t,i)=>({id:t._id,name:names[i],players:t.players}));},key);
  const initial=await state();assert.deepEqual(initial.map(t=>t.id),['stable-a','stable-b']);assert.match(initial[0].name,/-A/);assert.match(initial[1].name,/-B/);
  await page.evaluate(key=>openETeam(key,0),key);await page.locator('#unifiedTeamLabel').waitFor();
  await page.locator('#p2').fill(names[2]);await page.evaluate(()=>registerTeam());
  await page.locator('#registrationReceipt[open]').waitFor();await page.keyboard.press('Escape');
  assert.deepEqual((await state()).map(t=>[t.id,t.name]),initial.map(t=>[t.id,t.name]));
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof doLogin==='function'&&document.body.innerText.includes('연결 완료'));await page.evaluate(()=>{document.getElementById('adminPw').value='demo-admin-2026';doLogin();showPage('register');});await select();
  assert.deepEqual((await state()).map(t=>[t.id,t.name]),initial.map(t=>[t.id,t.name]));
  await page.evaluate(()=>{if(document.body.classList.contains('admin-mode'))toggleAdmin();toggleReg();setClubLoginRole('director');document.getElementById('regClubLogin').value='가상테스트클럽';document.getElementById('regPwInput').value='demo-club-2026';doRegLogin();cm('mDirectorManual');});
  await page.waitForFunction(()=>getCurrentClubRoleInfo().role==='director');await select();
  await page.evaluate(key=>openETeam(key,0),key);await page.locator('#unifiedTeamLabel').waitFor();await page.locator('#unifiedTeamLabel').fill('B');await page.evaluate(()=>registerTeam());
  await page.locator('#registrationReceipt[open]').waitFor();await page.keyboard.press('Escape');
  const swapped=await state();assert.deepEqual(swapped.map(t=>t.id),['stable-a','stable-b']);assert.match(swapped[0].name,/-B/);assert.match(swapped[1].name,/-A/);assert.deepEqual(swapped[0].players,[names[0],names[2]]);assert.deepEqual(swapped[1].players,[names[1]]);
  const base=`http://127.0.0.1:${target.port}/v1/projects/${target.project}/databases/(default)/documents/registrations/`;
  for(const [id,label,at] of [['stable-a','B','01'],['stable-b','A','02']]){const d=await (await fetch(base+id)).json();assert.equal(d.fields.teamLabel.stringValue,label);assert.equal(d.fields.registeredAt.stringValue,'2026-10-30T'+at+':00:00Z');}
  assert.equal(await page.locator('[data-past-roster-link]').count(),1);assert.deepEqual(errors,[]);console.log(target.org+': single past-roster button; admin roster edit retains order across reload; director swaps A/B labels only; timestamps and players preserved');await page.close();
 }
}finally{await browser.close();}
