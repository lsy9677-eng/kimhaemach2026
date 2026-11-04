import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {outputPaperDimensions,planOutputCards} from '../assets/js/output-paper.js';
const source=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
test('paper dimensions match A4 and A3 in both orientations with printable margins',()=>{
 assert.deepEqual([outputPaperDimensions('A4','landscape').contentWidth,outputPaperDimensions('A4','landscape').contentHeight],[277,190]);
 assert.deepEqual([outputPaperDimensions('A3','portrait').width,outputPaperDimensions('A3','portrait').height],[297,420]);
 assert.deepEqual([outputPaperDimensions('A3','landscape').contentWidth,outputPaperDimensions('A3','landscape').contentHeight],[400,277]);
});
test('page planning combines small divisions but gives long tables and trees room',()=>{
 assert.deepEqual(planOutputCards([{rows:6},{rows:3},{rows:3}]),[[0,1,2]]);
 assert.deepEqual(planOutputCards([{rows:20},{rows:6}]),[[0],[1]]);
 assert.deepEqual(planOutputCards([{rows:0,tree:true},{rows:6}]),[[0],[1]]);
});
function setup(){
 const controls={outType:{value:'order-sheets',selectedOptions:[{textContent:'오더지'}]},outDS:{value:'__ALL__',options:[{value:'__ALL__'},{value:'__SELECTED__'},{value:'금'},{value:'은'}]}};
 const storage=new Map([['output_paper_settings',JSON.stringify({paper:'A3',direction:'auto',duplex:true})]]);
 const c={outputPaperDimensions,planOutputCards,outputElement:id=>controls[id],organizationLocalStorage:{getItem:key=>storage.get(key)||null},window:{},outputEsc:s=>String(s),dl:div=>div+'배부'};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function outputPaperSettings()'),source.indexOf('function outputCenterInnerHtml()')),c);
 vm.runInContext(source.slice(source.indexOf('function orderSheetSettings()'),source.indexOf('function outputCenterBody()')),c);
 return {c,controls};
}
test('all and custom division selections return only intended departments',()=>{
 const {c,controls}=setup();assert.deepEqual(Array.from(c.outputSelectedDivisions()),['금','은']);
 controls.outDS.value='__SELECTED__';controls.outDivisionChecks={querySelectorAll:()=>[{value:'은'}]};assert.deepEqual(Array.from(c.outputSelectedDivisions()),['은']);
 controls.outDS.value='금';assert.deepEqual(Array.from(c.outputSelectedDivisions()),['금']);
});
test('duplex order sheets honor A3, repeat equal front/back layouts and keep department fields blank',()=>{
 const {c}=setup(),spec=c.outputPaperSpec();assert.equal(spec.direction,'portrait');assert.equal(spec.contentWidth,277);
 const html=c.outputHandwrittenOrderSheets('t');assert.equal((html.match(/data-side="front"/g)||[]).length,1);assert.equal((html.match(/data-side="back"/g)||[]).length,1);
 assert.equal((html.match(/class="order-sheet-card"/g)||[]).length,8);assert.match(html,/부서: ______________/);assert.doesNotMatch(html,/금배부|은배부/);assert.match(html,/width:277mm/);
});

test('group sheets default to portrait and honor an explicit landscape selection',()=>{
 const {c,controls}=setup();controls.outType.value='groups-blank';assert.equal(c.outputPaperSpec().direction,'portrait');
 c.organizationLocalStorage.getItem=()=>JSON.stringify({paper:'A4',direction:'landscape'});assert.equal(c.outputPaperSpec().direction,'landscape');
});
