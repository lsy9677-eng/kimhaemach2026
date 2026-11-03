import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
test('past and current tournaments expose guide viewing for admins and visitors',()=>{
 for(const admin of [false,true]){
  const element={innerHTML:''};const c={AD:admin,MATCH_ORGANIZATION:{id:'kimhae'},G:{tournaments:[{id:'past',name:'지난대회',status:'finished',date:'2025-05-01'},{id:'current',name:'현재대회',status:'open',date:'2026-11-08'}],teams:{}},
   installGuideAuthenticationButton:()=>{},ge:()=>element,sortTournamentsLatest:x=>x,tournamentStatus:s=>({symbol:'',label:s}),isPastArchiveTournament:t=>t.status==='finished',getPastArchive:()=>null};
  vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function renderTL()'),source.indexOf('async function chgTS')),c);c.renderTL();
  assert.match(element.innerHTML,/openGuide\('past'\)/);assert.match(element.innerHTML,/openGuide\('current'\)/);
 }
});
