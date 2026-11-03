import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
test('migrated, legacy done and uploaded historical results use saved registration rankings',()=>{
 for(const flags of [{_migrated:true},{status:'done'},{isHistorical:true}]){
  const calls=[];const c={G:{tournaments:[{id:'legacy',...flags}]},HIST_DATA:[],window:{},
   ge:id=>id==='rankTS'?{value:'legacy'}:id==='rankDS'?{value:''}:{innerHTML:''},
   renderHistRankingFromRegistrations:tid=>calls.push(['historical',tid]),renderLiveRanking:()=>calls.push(['live'])};
  vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function renderRanking()'),source.indexOf('// ── 과거(엑셀 업로드) 대회 시합결과:')),c);c.renderRanking();
  assert.deepEqual(calls,[['historical','legacy']]);
 }
});
