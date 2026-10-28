// Standalone UI check: real rule/form/card functions, synthetic data, no Firebase requests.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const source=readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
const rules=source.slice(source.indexOf('// PHASE148:'),source.indexOf('function rosterPlayerHTML('));
const cards=source.slice(source.indexOf('function buildRegisterRosterCardHtml('),source.indexOf('function upsertIndividualPlayerMetaRecords('));
const rosterButton=source.slice(source.indexOf('function pastRosterReferenceButtonHtml('),source.indexOf('function updatePastRosterReferenceButton('));
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/*',route=>route.abort());
  const names=['가선수','나선수','여선수','시니어','예선탈락선수','오태섭','동일선수'];
  await page.setContent(`<meta charset="utf-8"><select id="regTS"><option value="autumn">추계</option></select><select id="regDS"><option value="은">은배</option></select><div id="roster"></div><div id="aoReg">${names.map((name,i)=>`<div class="pslot" style="display:flex;margin:8px"><input id="p${i+1}" value="${name}"></div>`).join('')}</div>`);
  await page.evaluate(()=>{
    const spring={id:'spring',name:'춘계',date:'2026-03-29',status:'finished'},autumn={id:'autumn',name:'추계',date:'2026-11-08',status:'open'},old={id:'old',name:'2025 춘계',date:'2025-05-01',status:'finished'};
    const rows=[{_id:'g',club:'테사모',division:'금',players:['가선수','나선수','여선수','시니어']},{_id:'s',club:'테사모',division:'은',players:['오태섭','동일선수']},{_id:'b',club:'테사모',division:'금',players:['예선탈락선수'],_pastOutcome:{confirmed:true,result:'예선 참가'}}];
    Object.assign(window,{
      MATCH_ORGANIZATION:{id:'jangyu'},REG_YEAR:2026,G:{tournaments:[old,spring,autumn],teams:{}},HIST_DATA:[],
      G_REGISTRY:{2026:[{name:'여선수',club:'테사모',gender:'F'},{name:'시니어',club:'테사모',age65Certified:true}]},
      normName:n=>String(n||'').replace(/\s/g,''),transferName:n=>String(n||'').trim(),normalizeClub:n=>String(n||'').trim(),transferClub:n=>String(n||'').trim(),baseClub:n=>String(n||'').replace(/[A-Z]$/,''),
      _m26YearFromTournament:t=>Number(t.date.slice(0,4)),getTournamentDateKey:t=>t?.date||'',isIndividualTournament:()=>false,isPastArchiveTournament:t=>t.status==='finished',getPastArchive:id=>id==='spring'?{regs:rows}:null,
      loadRegistry:async()=>[],getMemberRegistry2026:()=>[],collection:(_db,name)=>name,where:(_field,_op,value)=>value,query:(...args)=>args,db:{},getDocs:async q=>({docs:(q[0]==='age65Certifications'?[]:q[1]==='old'?[{_id:'o',club:'테사모',division:'금',players:['오태섭']}]:rows).map(r=>({id:r._id,data:()=>r}))}),
      esc:n=>String(n).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),_k2td:key=>{const i=key.lastIndexOf('_');return {tid:key.slice(0,i),div:key.slice(i+1)};},isSameRegistrationClub:(a,b)=>a===b,
      ge:id=>document.getElementById(id),om:id=>{document.getElementById(id).style.display='block';},getRegClubInputValue:()=>'테사모',REG:true,REG_CLUB:'테사모',CLUB_MEMBER:false,AD:false,FIRST_APPEARANCE_READY:false,tdn:team=>team.club,rosterPlayerHTML:n=>n,isUnifiedTeamRoster:()=>true
    });
  });
  await page.addScriptTag({content:rules+rosterButton+cards});
  await page.evaluate(async names=>{
    await ensureDivisionRuleCache('autumn');
    document.getElementById('roster').innerHTML=buildRegisterRosterCardHtml({tid:'autumn',div:'은',key:'autumn_은',team:{club:'테사모',players:names},idx:0,isIndividual:false});
    refreshDivisionRuleFormBadges('register');
  },names);
  await page.locator('#jangyuDivisionFormWarning_register').waitFor();
  assert.match(await page.locator('#roster summary').innerText(),/하향 인원 초과: 3명/);
  assert.match(await page.locator('#jangyuDivisionFormWarning_register').innerText(),/접수 가능/);
  assert.equal(await page.locator('#p7').locator('..').locator('.division-rule-form-row153').count(),0);
  await page.locator('#p6').locator('..').locator('.division-rule-form-badge148').first().click();
  assert.match(await page.locator('#divisionRuleReasonBody').innerText(),/2025년 금배부 출전 명단 기록에 따른 하향 판정/);
  assert.match(await page.locator('#p5').locator('..').innerText(),/직전 예선탈락 예외/);
  assert.match(await page.locator('#p3').locator('..').innerText(),/여성/);
  assert.match(await page.locator('#p4').locator('..').innerText(),/65\+/);
  assert.equal(await page.evaluate(async names=>(await validateTeamDivisionRules({tid:'autumn',div:'은',club:'테사모',names})).ok,names),true);
  await page.locator('#p2').fill('');
  await page.locator('#p1').fill('');
  await page.evaluate(()=>refreshDivisionRuleFormBadges('register'));
  await page.waitForFunction(()=>document.getElementById('jangyuDivisionFormWarning_register')?.textContent==='');
  console.log('PASS: mobile form and saved card warnings, same-division correction, three exceptions, nonblocking validation and warning removal; no network.');
}finally{await browser.close();}
