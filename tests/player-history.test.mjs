import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
const section=source.slice(source.indexOf('const PLAYER_REG_HISTORY_CACHE ='),source.indexOf('function popCF()'));
const spring={id:'spring',name:'2026 춘계',date:'2026-03-29',status:'finished'};
const autumn={id:'autumn',name:'2026 추계',date:'2026-11-08',status:'open'};
const history=(tid,div,extra={})=>({tid,div,club:'테사모',baseClub:'테사모',date:tid==='spring'?spring.date:autumn.date,tname:tid==='spring'?spring.name:autumn.name,...extra});
function setup({archives={},registrationRows=[]}={}){
  const c={G:{tournaments:[spring,autumn],players:{}},HIST_DATA:[],REG_YEAR:2026,G_REGISTRY:{2026:[{name:'이순보',club:'테사모'}]},AD:false,
    cleanName:n=>String(n||'').trim(),normName:n=>String(n||'').replace(/\s/g,''),normalizeClub:n=>String(n||'').trim(),baseClub:n=>String(n||'').replace(/[AB]$/,''),
    isSameRegistrationClub:(a,b)=>a===b,outputNormalizeDiv:d=>({'금배부':'금','gold':'금','은배부':'은','silver':'은'})[d]||d,
    _pastRosterTournamentMeta:tid=>[spring,autumn].find(t=>t.id===tid)||null,getPastArchive:tid=>archives[tid]||null,
    resolvePlayerDisplayClubInfo:()=>({mainClub:'테사모',subClubs:[]}),pKeyParse:key=>({name:key.split('__')[0],club:key.split('__')[1]||''}),normalizePhoneDigits:n=>String(n||''),getPlayerRegistryRow:()=>({name:'이순보',club:'테사모'}),
    collectLivePlayerHistory:()=>[],formatTournamentTitle:title=>title,correctedHistoricalClub:club=>club,dc:d=>d,dl:d=>d,
    collection:()=>null,where:()=>null,query:()=>null,db:{},getDocsFromServer:async()=>({forEach:fn=>registrationRows.forEach(r=>fn({data:()=>r}))}),console};
  vm.createContext(c);vm.runInContext(section,c);return c;
}

test('이순보: 같은 춘계의 오래된 은배 이력은 제외하고 실제 금배 8강만 표시·집계한다',()=>{
  const c=setup({archives:{spring:{regs:[{club:'테사모',division:'금',players:['이순보']}]}}});
  const p={name:'이순보',club:'테사모',wins:0,losses:0,history:[history('spring','은')]};
  c.G.players={'이순보__테사모':p};
  c.collectLivePlayerHistory=()=>[history('spring','금',{source:'archive',result:'8강'}),history('autumn','은',{source:'live',result:'참가'})];
  const html=c.buildPH('이순보',p);
  assert.equal((html.match(/class="hist-row"/g)||[]).length,2);
  assert.equal((html.match(/2026 춘계/g)||[]).length,1);
  assert.match(html,/8강/);assert.match(html,/금 1회/);assert.match(html,/은 1회/);
  assert.match(html,/psm-val">2</);assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','은')),false);
});

test('가장 높은 부서나 높은 순위가 아니라 확정 명단에 있는 실제 은배 기록을 남긴다',()=>{
  const c=setup({archives:{spring:{regs:[{club:'테사모',division:'은',players:['이순보']}]}}});
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','금',{rank:1})),false);
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','은')),true);
});

test('확정 명단의 동명이인·다른 클럽 출전을 현재 선수의 기록으로 사용하지 않는다',()=>{
  const c=setup({archives:{spring:{regs:[{club:'다른클럽',division:'금',players:['이순보']},{club:'테사모',division:'금',players:['다른선수']}]}}});
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','금')),false);
});

test('삭제된 대회를 가리키는 접수와 이력은 과거 대회·참가 횟수에 포함하지 않는다',async()=>{
  const c=setup({registrationRows:[{tournamentId:'deleted',division:'은',club:'테사모',players:['이순보']},{tournamentId:'spring',division:'금',club:'테사모',players:['이순보']}]});
  const result=await c.ensurePlayerRegistrationHistory('이순보');
  assert.equal(result.length,1);assert.equal(result[0].tid,'spring');
  assert.equal(c.isCurrentSavedParticipation('이순보',history('deleted','은')),false);
});

test('확정본이 없으면 서버 확인된 접수와 대조하며, 조회 전에는 기존 자료를 임의로 제거하지 않는다',async()=>{
  const c=setup({registrationRows:[{tournamentId:'spring',division:'금',club:'테사모',players:['이순보']}]});
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','은')),true);
  await c.ensurePlayerRegistrationHistory('이순보');
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','은',{rank:1})),false);
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','금')),true);
});

test('확정본의 같은 부서·같은 선수 기록은 한국어/영문 부서 별칭에도 일치한다',()=>{
  const c=setup({archives:{spring:{regs:[{club:'테사모',division:'금배부',players:['이 순 보']}]}}});
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','gold')),true);
});

test('선수마다 확정본 JSON을 다시 읽지 않으며 확정본이 바뀌면 판정을 갱신한다',()=>{
  const c=setup();let reads=0;
  c.getPastArchive=()=>{reads++;return {regs:[{club:'테사모',division:reads===1?'금':'은',players:['이순보']}]};};
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','금')),true);
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','은')),false);
  assert.equal(reads,1);
  const refreshed={...spring,pastArchive:{json:'updated'},pastArchiveRevision:1};
  c._pastRosterTournamentMeta=tid=>tid==='spring'?refreshed:autumn;
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','금')),false);
  assert.equal(c.isCurrentSavedParticipation('이순보',history('spring','은')),true);
  assert.equal(reads,2);
});
