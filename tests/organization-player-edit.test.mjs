import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildPlayerRecordCard} from '../assets/js/player-registry-ui.js';
const source=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
function setup({admin=true,association=false,members=[]}={}){
 const calls=[],elements=new Map();
 const c={AD:admin,MATCH_ORGANIZATION:{requiresAssociationRegistration:association},REG_YEAR:2026,
 loadRegistry:async(year,force)=>{calls.push(['load',year,force]);return members;},
 cleanName:s=>s,transferName:s=>s,canonicalRegistryClub:s=>s,toast:(...x)=>calls.push(['toast',...x]),
 G:{clubs:['다른클럽']},loadAge65Certifications:async()=>{},ensureRegistryQuickEditModal:()=>{},
 ge:id=>{if(!elements.has(id))elements.set(id,{style:{}});return elements.get(id);},
 esc:s=>s,escAttr:s=>s,_ruleGenderKey:s=>s,isAge65CertifiedForDivisionRule:()=>false,
 updateRegistryQuickEditRegionHint:()=>{},updateRegistryQuickEditQualificationHint:()=>{}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('let ORGANIZATION_PLAYER_EDIT_DRAFT='),source.indexOf('function ensureRegistryQuickEditModal()')),c);
 return {c,calls,elements};
}
test('Jangyu participant absent from association can open a local draft without saving',async()=>{
 const {c,calls,elements}=setup();await c.openOrganizationPlayerEdit('장유선수','장유클럽');
 assert.equal(elements.get('rqemName').value,'장유선수');assert.equal(elements.get('rqemIdx').value,'-1');
 assert.match(elements.get('rqemClub').innerHTML,/장유클럽/);assert.equal(calls[0][2],true);
});
test('existing local member opens their gender and age certification',async()=>{
 const {c,elements}=setup({members:[{name:'선수',club:'클럽',gender:'F',age65Certified:true}]});
 await c.openOrganizationPlayerEdit('선수','클럽');assert.equal(elements.get('rqemIdx').value,'0');
 assert.equal(elements.get('rqemGender').checked,true);assert.equal(elements.get('rqemAge65').checked,true);
});
test('non-admin and association screen cannot invoke the organization editor',async()=>{
 for(const options of [{admin:false},{association:true}]){const {c,calls}=setup(options);await c.openOrganizationPlayerEdit('선수','클럽');assert.equal(calls.length,0);}
});
test('ambiguous same-name local members are not silently selected',async()=>{
 const {c,calls,elements}=setup({members:[{name:'선수',club:'클럽'},{name:'선수',club:'클럽'}]});
 await c.openOrganizationPlayerEdit('선수','클럽');assert.equal(elements.size,0);assert.equal(calls.at(-1)[0],'toast');
});
test('record cards expose certification editor only when enabled',()=>{
 const opts={row:{name:'선수',club:'클럽'},escapeHtml:s=>s.replaceAll('"','&quot;'),formatRecentLabel:s=>s};
 assert.doesNotMatch(buildPlayerRecordCard(opts),/openOrganizationPlayerEdit/);
 assert.match(buildPlayerRecordCard({...opts,canEdit:true}),/선수 수정·인증/);
});

test('saving an unregistered participant persists qualifications to the local registry',async()=>{
 const {c,elements}=setup();await c.openOrganizationPlayerEdit('장유선수','장유클럽');
 elements.get('rqemGender').checked=true;elements.get('rqemAge65').checked=true;
 let saved;
 Object.assign(c,{G_REGISTRY:{},normName:s=>s,resolveClubRegionForRegistry:()=>'',pKey:(n,club)=>n+'__'+club,
 confirm:()=>true,sl:()=>{},console:{error:()=>{}},rosterSaveNotice:()=>{},
 saveRegistry:async year=>{saved=JSON.parse(JSON.stringify(c.G_REGISTRY[year]));throw new Error('stop after registry persistence');}});
 vm.runInContext(source.slice(source.indexOf('async function saveRegistryQuickEditModalCore()'),source.indexOf('// 선수 등록 현황 탭 — 인라인 빠른 삭제')),c);
 await c.saveRegistryQuickEditModalCore();
 assert.equal(saved.length,1);assert.equal(saved[0].name,'장유선수');
 assert.equal(saved[0].gender,'F');assert.equal(saved[0].age65Certified,true);
});
