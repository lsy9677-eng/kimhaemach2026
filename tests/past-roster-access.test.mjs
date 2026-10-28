import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {baseClub,normalizeClub,normName} from '../assets/js/players.js';
const source=readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
const functions=source.slice(source.indexOf('function _pastRosterTeamLabel('),source.indexOf("let REGISTER_DIVISION_FILTER='all'"));
function setup(role='guest',club='모던'){
  const c={AD:role==='admin',REG:role==='director',CLUB_MEMBER:role==='member',REG_CLUB:role==='guest'?'':club,
    G:{clubs:['모던','테사모'],tournaments:[{id:'past',date:'2026-03-29',status:'finished'},{id:'current',date:'2026-11-08',status:'open'}],teams:{past_금:[{club:'모던',players:['가']},{club:'테사모',players:['나']}],current_은:[{club:'모던',players:['다']}],orphan_금:[{club:'모던',players:['라']}]}},HIST_DATA:[],
    baseClub,normalizeClub,normName,isSameRegistrationClub:(a,b)=>baseClub(normalizeClub(a))===baseClub(normalizeClub(b)),
    _k2td:key=>({tid:key.split('_')[0],div:key.split('_')[1]}),isPastArchiveTournament:t=>t.status==='finished',isIndividualTournament:()=>false,
    getRegClubInputValue:()=>'테사모',ge:id=>id==='regTS'?{value:'current'}:null,getRealtimeTargetTournamentId:()=>'current',
    fetchTournamentBundle:async()=>{},ensureDivisionRuleCache:async()=>{},toast:()=>{},console};
  c._pastRosterTournamentMeta=tid=>c.G.tournaments.find(t=>t.id===tid)||null;
  vm.createContext(c);vm.runInContext(functions,c);return c;
}
test('경기이사와 회원은 팀등록 입력 클럽과 무관하게 로그인한 클럽을 기본 조회한다',()=>{
  for(const role of ['director','member'])assert.equal(setup(role).getPastRosterReferenceClub(),'모던');
  assert.equal(setup().getPastRosterReferenceClub(),'');
});
test('조회는 공개하지만 불러오기는 관리자 또는 자기 클럽 경기이사만 허용한다',()=>{
  for(const role of ['guest','member'])assert.equal(setup(role).canImportPastRoster('모던'),false);
  const director=setup('director');assert.equal(director.canImportPastRoster('모던A'),true);assert.equal(director.canImportPastRoster('테사모'),false);
  assert.equal(setup('admin').canImportPastRoster('테사모'),true);
  assert.equal(director._pastRosterAddNames(['다른선수'],'테사모'),false);
});
test('회원·일반 방문자도 다른 클럽 및 전체 클럽의 지난 명단을 열 수 있다',async()=>{
  for(const role of ['guest','member','director']){
    const c=setup(role),renders=[];c._renderPastClubRosterModal=(club,entries,options)=>renders.push({club,entries,options});
    await c.openPastClubRosterReference('테사모','은배부');
    assert.equal(renders.at(-1).club,'테사모');assert.equal(renders.at(-1).options.division,'silver');
    await c.openPastClubRosterReference('__all__');assert.equal(renders.at(-1).club,'');
    await c.openPastClubRosterReference();assert.equal(renders.at(-1).club,role==='guest'?'':'모던');
  }
});
test('전체 클럽 조회는 현재 접수와 삭제된 대회 잔재를 포함하지 않는다',()=>{
  const c=setup(),rows=c._collectPastRosterLocal('','current');
  assert.equal(rows.length,2);assert.ok(rows.every(r=>r.tid==='past'));assert.deepEqual(Array.from(rows,r=>r.teamLabel),['모던','테사모']);
});
test('동일 클럽·동일 부서의 여러 팀만 A/B를 붙이며 다른 클럽이나 부서 때문에 팀명이 변하지 않는다',()=>{
  const c=setup(),teams=[{club:'모던',div:'금'},{club:'테사모',div:'금'},{club:'모던',div:'은'},{club:'모던',div:'금'}];
  assert.equal(c._pastRosterTeamDisplayLabel(teams[0],teams),'모던A');assert.equal(c._pastRosterTeamDisplayLabel(teams[3],teams),'모던B');
  assert.equal(c._pastRosterTeamDisplayLabel(teams[1],teams),'테사모');assert.equal(c._pastRosterTeamDisplayLabel(teams[2],teams),'모던');
});
