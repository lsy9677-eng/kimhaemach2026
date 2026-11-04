import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
function fixture(count=7){
 const t={id:'t',divSettings:{은:{prelimDrawSettings:{teamCount:count,groupSizes:[3,4]}}}};
 const c={G:{tournaments:[t],teams:{t_은:Array.from({length:count},()=>({club:'표시되면안되는팀'}))},draws:{}},outputResolveDivision:(t,d)=>d,outputHistoricalRegs:()=>[],gDS:()=>({format:'group_knockout',grpSize:3}),validPrelimGroupSizes:(s,n)=>Array.isArray(s)&&s.every(v=>v>0)&&s.reduce((a,b)=>a+b,0)===n,outputHeader:()=>'<header>조편성표 · 현장 수기용</header>'};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function outputHandwrittenGroupSheet('),source.indexOf('function outputGeneratedPrelimSheet(')),c);return {c,t};
}
test('blank group sheets follow saved uneven sizes and leave names and courts empty after draw',()=>{
 const {c}=fixture();c.G.draws.t_은={groups:[{teams:[0,1,2]},{teams:[3,4,5,6]}]};const html=c.outputHandwrittenGroupSheet('t','은');assert.match(html,/1조 · 3팀/);assert.match(html,/2조 · 4팀/);assert.equal((html.match(/class="oc-team-write"><\/td>/g)||[]).length,7);assert.doesNotMatch(html,/표시되면안되는팀|vs|결과/);assert.match(html,/코트: ___/);
});
test('full league is one group and stale saved sizes are ignored',()=>{
 const {c,t}=fixture(4);c.gDS=()=>({format:'roundrobin',grpSize:3});assert.match(c.outputHandwrittenGroupSheet('t','은'),/전체 풀리그 · 4팀/);c.gDS=()=>({format:'group_knockout',grpSize:3});t.divSettings.은.prelimDrawSettings.teamCount=7;assert.equal((c.outputHandwrittenGroupSheet('t','은').match(/class="oc-team-write"/g)||[]).length,4);
});
test('no registered teams produces no invented groups',()=>{const {c}=fixture(0);assert.match(c.outputHandwrittenGroupSheet('t','은'),/등록된 팀이 없습니다/);});
