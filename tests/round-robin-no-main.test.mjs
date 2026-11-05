import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
test('full-league main pyramid renderer exits before publication or bracket generation',()=>{
 const start=src.indexOf('function renderActualMainPyramidForDiv('),end=src.indexOf('\n}',start)+2;
 const c={G:{tournaments:[{id:'t'}]},gDS:()=>({format:'roundrobin'})};vm.createContext(c);vm.runInContext(src.slice(start,end),c);
 assert.equal(c.renderActualMainPyramidForDiv('t','은'),'');
});
test('combined view summarizes full leagues without match operations or a main bracket',()=>{
 const c={G:{tournaments:[{id:'t'}]},gDS:()=>({format:'roundrobin'}),bracketPhasePublished:()=>true,getDrawAllowedCourts:()=>[],outputEsc:String,dl:String,renderBracketHTMLForDiv:()=>{throw Error('operations view must not be rendered')}};vm.createContext(c);
 vm.runInContext(src.slice(src.indexOf('function renderCombinedBracketSection('),src.indexOf('function renderBracketView(')),c);
 const html=c.renderCombinedBracketSection('t','은');assert.match(html,/전체 풀리그 · 본선 없음/);assert.doesNotMatch(html,/경기 운영/);
});
