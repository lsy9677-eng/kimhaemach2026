import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');
function setup({busy=false,accept=true}={}){
 const elements=new Map(),calls=[];
 for(const id of ['regDS','aoReg','p1','regClubText','regDivisionOverview'])elements.set(id,{value:id==='regDS'?'금':id==='p1'?'선수':'',dataset:{playerId:'old'},style:{},scrollIntoView:()=>calls.push('scroll')});
 const c={rosterSaveBusy:busy,UNIFIED_TEAM_EDIT:{id:'team'},REGISTER_DIVISION_FILTER:'금',MY_CLUB_FILTER:true,
 ge:id=>elements.get(id),confirm:()=>{calls.push('confirm');return accept;},toast:()=>calls.push('toast'),
 renderRL:()=>{calls.push('render');if(c.ge('regDS').value)c.ge('aoReg').style.display='block';},
 navigateExperience:()=>{c.ge('regDS').value='금';},showRegistrationReceipt:(data,options)=>{c.receipt=options;},console};
 vm.createContext(c);
 vm.runInContext(source.slice(source.indexOf('function closeTeamRegistrationForm('),source.indexOf('async function beginUnifiedTeamEdit')),c);
 vm.runInContext(source.slice(source.indexOf('function openSavedRegistrationReceipt('),source.indexOf('function upDash()')),c);
 return {c,elements,calls};
}
test('successful registration or edit closes form and resets all roster filters',()=>{
 const {c,calls}=setup({busy:true});c.openSavedRegistrationReceipt({},'t','금');
 assert.equal(c.ge('regDS').value,'');assert.equal(c.ge('aoReg').style.display,'none');
 assert.equal(c.REGISTER_DIVISION_FILTER,'all');assert.equal(c.MY_CLUB_FILTER,false);assert.equal(c.UNIFIED_TEAM_EDIT,null);
 assert.equal(c.ge('p1').value,'');assert.equal(c.ge('p1').dataset.playerId,undefined);assert.ok(!calls.includes('confirm'));
 c.renderRL();assert.equal(c.ge('aoReg').style.display,'none');
 c.receipt.onRoster();assert.equal(c.ge('regDS').value,'');assert.equal(c.ge('aoReg').style.display,'none');
});
test('canceling close preserves unsaved form and editing state',()=>{
 const {c}=setup({accept:false});assert.equal(c.closeTeamRegistrationForm(),false);
 assert.equal(c.ge('p1').value,'선수');assert.equal(c.ge('regDS').value,'금');assert.equal(c.UNIFIED_TEAM_EDIT.id,'team');
});
test('manual close returns to full roster and save in progress prevents closing',()=>{
 const {c}=setup();assert.equal(c.closeTeamRegistrationForm(),true);assert.equal(c.ge('regDS').value,'');
 const {c:busy}=setup({busy:true});assert.equal(busy.closeTeamRegistrationForm(),false);assert.equal(busy.ge('p1').value,'선수');
});
