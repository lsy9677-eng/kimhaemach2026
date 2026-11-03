import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../assets/css/app.css',import.meta.url),'utf8');
for(const [kind,id,next] of [['Prelim','mManualPrelimDraw','function openManualPrelimDraw('],['Main','mManualMainDraw','function _manualMainSize(']]){
 test(`${kind} manual draw opens as a centered popup and both close controls dismiss it`,()=>{
  const nodes=new Map();
  const document={getElementById:id=>nodes.get(id),body:{appendChild:el=>nodes.set(el.id,el)},createElement:()=>{
   const classes=new Set();return {className:'',innerHTML:'',setAttribute:()=>{},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)},querySelector:()=>null,querySelectorAll:()=>[]};
  }};
  const c={document,ge:id=>nodes.get(id)};vm.createContext(c);
  vm.runInContext(src.slice(src.indexOf(`function _ensureManual${kind}Modal()`),src.indexOf(next)),c);
  const popup=c[`_ensureManual${kind}Modal`]();assert.equal(popup.className,'modal-overlay');assert.match(popup.innerHTML,/class="modal-box"/);assert.match(popup.innerHTML,/overflow-y:auto/);
  assert.match(css,/\.modal-overlay\{[^}]*position:fixed;[^}]*display:none;[^}]*align-items:center;justify-content:center/s);
  const om=src.slice(src.indexOf('function om(id){'),src.indexOf('\n',src.indexOf('function om(id){')));
  const cm=src.slice(src.indexOf('function cm(id){'),src.indexOf('\n',src.indexOf('function cm(id){')));vm.runInContext(om+'\n'+cm,c);
  const closeHandlers=[...popup.innerHTML.matchAll(/onclick="(cm\('[^']+'\))"/g)].map(m=>m[1]);assert.equal(closeHandlers.length,2);
  for(const handler of closeHandlers){c.om(id);assert.equal(popup.classList.contains('open'),true);vm.runInContext(handler,c);assert.equal(popup.classList.contains('open'),false);}
  assert.equal(c[`_ensureManual${kind}Modal`](),popup);
 });
}
