import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
function context(){
 const c={G:{tournaments:[{id:'t',divSettings:{은:{prelimDrawSettings:{teamCount:3,groupSizes:[3]}}}}],teams:{t_은:[{club:'모던'},{club:'능동'},{club:'테사모'}]},matches:{},draws:{}},gDS:()=>({format:'group_knockout',grpSize:3}),outputHistoricalRegs:()=>[],outputHeader:()=>'<h1>대회</h1>',outputEsc:x=>String(x),outputResolveDivision:(tid,div)=>div,bracketPhasePublished:()=>true,outputHistoricalRegistrationFallback:()=>{throw new Error('must not invent a group from registrations');}};
 vm.createContext(c);vm.runInContext(src.slice(src.indexOf('function outputGeneratedPrelimSheet('),src.indexOf('function outputGeneratedMainTable(')),c);
 vm.runInContext(src.slice(src.indexOf('function outputPrelimHtml('),src.indexOf('function outputMainTableHtml(')),c);return c;
}
test('undrawn blank sheets show unknown slots without assigning any registered team',()=>{
 const c=context(),html=c.outputPrelimHtml('t','은',true);assert.match(html,/추첨 전/);assert.match(html,/미확정/);assert.match(html,/1번 팀 미정/);assert.doesNotMatch(html,/모던|능동|테사모/);
});
test('undrawn current-state sheets report no group assignment instead of invented fixtures',()=>{
 const c=context(),html=c.outputPrelimHtml('t','은',false);assert.match(html,/아직 없습니다/);assert.doesNotMatch(html,/모던|능동|테사모/);
});
