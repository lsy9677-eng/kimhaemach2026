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
test('combined view delegates full leagues to their league-only view',()=>{
 const c={G:{tournaments:[{id:'t'}]},gDS:()=>({format:'roundrobin'}),renderBracketHTMLForDiv:(tid,div)=>'리그 '+tid+' '+div};vm.createContext(c);
 vm.runInContext(src.slice(src.indexOf('function renderCombinedBracketSection('),src.indexOf('function renderBracketView(')),c);
 assert.equal(c.renderCombinedBracketSection('t','은'),'리그 t 은');
});
