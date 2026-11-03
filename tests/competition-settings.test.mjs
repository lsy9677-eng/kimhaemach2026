import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {mergeCompetitionSettings} from '../assets/js/competition-settings.js';
const source=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
test('3, 4 and 5 team leagues override stale groups and require no main bracket',()=>{
 for(const n of [3,4,5]){
 const settings=mergeCompetitionSettings({format:'group_knockout',grpSize:3,advance:2,prelimDrawSettings:{groupSizes:[2,2]}},{format:'roundrobin'},n,'jangyu');
 assert.equal(settings.grpSize,n);assert.equal(settings.advance,1);assert.deepEqual(settings.prelimDrawSettings.groupSizes,[n]);assert.equal(settings.thirdPlaceMode,'shared');
 const c={G:{draws:{key:{groups:[{teams:Array.from({length:n},(_,i)=>i)}]}}}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function buildFreshGroupMatchesFromDraw('),source.indexOf('async function resetPrelimDrawOnly(')),c);
 const matches=c.buildFreshGroupMatchesFromDraw('key');assert.equal(matches.length,n*(n-1)/2);assert.ok(matches.every(m=>m.phase==='group'));
 }
});
test('changing league to groups removes stale saved league configuration',()=>{
 const previous=mergeCompetitionSettings({},{format:'roundrobin'},4,'jangyu');
 const next=mergeCompetitionSettings(previous,{format:'group_knockout',grpSize:2,advance:1},4,'jangyu');
 assert.equal(next.prelimDrawSettings,null);assert.equal(next.grpSize,2);
});
test('shared writer preserves server fields and persists both screens to the same config',async()=>{
 const t={id:'t',divSettings:{은:{format:'group_knockout',grpSize:2,advance:1}}};
 let server={divSettings:{은:{format:'group_knockout',grpSize:2,advance:1,guide:'preserve'},금:{format:'knockout'}}};
 const c={mergeCompetitionSettings,MATCH_ORGANIZATION:{id:'jangyu'},G:{tournaments:[t],matches:{}},canManageBracket:()=>true,
 gDS:(tour,div)=>tour.divSettings[div],getDivisionTeamCount:()=>4,pastArchiveLocalInvalidation:()=>{},increment:n=>n,doc:()=>null,db:{},
 runTransaction:async(db,fn)=>fn({get:async()=>({exists:()=>true,data:()=>server}),update:(ref,value)=>{server={...server,...value};}})};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('async function saveCompetitionSettings('),source.indexOf('async function saveBracketDivisionSettings(')),c);
 await c.saveCompetitionSettings('t',{은:{format:'roundrobin'}});assert.equal(server.divSettings.은.format,'roundrobin');assert.equal(server.divSettings.은.guide,'preserve');assert.equal(server.divSettings.금.format,'knockout');
 await c.saveCompetitionSettings('t',{은:{format:'group_knockout',grpSize:2,advance:1,prelimDrawSettings:{teamCount:4,groupSizes:[2,2],advance:1}}});
 assert.deepEqual(Array.from(server.divSettings.은.prelimDrawSettings.groupSizes),[2,2]);assert.equal(t.divSettings.은.format,'group_knockout');
});
test('Jangyu always uses shared third and never exposes a bronze match',()=>{
 const c={MATCH_ORGANIZATION:{id:'jangyu'},G:{matches:{key:[{phase:'bronze',winner:0}]}},normalizeThirdPlaceMode:()=> 'match'};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function getOrganizationThirdPlaceMode('),source.indexOf('function getMainFinalMatch(')),c);
 assert.equal(c.getOrganizationThirdPlaceMode({id:'t'},'은'),'shared');assert.equal(c.getBronzeMatch('key'),null);
});
test('draw configuration reads saved league format instead of stale group presets',()=>{
 const elements=new Map();const grp={innerHTML:'',parentElement:{prepend:el=>elements.set(el.id,el)}};elements.set('grpPresets',grp);
 const c={DW:{cfg:{},teams:[1,2,3,4]},gDS:t=>t.divSettings.은,ge:id=>elements.get(id),
 document:{createElement:()=>({setAttribute:()=>{},innerHTML:'',value:''})},updateAdvPresets:()=>{},calcGroupPresets:()=>{throw new Error('league must bypass group presets');}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function buildDrawPresets('),source.indexOf('// PHASE212:')),c);
 c.buildDrawPresets(4,{divSettings:{은:{format:'roundrobin',grpSize:3,advance:2,prelimDrawSettings:{teamCount:4,groupSizes:[2,2]}}}},'은');
 assert.equal(c.DW.cfg.format,'roundrobin');assert.deepEqual(Array.from(c.DW.cfg.grpSizes),[4]);assert.match(grp.innerHTML,/6경기/);assert.equal(elements.get('drawCompetitionFormat').value,'roundrobin');
});
