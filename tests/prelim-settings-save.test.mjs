import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {mergeCompetitionSettings} from '../assets/js/competition-settings.js';
const src=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
test('settings-only save stores courts, groups and title without drawing or changing matches',async()=>{
 const oldDraw={groups:[{teams:[0,1]}],allowedCourts:['old']},matches=[{id:'existing',winner:0}];
 const t={id:'t',divSettings:{은:{format:'group_knockout'}}};
 const c={AD:true,DW:{key:'t_은',tid:'t',div:'은',teams:[1,2,3,4],cfg:{format:'group_knockout',grpSizes:[2,2],advance:1}},G:{tournaments:[t],draws:{t_은:oldDraw},matches:{t_은:matches}},
 canManageBracket:()=>true,validPrelimGroupSizes:()=>true,ge:id=>id==='drawTitleInput'?{value:'은배 편성 기준'}:id==='drawAllowedCourtsWrap'?{}:null,
 getDrawAllowedCourtsFromModal:()=>['국제1','국제2'],sl:()=>{},toast:()=>{},updatePrelimSettingsSavedStatus:()=>{},
 saveCompetitionSettings:async(tid,patches)=>{t.divSettings.은=mergeCompetitionSettings(t.divSettings.은,patches.은,4,'jangyu');}};
 vm.createContext(c);vm.runInContext(src.slice(src.indexOf('async function savePrelimDrawSettings('),src.indexOf('window.setCustomPrelimGroupSizes=')),c);
 assert.equal(await c.savePrelimDrawSettings(),true);
 assert.deepEqual(Array.from(t.divSettings.은.prelimAllowedCourts),['국제1','국제2']);assert.deepEqual(Array.from(t.divSettings.은.prelimDrawSettings.groupSizes),[2,2]);assert.equal(t.divSettings.은.prelimDrawSettings.title,'은배 편성 기준');
 assert.equal(c.G.draws.t_은,oldDraw);assert.equal(c.G.matches.t_은,matches);
 c._k2td=()=>({tid:'t',div:'은'});
 vm.runInContext(src.slice(src.indexOf('function getDrawAllowedCourts('),src.indexOf('function getBracketAllowedCourts(')),c);
 assert.deepEqual(Array.from(c.getDrawAllowedCourts('t_은')),['국제1','국제2']);
 t.divSettings.은.prelimAllowedCourts=[];assert.deepEqual(Array.from(c.getDrawAllowedCourts('t_은')),[]);
});
test('full league saves preserve title and timestamp with one complete group',()=>{
 const next=mergeCompetitionSettings({},{format:'roundrobin',prelimAllowedCourts:['court1'],prelimDrawSettings:{title:'리그',savedAt:'saved',groupSizes:[2,2]}},4,'jangyu');
 assert.equal(next.prelimDrawSettings.title,'리그');assert.equal(next.prelimDrawSettings.savedAt,'saved');assert.deepEqual(next.prelimDrawSettings.groupSizes,[4]);assert.deepEqual(next.prelimAllowedCourts,['court1']);
});
