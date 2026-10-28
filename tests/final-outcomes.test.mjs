import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
const ranksSource=source.slice(source.indexOf('function getCompletedRoundRobinRanks('),source.indexOf('function renderRankingCard('));
const archiveSource=source.slice(source.indexOf('function buildPastArchiveBundle('),source.indexOf('async function ensurePastTournamentArchive('));
function setup(){
  const teams=['능동','모던','테사모','하모니'].map((club,i)=>({_id:'r'+i,club,players:[club+'선수'],_pastOutcome:{rank:null,result:'예선 참가',confirmed:false}}));
  const matches=[];for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)matches.push({phase:'group',group:0,t1:a,t2:b,winner:a});
  const rows=[1,0,3,2].map((ti,i)=>({ti,teamIdx:ti,rank:i+1,tiePending:false}));
  const c={G:{tournaments:[{id:'spring',date:'2026-03-29'}],teams:{'spring_은':teams},matches:{'spring_은':matches},draws:{'spring_은':{groups:[{teams:[0,1,2,3]}]}}},
    _k2td:()=>({tid:'spring',div:'은'}),gDS:()=>({format:'roundrobin'}),getMatchResultState:(_key,m)=>({done:m.winner!=null,winner:m.winner}),calcGS:()=>rows,
    getMainFinalMatch:()=>null,getMainOnlyMatches:matches=>matches.filter(m=>m.phase==='main'),pastArchiveOutcomeRank:t=>t.rank||null,getLiveTeamAchievementForHistory:()=>({rank:null,result:'예선 통과'}),console};
  vm.createContext(c);vm.runInContext(ranksSource+archiveSource,c);return c;
}
const bundle=c=>({regs:c.G.teams['spring_은'].map(t=>({...t,division:'은'})),matches:c.G.matches['spring_은'],draws:[]});
test('춘계 은배 풀리그: 순위표와 동일한 모던 우승·능동 준우승·하모니 3위·테사모 4위를 확정한다',()=>{
  const c=setup(),ranks=c.calcFinalRanks('spring_은',c.G.teams['spring_은'],[]);
  assert.deepEqual(Array.from(ranks,r=>[r.club,r.rank]),[['모던',1],['능동',2],['하모니',3],['테사모',4]]);
  const out=c.buildPastArchiveBundle('spring',bundle(c));
  assert.equal(out.divisionStates.은,'finalized');assert.equal(out.outcomeVersion,317);
  assert.equal(out.regs.find(r=>r.club==='모던')._pastOutcome.result,'우승');
  assert.equal(out.regs.find(r=>r.club==='능동')._pastOutcome.result,'준우승');
  assert.ok(out.regs.every(r=>r._pastOutcome.confirmed));
});
test('풀리그 일부 경기 미완료·누락·중복·잘못된 승자는 최종 순위로 확정하지 않는다',()=>{
  for(const modify of [c=>c.G.matches['spring_은'][0].winner=null,c=>c.G.matches['spring_은'].pop(),c=>c.G.matches['spring_은'].push({...c.G.matches['spring_은'][0]}),c=>c.G.matches['spring_은'][0].winner=99]){
    const c=setup();modify(c);assert.equal(c.getCompletedRoundRobinRanks('spring_은',c.G.teams['spring_은']).length,0);
    const out=c.buildPastArchiveBundle('spring',bundle(c));assert.equal(out.divisionStates.은,'pending');assert.ok(out.regs.every(r=>!r._pastOutcome.confirmed&&r._pastOutcome.result==='결과 미확정'));
  }
});
test('동률 미판정 또는 여러 예선조의 순위를 전체 대회 최종 성적으로 잘못 확정하지 않는다',()=>{
  const c=setup();c.calcGS=()=>[{ti:0,rank:null,tiePending:true}];
  assert.equal(c.getCompletedRoundRobinRanks('spring_은',c.G.teams['spring_은']).length,0);
  c.G.draws['spring_은'].groups.push({teams:[0,1]});assert.equal(c.getCompletedRoundRobinRanks('spring_은',c.G.teams['spring_은']).length,0);
});
test('과거 엑셀 순위와 토너먼트는 풀리그 조건으로 덮어쓰지 않는다',()=>{
  const c=setup();delete c.G.draws['spring_은'];assert.equal(c.getCompletedRoundRobinRanks('spring_은',c.G.teams['spring_은']),null);
  c.G.teams['spring_은'][0].rank=1;
  assert.equal(c.buildPastArchiveBundle('spring',bundle(c)).regs[0]._pastOutcome.result,'우승');
  c.gDS=()=>({format:'group_knockout'});assert.equal(c.getCompletedRoundRobinRanks('spring_은',c.G.teams['spring_은']),null);
});
