import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
const ruleSource=source.slice(source.indexOf('// PHASE148:'),source.indexOf('function rosterPlayerHTML('));
const spring={id:'spring',name:'2026 춘계 장유연합회장배',date:'2026-03-29',status:'finished'};
const autumn={id:'autumn',name:'2026 추계 장유연합회장배',date:'2026-11-08',status:'open'};
const old={id:'old',name:'2025 춘계 장유연합회장배',date:'2025-05-01',status:'finished'};
const reg=(id,club,division,players,extra={})=>({_id:id,club,division,players,...extra});
function setup({org='jangyu',rows=[],registry=[],archives={}}={}){
  const c={MATCH_ORGANIZATION:{id:org},REG_YEAR:2026,G:{tournaments:[old,spring,autumn],teams:{}},HIST_DATA:[],G_REGISTRY:{2026:registry},
    normName:n=>String(n||'').replace(/\s/g,''),transferName:n=>String(n||'').trim(),
    normalizeClub:n=>String(n||'').trim(),transferClub:n=>String(n||'').trim(),baseClub:n=>String(n||'').replace(/[A-Z]$/,''),
    _m26YearFromTournament:t=>Number(t.date.slice(0,4)),getTournamentDateKey:t=>t?.date||'',
    isIndividualTournament:()=>false,isPastArchiveTournament:t=>t.status==='finished',getPastArchive:id=>archives[id]||null,
    loadRegistry:async()=>registry,getMemberRegistry2026:()=>registry,console,
    collection:(_db,name)=>name,where:(_field,_op,value)=>value,query:(...args)=>args,db:{},
    getDocs:async q=>({docs:q[0]==='age65Certifications'?[]:rows.filter(r=>r.tournamentId===q[1]).map(r=>({id:r._id,data:()=>r}))}),
    esc:n=>String(n).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
    _k2td:key=>{const i=key.lastIndexOf('_');return {tid:key.slice(0,i),div:key.slice(i+1)};},
    isSameRegistrationClub:(a,b)=>a===b};
  vm.createContext(c);vm.runInContext(ruleSource,c);return c;
}
async function classify(c,name,div='은배부',club='테사모'){
  await c.ensureDivisionRuleCache('autumn');return c._divisionRuleClassifySync('autumn',div,name,club);
}
test('오태섭: 2026 은 기록이 있어도 2025 금 기록에 따라 하향이며 클릭 근거에 연도와 대회를 표시한다',async()=>{
  const c=setup({rows:[{...reg('o','테사모','금',['오태섭']),tournamentId:'old'},{...reg('s','테사모','은',['오태섭']),tournamentId:'spring'}]});
  const result=await classify(c,'오태섭');assert.equal(result.known,true);assert.equal(result.isDowngrade,true);assert.equal(result.profile.baselineLevel,3);
  assert.match(c.divisionRuleBadgeHtml('autumn','은배부','오태섭','테사모'),/openDivisionRuleReason/);
  const reason=c._divisionRuleReasonLines('autumn','은','오태섭','테사모').html;
  assert.match(reason,/2025년 금배부 출전 명단 기록에 따른 하향 판정/);
  assert.match(reason,/2025 춘계 장유연합회장배/);
  assert.match(reason,/2025-05-01/);
});
test('일반 하향 1명은 허용, 2명 이상은 접수를 막지 않고 경고한다',async()=>{
  const c=setup({rows:[{...reg('s','테사모','금',['가선수','나선수']),tournamentId:'spring'}]});
  const one=await c.validateTeamDivisionRules({tid:'autumn',div:'은',club:'테사모',names:['가선수']});
  assert.equal(one.ok,true);assert.equal(one.warnings.length,0);
  const two=await c.validateTeamDivisionRules({tid:'autumn',div:'은',club:'테사모',names:['가선수','나선수']});
  assert.equal(two.ok,true);assert.equal(two.ordinaryCount,2);assert.match(two.warnings[0],/하향 인원 초과/);
  assert.match(c.jangyuDivisionWarningsHtml(two.warnings),/접수 가능/);
  assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div:'은',club:'테사모',names:['가선수','가선수']})).ordinaryCount,1);
});
test('여성·65+ 인증은 2단계 하향에도 예외이며 일반 하향 정원에 포함하지 않는다',async()=>{
  const c=setup({rows:[{...reg('s','테사모','금',['여선수','시니어','일반']),tournamentId:'spring'}],registry:[{name:'여선수',club:'테사모',gender:'F'},{name:'시니어',club:'테사모',age65Certified:true}]});
  const result=await c.validateTeamDivisionRules({tid:'autumn',div:'동',club:'테사모',names:['여선수','시니어','일반']});
  assert.equal(result.ok,true);assert.equal(result.exceptionCount,2);assert.equal(result.warnings.length,1);assert.match(result.warnings[0],/일반/);
  assert.equal((await classify(c,'일반','동')).exceptionApproved,false);
});
test('예선탈락 예외는 확정된 직전 금배 팀 명단에만 적용하고 같은 클럽 본선팀에는 적용하지 않는다',async()=>{
  const eliminated=reg('b','하모니','금',['B선수'],{_pastOutcome:{confirmed:true,result:'예선 참가'}});
  const main=reg('a','하모니','금',['A선수'],{_pastOutcome:{confirmed:true,result:'준우승'}});
  const pending=reg('p','하모니','금',['미확정'],{_pastOutcome:{confirmed:false,result:'예선 참가'}});
  const c=setup({rows:[eliminated,main,pending].map(r=>({...r,_pastOutcome:undefined,tournamentId:'spring'})),archives:{spring:{regs:[eliminated,main,pending]}}});
  assert.equal((await classify(c,'B선수','은','하모니')).prelimException,true);
  assert.equal((await classify(c,'A선수','은','하모니')).prelimException,false);
  assert.equal((await classify(c,'미확정','은','하모니')).prelimException,false);
  assert.equal((await classify(c,'B선수','동','하모니')).prelimException,false);
  const result=await c.validateTeamDivisionRules({tid:'autumn',div:'은',club:'하모니',names:['B선수','A선수']});
  assert.equal(result.ordinaryCount,1);assert.equal(result.warnings.length,0);
  assert.match(c.divisionRuleBadgeHtml('autumn','은','B선수','하모니'),/직전 예선탈락 예외/);
});
test('동명이인의 다른 클럽 기록을 합치지 않는다',async()=>{
  const c=setup({rows:[{...reg('s','타클럽','금',['동명이인']),tournamentId:'spring'}],registry:[{name:'동명이인',club:'테사모'},{name:'동명이인',club:'타클럽'}]});
  assert.equal((await classify(c,'동명이인')).known,false);
});
test('현재 접수 및 아직 끝나지 않은 대회는 직전 대회 기준에 포함하지 않는다',()=>{
  const c=setup();c.G.tournaments.push({id:'pending',date:'2026-10-01',status:'open'},{id:'pendingOld',date:'2025-12-01',status:'open'});
  c.G.tournaments.push({id:'older',date:'2024-12-01',status:'finished'});
  assert.deepEqual(Array.from(c._rulePrevTournaments(autumn),t=>t.id),['spring','old']);
});

test('상위 부서 이력이 없는 은→은 선수는 하향으로 표시하지 않는다',async()=>{
  const c=setup({rows:[{...reg('o','테사모','은',['동일선수']),tournamentId:'old'},{...reg('s','테사모','은',['동일선수']),tournamentId:'spring'}]});
  assert.equal((await classify(c,'동일선수')).isDowngrade,false);
  assert.equal(c.divisionRuleBadgeHtml('autumn','은','동일선수','테사모'),'');
});

test('2025 금배 예선탈락만으로는 직전 대회 예외가 되지 않는다',async()=>{
  const c=setup({rows:[{...reg('o','테사모','금',['과거선수'],{_pastOutcome:{confirmed:true,result:'예선 탈락'}}),tournamentId:'old'},{...reg('s','테사모','은',['과거선수']),tournamentId:'spring'}]});
  const result=await classify(c,'과거선수');assert.equal(result.isDowngrade,true);assert.equal(result.prelimException,false);
});
test('김해시 기준은 기존 클럽별 2명 제한과 접수 차단을 유지한다',async()=>{
  const c=setup({org:'kimhae',rows:[{...reg('s','테사모','금',['가','나','다']),tournamentId:'spring'}]});
  assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div:'은',club:'테사모',names:['가','나']})).ok,true);
  assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div:'은',club:'테사모',names:['가','나','다']})).ok,false);
  assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div:'동',club:'테사모',names:['가']})).ok,false);
});
