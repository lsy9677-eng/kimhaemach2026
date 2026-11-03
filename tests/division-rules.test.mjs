import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as sharedAge65 from '../assets/js/shared-age65.js';

const source=readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
const ruleSource=source.slice(source.indexOf('// PHASE148:'),source.indexOf('function rosterPlayerHTML('));
const spring={id:'spring',name:'2026 춘계 장유연합회장배',date:'2026-03-29',status:'finished'};
const autumn={id:'autumn',name:'2026 추계 장유연합회장배',date:'2026-11-08',status:'open'};
const old={id:'old',name:'2025 춘계 장유연합회장배',date:'2025-05-01',status:'finished'};
const reg=(id,club,division,players,extra={})=>({_id:id,club,division,players,...extra});
function setup({org='jangyu',rows=[],registry=[],archives={},silverSelections={}}={}){
  const c={...sharedAge65,MATCH_ORGANIZATION:{id:org},REG_YEAR:2026,G:{tournaments:[old,spring,autumn],teams:{}},HIST_DATA:[],G_REGISTRY:{2026:registry},
    identityDb:{},doc:()=>null,getDocFromServer:async()=>({exists:()=>false}),getDocsFromServer:async()=>({docs:[]}),transferIdentityParts:name=>({name,tag:''}),registrationClubIdentityKey:value=>String(value||'').trim(),
    normName:n=>String(n||'').replace(/\s/g,''),transferName:n=>String(n||'').trim(),
    normalizeClub:n=>String(n||'').trim(),transferClub:n=>String(n||'').trim(),baseClub:n=>String(n||'').replace(/[A-Z]$/,''),
    _m26YearFromTournament:t=>Number(t.date.slice(0,4)),getTournamentDateKey:t=>t?.date||'',
    isIndividualTournament:()=>false,isPastArchiveTournament:t=>t.status==='finished',getPastArchive:id=>archives[id]||null,applyTournamentBundle:()=>{},ensurePastTournamentArchive:async id=>archives[id]||{},
    loadRegistry:async()=>registry,getMemberRegistry2026:()=>registry,console,
    collection:(_db,name)=>name,where:(_field,_op,value)=>value,query:(...args)=>args,db:{},
    getDocs:async q=>({docs:q[0]==='age65Certifications'?[]:rows.filter(r=>r.tournamentId===q[1]).map(r=>({id:r._id,data:()=>r}))}),
    esc:n=>String(n).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
    _k2td:key=>{const i=key.lastIndexOf('_');return {tid:key.slice(0,i),div:key.slice(i+1)};},
    isSameRegistrationClub:(a,b)=>a===b};
  vm.createContext(c);vm.runInContext(ruleSource,c);c.jangyuSilverSelection=id=>({team:silverSelections[id]||null});return c;
}
async function classify(c,name,div='은배부',club='테사모'){
  await c.ensureDivisionRuleCache('autumn');return c._divisionRuleClassifySync('autumn',div,name,club);
}
test('장유는 올해 은 기록이 있어도 작년 금 기록에 따라 하향으로 판정한다',async()=>{
  const c=setup({rows:[{...reg('o','테사모','금',['오태섭']),tournamentId:'old'},{...reg('s','테사모','은',['오태섭']),tournamentId:'spring'}]});
  const result=await classify(c,'오태섭');assert.equal(result.known,true);assert.equal(result.isDowngrade,true);assert.equal(result.profile.baselineLevel,3);
  const reason=c._divisionRuleReasonLines('autumn','은','오태섭','테사모').html;
  assert.match(reason,/2025 춘계 장유연합회장배/);
  assert.match(reason,/2025-05-01/);
});
test('은→동 일반 하향 1명은 허용하고 2명 이상은 차단한다',async()=>{
  const c=setup({rows:[{...reg('s','테사모','은',['가선수','나선수']),tournamentId:'spring'}]});
  const one=await c.validateTeamDivisionRules({tid:'autumn',div:'동',club:'테사모',names:['가선수']});
  assert.equal(one.ok,true);assert.equal(one.warnings.length,0);
  const two=await c.validateTeamDivisionRules({tid:'autumn',div:'동',club:'테사모',names:['가선수','나선수']});
  assert.equal(two.ok,false);assert.equal(two.ordinaryCount,2);assert.match(two.warnings[0],/하향 인원 초과/);
  assert.match(c.jangyuDivisionWarningsHtml(two.warnings),/접수 불가/);
  assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div:'동',club:'테사모',names:['가선수','가선수']})).ordinaryCount,1);
});
test('여성·65+ 인증은 2단계 하향에도 예외이며 일반 하향 정원에 포함하지 않는다',async()=>{
  const c=setup({rows:[{...reg('s','테사모','금',['여선수','시니어','일반']),tournamentId:'spring'}],registry:[{name:'여선수',club:'테사모',gender:'F'},{name:'시니어',club:'테사모',age65Certified:true}]});
  const result=await c.validateTeamDivisionRules({tid:'autumn',div:'동',club:'테사모',names:['여선수','시니어','일반']});
  assert.equal(result.ok,true);assert.equal(result.exceptionCount,2);assert.equal(result.warnings.length,0);
  assert.equal((await classify(c,'일반','동')).exceptionApproved,false);
});
test('최하위 확정팀만 은배 자격을 부여하고 본선팀과 미확정팀은 제외한다',async()=>{
  const eliminated=reg('b','하모니','금',['B선수'],{_pastOutcome:{confirmed:true,result:'예선 참가'}});
  const main=reg('a','하모니','금',['A선수'],{_pastOutcome:{confirmed:true,result:'준우승'}});
  const pending=reg('p','하모니','금',['미확정'],{_pastOutcome:{confirmed:false,result:'예선 참가'}});
  const c=setup({rows:[eliminated,main,pending].map(r=>({...r,_pastOutcome:undefined,tournamentId:'spring'})),archives:{spring:{regs:[eliminated,main,pending]}},silverSelections:{spring:{id:'b',club:'하모니',players:['B선수']}}});
  assert.equal((await classify(c,'B선수','은','하모니')).prelimException,true);
  assert.equal((await classify(c,'A선수','은','하모니')).prelimException,false);
  assert.equal((await classify(c,'미확정','은','하모니')).prelimException,false);
  assert.equal((await classify(c,'B선수','동','하모니')).prelimException,false);
  const result=await c.validateTeamDivisionRules({tid:'autumn',div:'은',club:'하모니',names:['B선수','A선수']});
  assert.equal(result.ordinaryCount,1);assert.equal(result.ok,true);assert.equal(result.warnings.length,0);
  assert.match(c.divisionRuleBadgeHtml('autumn','은','B선수','하모니'),/금배 최하위 은배 자격/);
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
  assert.equal(c.divisionRuleBadgeHtml('autumn','은','동일선수','테사모').replace(/^<span data-shared-age65-badge[^>]*><\/span>$/,''),'');
});

test('2025 금배 예선탈락만으로는 직전 대회 예외가 되지 않는다',async()=>{
  const c=setup({rows:[{...reg('o','테사모','금',['과거선수'],{_pastOutcome:{confirmed:true,result:'예선 탈락'}}),tournamentId:'old'},{...reg('s','테사모','은',['과거선수']),tournamentId:'spring'}]});
  const result=await classify(c,'과거선수');assert.equal(result.isDowngrade,true);assert.equal(result.prelimException,false);
});

test('장유는 상반기와 전년도의 최신 확정 대회를 각각 하나씩 선택한다',()=>{
 const c=setup();c.G.tournaments.push({id:'june',date:'2026-06-30',status:'finished'},{id:'july',date:'2026-07-01',status:'finished'},{id:'december',date:'2025-12-31',status:'finished'});
 assert.deepEqual(Array.from(c._rulePrevTournaments(autumn),t=>t.id),['june','december']);
 assert.deepEqual(Array.from(c._rulePrevTournaments(spring),t=>t.id),['december']);
});

test('장유는 올해 상반기 출전 기록이 없어도 작년 금배 기록을 판정에 포함한다',async()=>{
 const c=setup({rows:[{...reg('o','테사모','금',['작년만']),tournamentId:'old'}]});
 assert.equal((await classify(c,'작년만')).known,true);
 assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div:'은',club:'테사모',names:['작년만']})).ok,true);
});

test('김해시의 전년도 기록과 우승 승격 기준은 유지한다',async()=>{
 const c=setup({org:'kimhae',rows:[{...reg('o','테사모','은',['우승자'],{rank:1}),tournamentId:'old'}]});
 const result=await classify(c,'우승자');assert.equal(result.profile.promoted,true);assert.equal(result.profile.baselineLevel,3);
});
test('김해시 기준은 기존 클럽별 2명 제한과 접수 차단을 유지한다',async()=>{
  const c=setup({org:'kimhae',rows:[{...reg('s','테사모','금',['가','나','다']),tournamentId:'spring'}]});
  assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div:'은',club:'테사모',names:['가','나']})).ok,true);
  assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div:'은',club:'테사모',names:['가','나','다']})).ok,false);
  assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div:'동',club:'테사모',names:['가']})).ok,false);
});

 test('작년 금배라도 일반 하향 1명은 은·동배 접수를 허용한다',async()=>{
 const c=setup({rows:[{...reg('o','테사모','금',['작년금']),tournamentId:'old'},{...reg('s','테사모','은',['작년금']),tournamentId:'spring'}]});
 for(const div of ['은','동']){const result=await c.validateTeamDivisionRules({tid:'autumn',div,club:'테사모',names:['작년금']});assert.equal(result.ok,true);assert.equal(result.ordinaryCount,1);}
 assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div:'금',club:'테사모',names:['작년금']})).ok,true);
 });
 test('작년 금배 선수의 여성·65세 인증은 하향 예외로 유지한다',async()=>{
 const c=setup({rows:[{...reg('o','테사모','금',['여성','시니어']),tournamentId:'old'}],registry:[{name:'여성',club:'테사모',gender:'F'},{name:'시니어',club:'테사모',age65Certified:true}]});
 for(const div of ['은','동'])assert.equal((await c.validateTeamDivisionRules({tid:'autumn',div,club:'테사모',names:['여성','시니어']})).ok,true);
 });

test('금배와 은배 출전자를 합쳐 팀당 일반 하향 1명만 허용한다',async()=>{
 const c=setup({rows:[{...reg('o','테사모','금',['금선수']),tournamentId:'old'},{...reg('s','테사모','은',['은선수']),tournamentId:'spring'}]});
 const result=await c.validateTeamDivisionRules({tid:'autumn',div:'동',club:'테사모',names:['금선수','은선수']});
 assert.equal(result.ok,false);assert.equal(result.ordinaryCount,2);assert.match(result.error,/팀당 허용 1명/);
});

test('최하위 팀 선수의 은배 자격은 이후 은배 출전과 연도 변경에도 유지한다',async()=>{
 const c=setup({rows:[{...reg('o','테사모','금',['유지선수']),tournamentId:'old'},{...reg('s','테사모','은',['유지선수']),tournamentId:'spring'}],silverSelections:{old:{id:'last',club:'테사모',players:['유지선수']}}});
 assert.equal((await classify(c,'유지선수')).prelimException,true);
 c.G.tournaments.push({id:'future',name:'2027 대회',date:'2027-11-01',status:'open'});
 await c.ensureDivisionRuleCache('future');
 const result=c._divisionRuleClassifySync('future','은','유지선수','테사모');assert.equal(result.prelimException,true);assert.equal(result.silverSource.tid,'old');
 assert.equal(c._divisionRuleClassifySync('future','동','유지선수','테사모').prelimException,false);
});
